const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const crypto = require('node:crypto');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');
const prisma = require('../prisma/prismaClient'); // Prisma database connection
const { protect } = require('../middleware/authMiddleware');
const songRoutes = require('./songRoutes');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email) => email.trim().toLowerCase();
const isValidEmail = (email) => EMAIL_REGEX.test(email);

// JWT Token generator
const generateToken = (id, email) => {
    return jwt.sign({ id, email }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROFILE_PICTURES_BUCKET = 'avatars';

let supabase = null;

const getSupabase = () => {
    if (supabase) return supabase;
    if (supabaseUrl && supabaseServiceKey) {
        if (supabaseUrl.includes('example.supabase.co')) return null;
        try {
            supabase = createClient(supabaseUrl, supabaseServiceKey);
            // Try to ensure the profile pictures bucket exists in background.
            // Do not block startup if this fails.
            (async () => {
                try {
                    await ensureProfilePicturesBucket(supabase);
                } catch (err) {
                    console.error('Failed to ensure avatars bucket at startup:', err?.message || err);
                }
            })();
        } catch (error) {
            supabase = null;
            console.error('Failed to create Supabase client:', error?.message ?? error);
        }
    }
    return supabase;
};

router.setSupabaseClient = (client) => {
    supabase = client;
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});

const imageMimeTypes = new Set(['image/jpeg', 'image/png']);
let profilePicturesBucketReadyPromise = null;

const extensionFromMime = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
};

