const express = require("express");
const {
  getdatauser,
  login,
  register,
  refreshAccessToken,
  updateUser,
  deleteUser,
  logout,
  updatePassword,
} = require("../controllers/authController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.post("/login", login);
router.post("/register", register);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", logout);

// Protected routes
router.get("/data-users", authenticateToken, requireAdmin, getdatauser);
router.put("/users/:id", authenticateToken, updateUser);
router.delete("/users/:id", authenticateToken, requireAdmin, deleteUser);

// Update password (user must be authenticated)
router.put("/update-password/:id", updatePassword);

module.exports = router;
