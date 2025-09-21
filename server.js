const express = require('express');
const cors = require('cors');
const { startCleanupScheduler } = require('./utils/cleanupTokens');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employee'));

// Test routes (keep for now)
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});


// cleanup expired tokens every week (7 days)
startCleanupScheduler();

// Test database connection route
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