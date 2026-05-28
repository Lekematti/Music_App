const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma/prismaClient'); // Prisma database connection
const { protect } = require('../middleware/authMiddleware');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email) => email.trim().toLowerCase();
const isValidEmail = (email) => EMAIL_REGEX.test(email);

// JWT Token generator
const generateToken = (id, email) => {
    return jwt.sign({ id, email }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const trimmedUsername = typeof username === 'string' ? username.trim() : '';
        const normalizedEmail = typeof email === 'string' ? normalizeEmail(email) : '';
        const passwordValue = typeof password === 'string' ? password : '';

        if (!trimmedUsername || !normalizedEmail || !passwordValue) {
            return res.status(400).json({ message: 'Please fill in all fields' });
        }

        if (trimmedUsername.length < 3) {
            return res.status(400).json({ message: 'Username must be at least 3 characters long' });
        }

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({ message: 'Please enter a valid email address' });
        }

        if (passwordValue.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Check if email or username already exists in database
        const userExists = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: normalizedEmail },
                    { username: trimmedUsername }
                ]
            }
        });

        if (userExists) {
            return res.status(400).json({ message: 'User with this email or username already exists' });
        }

        // Password hash
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passwordValue, salt);

        // Create user in the database
        const newUser = await prisma.user.create({
            data: {
                username: trimmedUsername,
                email: normalizedEmail,
                password: hashedPassword
            }
        });

        res.status(201).json({
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            token: generateToken(newUser.id, newUser.email)
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
        const { email, password } = req.body;
        const normalizedEmail = typeof email === 'string' ? normalizeEmail(email) : '';
        const passwordValue = typeof password === 'string' ? password : '';

        if (!normalizedEmail || !passwordValue) {
            return res.status(400).json({ message: 'Please fill in all fields' });
        }

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({ message: 'Please enter a valid email address' });
        }

        // Find user in database by email
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        // Check password and send JWT token
        if (user && (await bcrypt.compare(passwordValue, user.password))) {
            res.json({
                id: user.id,
                username: user.username,
                email: user.email,
                token: generateToken(user.id, user.email)
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
        // Find user in database using email from JWT
        const user = await prisma.user.findUnique({
            where: { email: req.user.email }
        });

        if (user) {
            res.json({
                id: user.id,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Update logged in user's username or email
// @route   PUT /api/auth/me
// @access  Private
router.put('/me', protect, async (req, res) => {
    try {
        const { username, email } = req.body || {};
        if (!username && !email) return res.status(400).json({ message: 'Nothing to update' });

        const buildUpdates = () => {
            const out = {};
            if (typeof username === 'string') {
                const trimmed = username.trim();
                if (trimmed.length < 3) return { error: 'Username must be at least 3 characters long' };
                out.username = trimmed;
            }
            if (typeof email === 'string') {
                const normalized = normalizeEmail(email);
                if (!isValidEmail(normalized)) return { error: 'Please enter a valid email address' };
                out.email = normalized;
            }
            return { updates: out };
        };

        const { error, updates } = buildUpdates();
        if (error) return res.status(400).json({ message: error });
        if (!updates || Object.keys(updates).length === 0) return res.status(400).json({ message: 'Nothing to update' });

        const conflict = await prisma.user.findFirst({
            where: {
                OR: Object.keys(updates).map(k => ({ [k]: updates[k] })),
                NOT: { id: req.user.id }
            }
        });
        if (conflict) return res.status(400).json({ message: 'Username or email already in use' });

        const updated = await prisma.user.update({ where: { id: req.user.id }, data: updates });

        res.json({
            id: updated.id,
            username: updated.username,
            email: updated.email,
            avatarUrl: updated.avatarUrl,
            token: generateToken(updated.id, updated.email),
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
        console.log('Password update request for user:', req.user);
        console.log('Request body keys:', Object.keys(req.body || {}));
        if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
            return res.status(400).json({ message: 'Please provide current and new passwords' });
        }

        if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters long' });

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(400).json({ message: 'Current password is incorrect' });

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating password' });
    }
});

module.exports = router;