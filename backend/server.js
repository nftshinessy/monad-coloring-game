const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10kb' }));

// Импорт обработчиков
const authHandler = require('./auth');
const gameHandler = require('./game-logic');
const leaderboardHandler = require('./leaderboard');

// Auth routes
app.post('/auth/wallet', authHandler.handleWalletAuth);
app.get('/auth/nonce', authHandler.getNonce);

// Game routes
app.post('/game/start', authHandler.authenticate, gameHandler.startGame);
app.post('/game/finish', authHandler.authenticate, gameHandler.finishGame);
app.get('/leaderboard', leaderboardHandler.getLeaderboard);

// New route for player stats
app.get('/player/stats', authHandler.authenticate, (req, res) => {
    const { address } = req.user;
    leaderboardHandler.getPlayerStats(address, (stats) => {
        res.json(stats);
    });
});

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Статика для фронтенда
app.use(express.static('../frontend', {
  dotfiles: 'ignore',
  index: 'index.html'
}));

// Обработчик ошибок 
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));