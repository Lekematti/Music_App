const express = require('express');
const router = express.Router();
const prisma = require('../prisma/prismaClient'); // Prisma-tietokantayhteys
const { protect } = require('../middleware/authMiddleware'); // Vaatii kirjautumisen reitteihin

// @desc    Julkaise uusi kappale
// @route   POST /api/songs
// @access  Private (Requires token)
router.post('/', protect, async (req, res) => {
    try {
        const { title, artist, url, imageUrl } = req.body;

        if (!title || !artist || !url) {
            return res.status(400).json({ message: 'Title, artist ja url ovat pakollisia kenttiä' });
        }

        // Hae käyttäjän ID Prismasta tokenin sähköpostin perusteella
        const user = await prisma.user.findUnique({
            where: { email: req.user.email }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Luo uusi kappale tietokantaan
        const newSong = await prisma.song.create({
            data: {
                title,
                artist,
                url,
                imageUrl: imageUrl || null,
                userId: user.id // Yhdistää laulun käyttäjään joka sen julkaisee!
            }
        });

        res.status(201).json(newSong);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while creating song' });
    }
});

// @desc    Hae kaikki kappaleet (näkyy soitossa ja etusivulla)
// @route   GET /api/songs
// @access  Public
router.get('/', async (req, res) => {
    try {
        // Haetaan kaikki biisit ja palautetaan mukana myös julkaisijan (User) tiedot
        const songs = await prisma.song.findMany({
            include: {
                user: {
                    select: {
                        username: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc' // Uusimmat ensin
            }
        });

        res.json(songs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching songs' });
    }
});

module.exports = router;