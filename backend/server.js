const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('node:path');

dotenv.config();

const app = express();
app.disable('x-powered-by');
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : false,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes (API routes must come before static files)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/songs', require('./routes/songRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'Music App Backend Server' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Serve frontend static files (must come after API routes)
app.use(express.static(path.join(__dirname, '../frontend')));

// SPA fallback - serve index.html for non-API routes (for client-side routing)
app.use((req, res) => {
  // Don't serve SPA fallback for API routes or root path
  if (req.path.startsWith('/api') || req.path === '/') {
    return res.status(404).json({ error: 'Not Found' });
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
