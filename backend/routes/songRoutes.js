const express = require('express');
const router = express.Router();
const prisma = require('../prisma/prismaClient'); // Prisma database connection
const { protect } = require('../middleware/authMiddleware'); // Requires authentication

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
const { createClient } = require('@supabase/supabase-js');

let supabase = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

// Allow tests to inject a mocked supabase client
router.setSupabaseClient = (client) => {
    supabase = client;
};

// (helpers exported at bottom to avoid temporal-deadzone issues)

const mediaProxyUrl = (bucket, objectPath) => `/api/media?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(objectPath)}`;

const extractStorageReference = (storedValue, defaultBucket = 'songs') => {
    if (typeof storedValue !== 'string' || !storedValue.trim()) {
        return null;
    }

    if (!storedValue.startsWith('http')) {
        return { bucket: defaultBucket, path: storedValue };
    }

    try {
        const parsedUrl = new URL(storedValue);

        if (parsedUrl.pathname === '/api/media') {
            const bucket = parsedUrl.searchParams.get('bucket') || defaultBucket;
            const path = parsedUrl.searchParams.get('path');

            if (path) {
                return { bucket, path };
            }
        }

        const publicMarker = '/storage/v1/object/public/';
        const markerIndex = parsedUrl.pathname.indexOf(publicMarker);

        if (markerIndex !== -1) {
            const publicPath = parsedUrl.pathname.slice(markerIndex + publicMarker.length);
            const segments = publicPath.split('/').filter(Boolean);

            if (segments.length >= 2) {
                return {
                    bucket: segments[0],
                    path: segments.slice(1).join('/'),
                };
            }
        }
    } catch (error) {
        console.error('Failed to extract storage reference:', error);
    }

    return null;
};

const toSignedPlaybackUrl = async (storedUrl, defaultBucket = 'songs') => {
    if (!storedUrl || !supabase) {
        return storedUrl;
    }

    if (!storedUrl.startsWith('http')) {
        return mediaProxyUrl(defaultBucket, storedUrl);
    }

    try {
        const parsedUrl = new URL(storedUrl);
        const publicMarker = '/storage/v1/object/public/';
        const markerIndex = parsedUrl.pathname.indexOf(publicMarker);

        if (markerIndex === -1) {
            return storedUrl;
        }

        const publicPath = parsedUrl.pathname.slice(markerIndex + publicMarker.length);
        const segments = publicPath.split('/').filter(Boolean);
        if (segments.length < 2) {
            return storedUrl;
        }

        const bucket = segments[0];
        const objectPath = segments.slice(1).join('/');
        return mediaProxyUrl(bucket, objectPath);
    } catch (error) {
        console.error('Failed to create signed playback URL:', error);
    }

    return storedUrl;
};

const attachPlayableUrl = async (song) => ({
    ...song,
    url: await toSignedPlaybackUrl(song.url, 'songs'),
    imageUrl: await toSignedPlaybackUrl(song.imageUrl, 'covers'),
});

const attachPlayableUrls = async (songs) => Promise.all(songs.map(attachPlayableUrl));

// @desc    Publish a new song
// @route   POST /api/songs
// @access  Private (Requires token)
router.post('/', protect, async (req, res) => {
    try {
        const { title, artist, url, imageUrl } = req.body;

        if (!title || !artist || !url) {
            return res.status(400).json({ message: 'Title, artist, and url are required fields' });
        }

        // Fetch user ID from Prisma based on token's email
        const user = await prisma.user.findUnique({
            where: { email: req.user.email }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create new song in the database
        const newSong = await prisma.song.create({
            data: {
                title,
                artist,
                url,
                imageUrl: imageUrl || null,
                userId: user.id // Connects the song to the publishing user
            }
        });

        res.status(201).json(newSong);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while creating song' });
    }
});

// @desc    Get all songs
// @route   GET /api/songs
// @access  Public
router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId;
        const whereClause = userId ? { userId: userId } : {};

        // Fetch all songs and include publisher (User) details and likes
        const songs = await prisma.song.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        username: true,
                        avatarUrl: true
                    }
                },
                likes: true
            },
            orderBy: {
                createdAt: 'desc' // Newest first
            }
        });

        res.json(await attachPlayableUrls(songs));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching songs' });
    }
});

// @desc    Get top liked songs
// @route   GET /api/songs/top/liked
// @access  Public
router.get('/top/liked', async (req, res) => {
    try {
        const limit = Number.parseInt(req.query.limit) || 10;

        // Fetch songs with like count, sorted by most likes
        const songs = await prisma.song.findMany({
            include: {
                user: {
                    select: {
                        username: true,
                        avatarUrl: true
                    }
                },
                likes: true
            },
            orderBy: {
                likes: {
                    _count: 'desc'
                }
            },
            take: limit
        });

        // Add like count to each song
        const songsWithLikeCount = songs.map(song => ({
            ...song,
            likeCount: song.likes.length
        }));

        res.json(await attachPlayableUrls(songsWithLikeCount));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching top songs' });
    }
});

// @desc    Get a single song by ID
// @route   GET /api/songs/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const song = await prisma.song.findUnique({
            where: { id: req.params.id },
            include: {
                user: {
                    select: {
                        username: true,
                        avatarUrl: true
                    }
                },
                likes: true
            }
        });

        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }

        res.json(await attachPlayableUrl(song));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching song' });
    }
});

// @desc    Delete a song
// @route   DELETE /api/songs/:id
// @access  Private (owner only)
router.delete('/:id', protect, async (req, res) => {
    try {
        const song = await prisma.song.findUnique({
            where: { id: req.params.id },
        });

        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }

        const user = await prisma.user.findUnique({
            where: { email: req.user.email },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (song.userId !== user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this song' });
        }

        const audioReference = extractStorageReference(song.url, 'songs');
        if (supabase && audioReference) {
            const { error: removeAudioError } = await supabase.storage
                .from(audioReference.bucket)
                .remove([audioReference.path]);

            if (removeAudioError) {
                console.error('Failed to remove audio file from storage:', removeAudioError);
            }
        }

        const imageReference = extractStorageReference(song.imageUrl, 'covers');
        if (supabase && imageReference) {
            const { error: removeImageError } = await supabase.storage
                .from(imageReference.bucket)
                .remove([imageReference.path]);

            if (removeImageError) {
                console.error('Failed to remove image file from storage:', removeImageError);
            }
        }

        await prisma.like.deleteMany({
            where: { songId: song.id },
        });

        await prisma.song.delete({
            where: { id: song.id },
        });

        res.json({ message: 'Song deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while deleting song' });
    }
});

module.exports = router;

// Export helpers for testing (attached after declarations)
router.extractStorageReference = extractStorageReference;
router.toSignedPlaybackUrl = toSignedPlaybackUrl;
router.attachPlayableUrl = attachPlayableUrl;