const express = require('express');
const multer = require('multer');
const crypto = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const prisma = require('../prisma/prismaClient');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase = null;

const getSupabase = () => {
    if (supabase) return supabase;
    if (supabaseUrl && supabaseServiceKey) {
        // If the URL is the placeholder example (commonly present in env during CI/dev), avoid creating a real client.
        if (supabaseUrl.includes('example.supabase.co')) return null;
        try {
            supabase = createClient(supabaseUrl, supabaseServiceKey);
        } catch (e) {
            supabase = null;
            console.error('Failed to create Supabase client:', e?.message ?? e);
        }
    }
    return supabase;
};

// allow tests to inject a mocked supabase client
router.setSupabaseClient = (client) => {
    supabase = client;
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
});

const audioMimeTypes = new Set(['audio/mpeg', 'audio/mp3']);
const imageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const extensionFromMime = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
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

const writeBucketMarker = async (client, bucket, username, payload) => {
    if (!client || !bucket || !username || !payload) return;
    try {
        let key;
        let contentType;
        let body;
        if (bucket === 'songs') {
            key = `${username}/.info.mp3`;
            contentType = 'audio/mpeg';
            body = Buffer.from([0, 1, 2, 3, 4]);
        } else {
            // covers (and others) - use small PNG marker
            key = `${username}/.info.png`;
            contentType = 'image/png';
            // 1x1 transparent PNG
            body = Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B9s4hZQAAAABJRU5ErkJggg==',
                'base64'
            );
        }

        const { data, error } = await client.storage.from(bucket).upload(key, body, {
            contentType,
            upsert: true,
        });
        if (error) console.error('Marker upload error', bucket, key, error.message || error);
    } catch (err) {
        console.error(`Failed to write marker for bucket=${bucket} username=${username}`, err?.message || err);
    }
};

router.post('/', protect, upload.fields([
    { name: 'audioFile', maxCount: 1 },
    { name: 'imageFile', maxCount: 1 },
]), async (req, res) => {
    try {
        const client = getSupabase();
        if (!client) {
            return res.status(500).json({ message: 'Supabase storage is not configured' });
        }

        const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
        const artist = typeof req.body.artist === 'string' ? req.body.artist.trim() : '';

        if (!title || !artist) {
            return res.status(400).json({ message: 'Title and artist are required fields' });
        }

        const audioFile = req.files?.audioFile?.[0];
        const imageFile = req.files?.imageFile?.[0];

        if (!audioFile) {
            return res.status(400).json({ message: 'Audio file is required' });
        }

        if (!audioMimeTypes.has(audioFile.mimetype)) {
            return res.status(400).json({ message: 'Audio file must be an MP3' });
        }

        if (imageFile && !imageMimeTypes.has(imageFile.mimetype)) {
            return res.status(400).json({ message: 'Cover image must be JPG, PNG, or WEBP' });
        }

        const user = await prisma.user.findUnique({
            where: { email: req.user.email },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const folder = toStorageFolder(user.username, user.id);
        const audioExt = extensionFromMime[audioFile.mimetype] || 'mp3';
        const audioPath = buildPath(folder, audioExt);
        const { error: audioError } = await client.storage
            .from('songs')
            .upload(audioPath, audioFile.buffer, {
                contentType: audioFile.mimetype,
                upsert: false,
            });

        if (audioError) {
            return res.status(502).json({ message: `Audio upload failed: ${audioError.message}` });
        }

        let imageUrl = null;
        let imagePath = null;
        if (imageFile) {
            const imageExt = extensionFromMime[imageFile.mimetype] || 'jpg';
            imagePath = buildPath(folder, imageExt);
            const { error: imageError } = await client.storage
                .from('covers')
                .upload(imagePath, imageFile.buffer, {
                    contentType: imageFile.mimetype,
                    upsert: false,
                });

            if (imageError) {
                return res.status(502).json({ message: `Image upload failed: ${imageError.message}` });
            }

            imageUrl = client.storage.from('covers').getPublicUrl(imagePath).data.publicUrl;
        }

        const newSong = await prisma.song.create({
            data: {
                title,
                artist,
                url: audioPath,
                imageUrl,
                userId: user.id,
            },
        });

        // Write username markers so Supabase UI shows username folders
        try {
            await writeBucketMarker(client, 'songs', user.username, { userId: user.id, songId: newSong.id, audio: audioPath });
            if (imagePath) {
                await writeBucketMarker(client, 'covers', user.username, { userId: user.id, songId: newSong.id, cover: imagePath });
            }
        } catch (e) {
            console.error('Failed to write bucket markers:', e?.message || e);
        }

        res.status(201).json(newSong);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while uploading song' });
    }
});

module.exports = router;
