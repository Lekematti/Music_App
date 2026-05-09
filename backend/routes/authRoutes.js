const express = require('express');
const router = express.length ? express.Router() : require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/authMiddleware');

// "Tietokanta" (väliaikainen mock-tietokanta)
const users = [];

// JWT Tokenin generoija
const generateToken = (id, email) => {
    return jwt.sign({ id, email }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Rekisteröi uusi käyttäjä
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Täytä kaikki kentät' });
    }

    // Tarkasta onko käyttäjä olemassa mock-kannassa
    const userExists = users.find(u => u.email === email);
    if (userExists) {
        return res.status(400).json({ message: 'Käyttäjä on jo olemassa' });
    }

    // Salasana tiiviste
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Luo käyttäjä
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

// @desc    Kirjaudu sisään
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Hae käyttäjä
    const user = users.find(u => u.email === email);

    // Tarkista salasana ja lähetä JWT-token
    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            token: generateToken(user.id, user.email)
        });
    } else {
        res.status(400).json({ message: 'Väärä sähköposti tai salasana' });
    }
});

// @desc    Hae kirjautuneen käyttäjän tiedot
// @route   GET /api/auth/me
// @access  Private (Vaatii JWT-tokenin)
router.get('/me', protect, (req, res) => {
    // Tässä req.user.email tulee JWT tokenista, joka tarkistettiin authMiddleware.js:ssä
    const user = users.find(u => u.email === req.user.email);
    if (user) {
        res.json({
            id: user.id,
            username: user.username,
            email: user.email
        });
    } else {
        res.status(404).json({ message: 'Käyttäjää ei löytynyt' });
    }
});

module.exports = router;