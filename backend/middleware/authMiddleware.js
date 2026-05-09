const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;

    // Tarkistetaan löytyykö Authorization header ja alkaako se sanalla "Bearer"
    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            // Erotetaan token "Bearer <token>" -merkkijonosta
            token = req.headers.authorization.split(' ')[1];

            // Varmennetaan token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Lisätään dekoodattu käyttäjänimi (tai ID) request olioihin
            req.user = decoded;

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Ei valtuuksia, token on virheellinen' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Ei valtuuksia, token puuttuu' });
    }
};

module.exports = { protect };