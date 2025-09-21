const express = require('express');
const { getDataUsers, login, register, } = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/data-users', authenticateToken, requireAdmin, getDataUsers);

module.exports = router;