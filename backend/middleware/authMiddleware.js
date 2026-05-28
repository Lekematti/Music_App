const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;

    // Check if Authorization header exists and starts with "Bearer"
    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            // Extract token from "Bearer <token>" string
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Add decoded username (or ID) to request objects
            req.user = decoded;

            return next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, invalid token' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, token missing' });
    }
};

module.exports = { protect };