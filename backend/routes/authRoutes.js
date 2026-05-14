const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma/prismaClient'); // Prisma-tietokantayhteys
const { protect } = require('../middleware/authMiddleware');

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

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Please fill in all fields' });
        }

        // Tarkista onko email tai username jo tietokannassa
        const userExists = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { username: username }
                ]
            }
        });

        if (userExists) {
            return res.status(400).json({ message: 'User with this email or username already exists' });
        }

        // Password hash
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Luo käyttäjä Supabaseen
        const newUser = await prisma.user.create({
            data: {
                username,
                email,
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

        // Etsi käyttäjä Supabasesta
        const user = await prisma.user.findUnique({
            where: { email: email }
        });

        // Check password and send JWT token
        if (user && (await bcrypt.compare(password, user.password))) {
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
        // Etsi käyttäjä Supabasesta JWT:n antamalla sähköpostilla (tai ID:llä)
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

module.exports = router;