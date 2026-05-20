const express = require('express');
const router = express.Router();
const prisma = require('../prisma/prismaClient'); // Prisma database connection
const { protect } = require('../middleware/authMiddleware'); // Requires authentication

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

        res.json(songs);
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

        res.json(songsWithLikeCount);
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

        res.json(song);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching song' });
    }
});

module.exports = router;