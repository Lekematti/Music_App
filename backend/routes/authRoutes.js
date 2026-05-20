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

module.exports = router;