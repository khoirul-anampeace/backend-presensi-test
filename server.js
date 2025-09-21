const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));

// Test routes (keep for now)
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.get('/api/test-db', async (req, res) => {
  const pool = require('./config/database');
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({ 
      success: true, 
      message: 'Database connected!',
      current_time: result.rows[0].current_time 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});