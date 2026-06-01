const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/authMiddleware');
const authService = require('../services/authService');
const { toSignedPlaybackUrl } = require('../lib/mediaStorage');
const prisma = require('../prisma/prismaClient');

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});

const buildAvatarResponseUrl = async (storedAvatarUrl) => {
    const resolved = await authService.resolveAvatarUrl(storedAvatarUrl);
    return toSignedPlaybackUrl(resolved, 'avatars');
};

router.setSupabaseClient = authService.setSupabaseClient;

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', upload.single('avatarFile'), async (req, res) => {
    try {
        const { username, email, password, avatarUrl } = req.body || {};
        const avatarFile = req.file;
        const registrationInput = authService.validateRegistrationInput({ username, email, password, avatarUrl });

        if (registrationInput.error) {
            return res.status(400).json({ message: registrationInput.error });
        }

        const { trimmedUsername, normalizedEmail, passwordValue, normalizedAvatarUrl } = registrationInput;

        const userExists = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: normalizedEmail },
                    { username: trimmedUsername },
                ],
            },
        });

        if (userExists) {
            return res.status(400).json({ message: 'User with this email or username already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passwordValue, salt);

        const newUser = await prisma.user.create({
            data: {
                username: trimmedUsername,
                email: normalizedEmail,
                password: hashedPassword,
                avatarUrl: null,
            },
        });

        const persistedAvatar = await authService.persistAvatarForUser({
            avatarFile,
            trimmedUsername,
            userId: newUser.id,
            resolvedAvatarUrl: normalizedAvatarUrl,
        });

        if (persistedAvatar.error) {
            return res.status(persistedAvatar.status || 500).json({ message: persistedAvatar.error });
        }

        res.status(201).json({
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            avatarUrl: await buildAvatarResponseUrl(persistedAvatar.value || null),
            token: authService.generateToken(newUser.id, newUser.email),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body || {};
        const normalizedEmail = typeof email === 'string' ? authService.normalizeEmail(email) : '';
        const passwordValue = typeof password === 'string' ? password : '';

        if (!normalizedEmail || !passwordValue) {
            return res.status(400).json({ message: 'Please fill in all fields' });
        }

        if (!authService.isValidEmail(normalizedEmail)) {
            return res.status(400).json({ message: 'Please enter a valid email address' });
        }

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (user && (await bcrypt.compare(passwordValue, user.password))) {
            res.json({
                id: user.id,
                username: user.username,
                email: user.email,
                avatarUrl: await buildAvatarResponseUrl(user.avatarUrl),
                token: authService.generateToken(user.id, user.email),
            });
        } else {
            res.status(400).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// @desc    Get logged in user info
// @route   GET /api/auth/me
// @access  Private (Requires JWT token)
router.get('/me', protect, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { email: req.user.email },
        });

        if (user) {
            res.json({
                id: user.id,
                username: user.username,
                email: user.email,
                avatarUrl: await buildAvatarResponseUrl(user.avatarUrl),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Update logged in user's username, email, or profile picture
// @route   PUT /api/auth/me
// @access  Private
router.put('/me', protect, upload.single('avatarFile'), async (req, res) => {
    try {
        const { username, email, avatarUrl } = req.body || {};
        const avatarFile = req.file;

        if (!username && !email && avatarUrl === undefined && !avatarFile) {
            return res.status(400).json({ message: 'Nothing to update' });
        }

        const built = authService.buildProfileUpdateData({ username, email, avatarUrl, avatarFile });
        if (built.error) {
            return res.status(400).json({ message: built.error });
        }

        let updates = built.updates || {};
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'Nothing to update' });
        }

        const avatarResult = await authService.uploadAvatarIfNeeded(updates, req.user.id);
        if (avatarResult.error) {
            return res.status(avatarResult.status || 500).json({ message: avatarResult.error });
        }
        updates = avatarResult.updates;

        const conflict = await authService.findUpdateConflict(updates, req.user.id);
        if (conflict) {
            return res.status(400).json({ message: 'Username or email already in use' });
        }

        const updated = await prisma.user.update({
            where: { id: req.user.id },
            data: updates,
        });

        await authService.ensureAvatarMarker(updated);

        res.json({
            id: updated.id,
            username: updated.username,
            email: updated.email,
            avatarUrl: await buildAvatarResponseUrl(updated.avatarUrl),
            token: authService.generateToken(updated.id, updated.email),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during update' });
    }
});

// @desc    Update logged in user's password
// @route   PUT /api/auth/me/password
// @access  Private
router.put('/me/password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body || {};
        if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
            return res.status(400).json({ message: 'Please provide current and new passwords' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' });
        }

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating password' });
    }
});

// @desc    Delete logged in user's account and related data
// @route   DELETE /api/auth/me
// @access  Private
router.delete('/me', protect, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const client = authService.getSupabase();
        await authService.deleteUserAccountAndRelatedData(user, client);

        res.json({ message: 'Account and related data deleted' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ message: 'Server error deleting account' });
    }
});

module.exports = router;

try {
    authService.getSupabase();
} catch (error) {
    console.error('Supabase init at module load failed:', error?.message || error);
}
