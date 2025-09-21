const express = require('express');
const { getdatauser, login, register, refreshAccessToken, logout } = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/refresh-token', refreshAccessToken); // Endpoint baru
router.post('/logout', logout); // Endpoint baru

// Protected routes
router.get('/data-users', authenticateToken, requireAdmin, getdatauser);

module.exports = router;