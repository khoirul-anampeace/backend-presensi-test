const express = require("express");
const cors = require("cors");
const path = require("path");
const { startCleanupScheduler } = require("./utils/cleanupTokens");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/employees", require("./routes/employee"));
app.use("/api/face-encodings", require("./routes/faceEncoding"));
app.use("/api/upload", require("./routes/upload"));

// Test routes (keep for now)
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is running!" });
});
app.get("/hello", (req, res) => {
  res.send("Hello World!");
});

// cleanup expired tokens every week (7 days)
startCleanupScheduler();

// Test database connection route
app.get("/api/test-db", async (req, res) => {
  const pool = require("./config/database");
  try {
    // Ambil 1 data dari tabel employees
    const [rows] = await pool.query("SELECT * FROM employees LIMIT 1");
    res.json({
      success: true,
      message: "Database connected and data fetched successfully!",
      data: rows[0],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