const toStorageFolder = (rawUsername, fallback = 'user') => {
    const safe = String(rawUsername || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

    if (safe) {
        return safe;
    }

    const fallbackSafe = String(fallback || 'user').replace(/[^a-z0-9._-]+/gi, '-');
    return fallbackSafe || 'user';
};

const buildPath = (folder, ext) => {
    const uniqueSuffix = crypto.randomBytes(12).toString('hex');
    return `${folder}/${Date.now()}-${uniqueSuffix}.${ext}`;
};

const ensureProfilePicturesBucket = async (client) => {
    if (!client?.storage) {
        return { error: 'Supabase storage is not configured' };
    }

    if (!profilePicturesBucketReadyPromise) {
        profilePicturesBucketReadyPromise = (async () => {
            try {
                const { data: buckets, error: listError } = await client.storage.listBuckets();
                if (listError) {
                    return { error: `Failed to inspect Supabase buckets: ${listError.message}` };
                }

                const bucketExists = Array.isArray(buckets)
                    && buckets.some((bucket) => bucket?.name === PROFILE_PICTURES_BUCKET);

                if (bucketExists) {
                    return { value: true };
                }

                const { error: createError } = await client.storage.createBucket(PROFILE_PICTURES_BUCKET, {
                    public: true,
                });

                if (createError) {
                    return { error: `Failed to create profile picture bucket: ${createError.message}` };
                }

                return { value: true };
            } catch (error) {
                return { error: `Failed to ensure profile picture bucket: ${error?.message ?? error}` };
            }
        })().finally(() => {
            profilePicturesBucketReadyPromise = null;
        });
    }

    return profilePicturesBucketReadyPromise;
};

const resolveImageExtension = (file) => {
    const mimeExtension = extensionFromMime[file?.mimetype];
    if (mimeExtension) {
        return mimeExtension;
    }

    const originalExtension = path.extname(file?.originalname || '').replace('.', '').toLowerCase();
    if (originalExtension === 'jpeg') {
        return 'jpg';
    }

    if (imageMimeTypes.has(`image/${originalExtension}`) || ['jpg', 'png', 'webp'].includes(originalExtension)) {
        return originalExtension;
    }

    return null;
};

const uploadProfilePicture = async (client, username, file, fallbackFolder = 'user') => {
    if (!file) {
        return null;
    }

    const bucketReady = await ensureProfilePicturesBucket(client);
    if (bucketReady?.error) {
        return bucketReady;
    }

    const fileExt = resolveImageExtension(file);
    if (!fileExt) {
        return { error: 'Profile picture must be JPG, PNG, or WEBP' };
    }

    const folder = toStorageFolder(username, fallbackFolder);
    const filePath = buildPath(folder, fileExt);
    const { error: uploadError } = await client.storage
        .from(PROFILE_PICTURES_BUCKET)
        .upload(filePath, file.buffer, {
            contentType: file.mimetype || `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
            upsert: false,
        });

    if (uploadError) {
        return { error: `Profile picture upload failed: ${uploadError.message}` };
    }

    return { value: filePath };
};

const writeAvatarMarker = async (client, username, userId, avatarPath) => {
    if (!client || !username || !userId || !avatarPath) return;
    try {
        let key;
        let contentType;
        let body;
        key = `${username}/.info.png`;
        contentType = 'image/png';
        body = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B9s4hZQAAAABJRU5ErkJggg==', 'base64');

        const { data, error } = await client.storage.from(PROFILE_PICTURES_BUCKET).upload(key, body, {
            contentType,
            upsert: true,
        });
        if (error) console.error('Avatar marker upload error', key, error?.message || error);
    } catch (err) {
        console.error('Failed to write avatar marker for', username, err?.message || err);
    }
};

const resolveAvatarUrl = async (storedAvatarUrl) => {
    if (!storedAvatarUrl || typeof storedAvatarUrl !== 'string') {
        return null;
    }

    if (/^https?:\/\//i.test(storedAvatarUrl)) {
        return storedAvatarUrl;
    }

    const client = getSupabase();
    if (!client) {
        return storedAvatarUrl;
    }

    const bucketReady = await ensureProfilePicturesBucket(client);
    if (bucketReady?.error) {
        return storedAvatarUrl;
    }

    const bucket = client.storage.from(PROFILE_PICTURES_BUCKET);
    // Match song cover logic: return Supabase public URL for the object.
    const { data } = bucket.getPublicUrl(storedAvatarUrl);
    return data?.publicUrl || storedAvatarUrl;
};

const normalizeAvatarUrl = (avatarUrl) => {
    if (avatarUrl === undefined || avatarUrl === null) {
        return { value: null };
    }

    if (typeof avatarUrl !== 'string') {
        return { error: 'Please enter a valid profile picture URL' };
    }

    const trimmedAvatarUrl = avatarUrl.trim();
    if (!trimmedAvatarUrl) {
        return { value: null };
    }

    try {
        const parsedUrl = new URL(trimmedAvatarUrl);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return { error: 'Please enter a valid profile picture URL' };
        }

        return { value: parsedUrl.toString() };
    } catch {
        return { error: 'Please enter a valid profile picture URL' };
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', upload.single('avatarFile'), async (req, res) => {
    try {
        const { username, email, password, avatarUrl } = req.body || {};
        const trimmedUsername = typeof username === 'string' ? username.trim() : '';
        const normalizedEmail = typeof email === 'string' ? normalizeEmail(email) : '';
        const passwordValue = typeof password === 'string' ? password : '';
        const avatarFile = req.file;
        const { value: normalizedAvatarUrl, error: avatarUrlError } = normalizeAvatarUrl(avatarUrl);

        if (avatarUrlError) {
            return res.status(400).json({ message: avatarUrlError });
        }

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

        let resolvedAvatarUrl = normalizedAvatarUrl;

        // Create user in the database (avatar will be uploaded using user.id if file provided)
        const newUser = await prisma.user.create({
            data: {
                username: trimmedUsername,
                email: normalizedEmail,
                password: hashedPassword,
                avatarUrl: null,
            }
        });

        // If an avatar file was provided, upload it using the user's id as the folder
        let finalAvatarPath = null;
        if (avatarFile) {
            const client = getSupabase();
            if (!client) {
                // rollback: delete created user to avoid orphaned DB row
                await prisma.user.delete({ where: { id: newUser.id } }).catch(() => {});
                return res.status(500).json({ message: 'Supabase storage is not configured' });
            }

            const uploadedAvatar = await uploadProfilePicture(client, trimmedUsername, avatarFile, newUser.id);
            if (uploadedAvatar?.error) {
                // rollback: delete created user
                await prisma.user.delete({ where: { id: newUser.id } }).catch(() => {});
                return res.status(502).json({ message: uploadedAvatar.error });
            }

            finalAvatarPath = uploadedAvatar?.value ?? null;

            if (finalAvatarPath) {
                await prisma.user.update({ where: { id: newUser.id }, data: { avatarUrl: finalAvatarPath } });
                    // Write a human-readable marker (username prefix) for Supabase UI
                    try {
                        await writeAvatarMarker(client, trimmedUsername, newUser.id, finalAvatarPath).catch(() => {});
                    } catch (err) {
                        // Non-fatal: marker upload failure should not block registration
                        console.warn('writeAvatarMarker failed', err?.message || err);
                    }
            }
        } else if (resolvedAvatarUrl) {
            // If registration provided an external avatarUrl (http), store it as-is
            await prisma.user.update({ where: { id: newUser.id }, data: { avatarUrl: resolvedAvatarUrl } });
            finalAvatarPath = resolvedAvatarUrl;
        }

        const resolved = await resolveAvatarUrl(finalAvatarPath || null);
        const playbackUrl = typeof songRoutes.toSignedPlaybackUrl === 'function'
            ? await songRoutes.toSignedPlaybackUrl(resolved, 'avatars')
            : resolved;

        res.status(201).json({
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            avatarUrl: playbackUrl,
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
                avatarUrl: await resolveAvatarUrl(user.avatarUrl),
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
            const resolved = await resolveAvatarUrl(user.avatarUrl);
            const playbackUrl = typeof songRoutes.toSignedPlaybackUrl === 'function'
                ? await songRoutes.toSignedPlaybackUrl(resolved, 'avatars')
                : resolved;

            res.json({
                id: user.id,
                username: user.username,
                email: user.email,
                avatarUrl: playbackUrl
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
        if (!username && !email && avatarUrl === undefined && !avatarFile) return res.status(400).json({ message: 'Nothing to update' });

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
            if (avatarFile) {
                out.avatarFile = avatarFile;
            }
            if (avatarUrl !== undefined) {
                const { value, error } = normalizeAvatarUrl(avatarUrl);
                if (error) return { error };
                out.avatarUrl = value;
            }
            return { updates: out };
        };

        const { error, updates } = buildUpdates();
        if (error) return res.status(400).json({ message: error });
        if (!updates || Object.keys(updates).length === 0) return res.status(400).json({ message: 'Nothing to update' });

        let finalAvatarUrl = updates.avatarUrl;
        if (updates.avatarFile) {
            const client = getSupabase();
            if (!client) {
                return res.status(500).json({ message: 'Supabase storage is not configured' });
            }

            const currentUser = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: { username: true },
            });
            if (!currentUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            const storageUsername = updates.username || currentUser.username;
            const uploadedAvatar = await uploadProfilePicture(client, storageUsername, updates.avatarFile, req.user.id);
            if (uploadedAvatar?.error) {
                return res.status(502).json({ message: uploadedAvatar.error });
            }

            finalAvatarUrl = uploadedAvatar?.value ?? null;
            delete updates.avatarFile;
            delete updates.avatarUrl;
            updates.avatarUrl = finalAvatarUrl;
        }

        const conflictChecks = [];
        if (updates.username) conflictChecks.push({ username: updates.username });
        if (updates.email) conflictChecks.push({ email: updates.email });

        if (conflictChecks.length > 0) {
            const conflict = await prisma.user.findFirst({
                where: {
                    OR: conflictChecks,
                    NOT: { id: req.user.id }
                }
            });
            if (conflict) return res.status(400).json({ message: 'Username or email already in use' });
        }

        const updated = await prisma.user.update({ where: { id: req.user.id }, data: updates });

        const resolved = await resolveAvatarUrl(updated.avatarUrl);
        const playbackUrl = typeof songRoutes.toSignedPlaybackUrl === 'function'
            ? await songRoutes.toSignedPlaybackUrl(resolved, 'avatars')
            : resolved;

        // Ensure username-based marker exists for Supabase UI
        try {
            const client = getSupabase();
            if (client && updated.username) {
                await writeAvatarMarker(client, updated.username, updated.id, updated.avatarUrl);
            }
        } catch (e) {
            console.error('Failed to ensure avatar marker after update', e?.message || e);
        }

        res.json({
            id: updated.id,
            username: updated.username,
            email: updated.email,
            avatarUrl: playbackUrl,
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

// @desc    Delete logged in user's account and related data
// @route   DELETE /api/auth/me
// @access  Private
router.delete('/me', protect, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const client = getSupabase();

        // Collect songs and storage references before deleting DB rows
        const songs = await prisma.song.findMany({ where: { userId: user.id }, select: { id: true, url: true, imageUrl: true } });
        const songIds = songs.map(s => s.id);

        // Perform deletes in a transaction to avoid FK constraint issues
        await prisma.$transaction(async (tx) => {
            if (songIds.length > 0) {
                await tx.rating.deleteMany({ where: { songId: { in: songIds } } });
            }

            // Delete ratings created by the user (on other songs)
            await tx.rating.deleteMany({ where: { userId: user.id } });

            // Delete songs by the user
            await tx.song.deleteMany({ where: { userId: user.id } });

            // Finally delete the user
            await tx.user.delete({ where: { id: user.id } });
        });

        // After DB transaction, attempt best-effort removal of storage objects
        if (client && typeof songRoutes.extractStorageReference === 'function') {
            // Remove audio and cover objects for deleted songs
            for (const song of songs) {
                try {
                    const audioRef = songRoutes.extractStorageReference(song.url, 'songs');
                    if (audioRef && audioRef.bucket && audioRef.path) {
                        await client.storage.from(audioRef.bucket).remove([audioRef.path]).catch(() => {});
                    }

                    const imageRef = songRoutes.extractStorageReference(song.imageUrl, 'covers');
                    if (imageRef && imageRef.bucket && imageRef.path) {
                        await client.storage.from(imageRef.bucket).remove([imageRef.path]).catch(() => {});
                    }
                } catch (err) {
                    console.error('Failed to remove storage for song', song.id, err?.message || err);
                }
            }

            // Remove avatar
            if (user.avatarUrl) {
                try {
                    const avatarRef = songRoutes.extractStorageReference(user.avatarUrl, 'avatars');
                    if (avatarRef && avatarRef.bucket && avatarRef.path) {
                        await client.storage.from(avatarRef.bucket).remove([avatarRef.path]).catch(() => {});
                    }
                } catch (err) {
                    console.error('Failed to remove avatar from storage for user', user.id, err?.message || err);
                }
            }
        }

        res.json({ message: 'Account and related data deleted' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ message: 'Server error deleting account' });
    }
});

module.exports = router;

// Try to initialize Supabase client at module load so we can ensure the
// profile pictures bucket exists (best-effort; does not crash on failure).
try {
    getSupabase();
} catch (err) {
    console.error('Supabase init at module load failed:', err?.message || err);
}