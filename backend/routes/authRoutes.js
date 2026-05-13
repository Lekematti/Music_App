const express = require('express');
const router = express.length ? express.Router() : require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/authMiddleware');

// "Database" (temporary mock database)
const users = [];

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
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please fill in all fields' });
    }

    // Check if user exists in the mock database
    const userExists = users.find(u => u.email === email);
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Password hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = {
        id: users.length + 1,
        username,
        email,
        password: hashedPassword
    };
    users.push(newUser);

    res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        token: generateToken(newUser.id, newUser.email)
    });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Find user
    const user = users.find(u => u.email === email);

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
});

// @desc    Get logged in user info
// @route   GET /api/auth/me
// @access  Private (Requires JWT token)
router.get('/me', protect, (req, res) => {
    // Here req.user.email comes from JWT token, which was verified in authMiddleware.js
    const user = users.find(u => u.email === req.user.email);
    if (user) {
        res.json({
            id: user.id,
            username: user.username,
            email: user.email
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

module.exports = router;