const express = require('express');
const { getdatauser, login, register, refreshAccessToken, updateUser, deleteUser, logout } = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/refresh-token', refreshAccessToken); 
router.post('/logout', logout);

router.put('/users/:id', authenticateToken, requireAdmin, updateUser);
router.delete('/users/:id', authenticateToken, requireAdmin, deleteUser);

// Protected routes
router.get('/data-users', authenticateToken, requireAdmin, getdatauser);

module.exports = router;