const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Built-in Node.js
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

// Helper function untuk generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // 15 menit
  );

  const refreshToken = crypto.randomBytes(64).toString('hex');
  
  return { accessToken, refreshToken };
};

const getdatauser = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({
      success: true,
      message: 'Users retrieved successfully',
      users
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email not found' 
      });
    }

    // Check password
    let isValidPassword = false;
    if (user.password.startsWith('$2b$')) {
      isValidPassword = await bcrypt.compare(password, user.password);
    } else {
      isValidPassword = password === user.password;
    }

    if (!isValidPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid password' 
      });
    }

    // Deactivate semua refresh token lama user ini
    await RefreshToken.deactivateAllByUserId(user.id);

    // Generate tokens baru
    const { accessToken, refreshToken } = generateTokens(user);

    // Simpan refresh token ke database
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 hari
    await RefreshToken.create(user.id, refreshToken, refreshTokenExpiry);

    res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      accessTokenExpiresIn: 15 * 60, // 15 menit dalam detik
      refreshTokenExpiresIn: 7 * 24 * 60 * 60, // 7 hari dalam detik
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

const register = async (req, res) => {
  try {
    const { email, password, role = 'employee' } = req.body;
    
    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      role
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Cari refresh token di database
    const tokenRecord = await RefreshToken.findByToken(refreshToken);
    if (!tokenRecord) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Generate access token baru
    const user = {
      id: tokenRecord.user_id,
      email: tokenRecord.email,
      role: tokenRecord.role
    };

    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      message: 'Access token refreshed successfully',
      accessToken,
      accessTokenExpiresIn: 15 * 60
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await RefreshToken.deactivate(refreshToken);
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

module.exports = { 
  getdatauser,
  login, 
  register,
  refreshAccessToken,
  logout
};