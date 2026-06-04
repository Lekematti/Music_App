const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');
const prisma = require('../prisma/prismaClient');
const {
    extractStorageReference,
    removeStorageObjectIfPresent,
} = require('../lib/mediaStorage');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROFILE_PICTURES_BUCKET = 'avatars';
const imageMimeTypes = new Set(['image/jpeg', 'image/png']);
const extensionFromMime = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
};

const normalizeEmail = (email) => email.trim().toLowerCase();
const isValidEmail = (email) => EMAIL_REGEX.test(email);
const generateToken = (id, email) => jwt.sign({ id, email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
});

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase = null;
let profilePicturesBucketReadyPromise = null;

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

const getSupabase = () => {
    if (supabase) return supabase;
    if (supabaseUrl && supabaseServiceKey) {
        if (supabaseUrl.includes('example.supabase.co')) return null;
        try {
            supabase = createClient(supabaseUrl, supabaseServiceKey);
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

const setSupabaseClient = (client) => {
    supabase = client;
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

    const folder = `${toStorageFolder(username, fallbackFolder)}/avatar`;
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

const writeAvatarMarker = async (client, username, avatarPath) => {
    if (!client || !username || !avatarPath) return;

    try {
        const key = `${username}/.info.png`;
        const contentType = 'image/png';
        const body = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B9s4hZQAAAABJRU5ErkJggg==', 'base64');

        const { error } = await client.storage.from(PROFILE_PICTURES_BUCKET).upload(key, body, {
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

const validateRegistrationInput = ({ username, email, password, avatarUrl }) => {
    const trimmedUsername = typeof username === 'string' ? username.trim() : '';
    const normalizedEmail = typeof email === 'string' ? normalizeEmail(email) : '';
    const passwordValue = typeof password === 'string' ? password : '';
    const { value: normalizedAvatarUrl, error: avatarUrlError } = normalizeAvatarUrl(avatarUrl);

    if (avatarUrlError) {
        return { error: avatarUrlError };
    }

    if (!trimmedUsername || !normalizedEmail || !passwordValue) {
        return { error: 'Please fill in all fields' };
    }

    if (trimmedUsername.length < 3) {
        return { error: 'Username must be at least 3 characters long' };
    }

    if (!isValidEmail(normalizedEmail)) {
        return { error: 'Please enter a valid email address' };
    }

    if (passwordValue.length < 6) {
        return { error: 'Password must be at least 6 characters long' };
    }

    return {
        trimmedUsername,
        normalizedEmail,
        passwordValue,
        normalizedAvatarUrl,
    };
};

const persistAvatarForUser = async ({ avatarFile, trimmedUsername, userId, resolvedAvatarUrl }) => {
    if (avatarFile) {
        const client = getSupabase();
        if (!client) {
            await prisma.user.delete({ where: { id: userId } }).catch(() => {});
            return { error: 'Supabase storage is not configured' };
        }

        const uploadedAvatar = await uploadProfilePicture(client, trimmedUsername, avatarFile, userId);
        if (uploadedAvatar?.error) {
            await prisma.user.delete({ where: { id: userId } }).catch(() => {});
            return { error: uploadedAvatar.error, status: 502 };
        }

        const finalAvatarPath = uploadedAvatar?.value ?? null;
        if (finalAvatarPath) {
            await prisma.user.update({ where: { id: userId }, data: { avatarUrl: finalAvatarPath } });
            try {
                await writeAvatarMarker(client, trimmedUsername, finalAvatarPath);
            } catch (err) {
                console.warn('writeAvatarMarker failed', err?.message || err);
            }
        }

        return { value: finalAvatarPath };
    }

    if (resolvedAvatarUrl) {
        await prisma.user.update({ where: { id: userId }, data: { avatarUrl: resolvedAvatarUrl } });
        return { value: resolvedAvatarUrl };
    }

    return { value: null };
};

const buildProfileUpdateData = ({ username, email, avatarUrl, avatarFile }) => {
    const updates = {};

    if (typeof username === 'string') {
        const trimmed = username.trim();
        if (trimmed.length < 3) return { error: 'Username must be at least 3 characters long' };
        updates.username = trimmed;
    }

    if (typeof email === 'string') {
        const normalized = normalizeEmail(email);
        if (!isValidEmail(normalized)) return { error: 'Please enter a valid email address' };
        updates.email = normalized;
    }

    if (avatarFile) updates.avatarFile = avatarFile;

    if (avatarUrl !== undefined) {
        const { value, error } = normalizeAvatarUrl(avatarUrl);
        if (error) return { error };
        updates.avatarUrl = value;
    }

    return { updates };
};

const uploadAvatarIfNeeded = async (updates, userId) => {
    if (!updates.avatarFile) return { updates };

    const client = getSupabase();
    if (!client) return { error: 'Supabase storage is not configured', status: 500 };

    const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
    });
    if (!currentUser) return { error: 'User not found', status: 404 };

    const storageUsername = updates.username || currentUser.username;
    const uploadedAvatar = await uploadProfilePicture(client, storageUsername, updates.avatarFile, userId);
    if (uploadedAvatar?.error) return { error: uploadedAvatar.error, status: 502 };

    const { avatarFile, ...rest } = updates;
    return { updates: { ...rest, avatarUrl: uploadedAvatar?.value ?? null } };
};

const findUpdateConflict = async (updates, userId) => {
    const conflictChecks = [];
    if (updates.username) conflictChecks.push({ username: updates.username });
    if (updates.email) conflictChecks.push({ email: updates.email });

    if (conflictChecks.length === 0) return null;

    return prisma.user.findFirst({
        where: {
            OR: conflictChecks,
            NOT: { id: userId },
        },
    });
};

const ensureAvatarMarker = async (user) => {
    try {
        const client = getSupabase();
        if (client && user.username && user.avatarUrl) {
            await writeAvatarMarker(client, user.username, user.avatarUrl);
        }
    } catch (error) {
        console.error('Failed to ensure avatar marker after update', error?.message || error);
    }
};

const removeUserAvatarStorage = async (client, user) => {
    if (!user.avatarUrl) {
        return;
    }

    try {
        await removeStorageObjectIfPresent(client, extractStorageReference(user.avatarUrl, 'avatars'));
    } catch (error) {
        console.error('Failed to remove avatar from storage for user', user.id, error?.message || error);
    }
};

const removeSongStorage = async (client, song) => {
    try {
        await removeStorageObjectIfPresent(client, extractStorageReference(song.url, 'songs'));
        await removeStorageObjectIfPresent(client, extractStorageReference(song.imageUrl, 'covers'));
    } catch (error) {
        console.error('Failed to remove storage for song', song.id, error?.message || error);
    }
};

const deleteUserAccountAndRelatedData = async (user, client) => {
    const songs = await prisma.song.findMany({
        where: { userId: user.id },
        select: { id: true, url: true, imageUrl: true },
    });
    const songIds = songs.map((song) => song.id);

    await prisma.$transaction(async (tx) => {
        if (songIds.length > 0) {
            await tx.rating.deleteMany({ where: { songId: { in: songIds } } });
        }

        await tx.rating.deleteMany({ where: { userId: user.id } });
        await tx.song.deleteMany({ where: { userId: user.id } });
        await tx.user.delete({ where: { id: user.id } });
    });

    if (client && typeof client.storage?.from === 'function') {
        for (const song of songs) {
            await removeSongStorage(client, song);
        }

        await removeUserAvatarStorage(client, user);
    }
};

const ensureModuleSupabaseClient = () => {
    try {
        getSupabase();
    } catch (error) {
        console.error('Supabase init at module load failed:', error?.message || error);
    }
};

ensureModuleSupabaseClient();

module.exports = {
    buildProfileUpdateData,
    deleteUserAccountAndRelatedData,
    ensureAvatarMarker,
    findUpdateConflict,
    generateToken,
    getSupabase,
    isValidEmail,
    normalizeEmail,
    persistAvatarForUser,
    resolveAvatarUrl,
    setSupabaseClient,
    uploadAvatarIfNeeded,
    validateRegistrationInput,
};
