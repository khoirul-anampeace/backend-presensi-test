// utils/cleanupTokens.js
const pool = require('../config/database');

const cleanupExpiredTokens = async () => {
  try {
    const result = await pool.query(
      'DELETE FROM refresh_tokens WHERE expires_at < NOW() OR (is_active = false AND created_at < NOW() - INTERVAL \'7 days\')'
    );
    
    console.log(`Cleanup completed: ${result.rowCount} tokens deleted`);
  } catch (error) {
    console.error('Cleanup error:', error.message);
  }
};

// Jalankan setiap 7 hari (7 * 24 * 60 * 60 * 1000)
const startCleanupScheduler = () => {
  console.log('Token cleanup scheduler started (weekly)');
  
  // Jalankan pertama kali setelah 1 menit (untuk testing)
  setTimeout(cleanupExpiredTokens, 60 * 1000);
  
  // Lalu setiap 7 hari
  setInterval(cleanupExpiredTokens, 7 * 24 * 60 * 60 * 1000);
};

module.exports = { cleanupExpiredTokens, startCleanupScheduler };