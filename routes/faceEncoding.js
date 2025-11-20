const express = require("express");
const {
  getAllActiveEncodings,
  getAllActiveEncodingsGrouped,
  getEncodingsByEmployeeId,
  updateFaceEncoding,
  deleteFaceEncoding,
  deleteAllEncodingsByEmployee,
} = require("../controllers/faceEncodingController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Get all active encodings (for face verification)
router.get("/active", authenticateToken, getAllActiveEncodings);

// Get all active encodings grouped by employee
router.get("/active-grouped", authenticateToken, getAllActiveEncodingsGrouped);

// Get encodings by employee ID
router.get(
  "/employee/:employeeId",
  authenticateToken,
  getEncodingsByEmployeeId
);

// Update face encoding
router.put("/:id", authenticateToken, updateFaceEncoding);

// Delete face encoding
router.delete("/:id", authenticateToken, deleteFaceEncoding);

// Delete all encodings for an employee
router.delete(
  "/employee/:employeeId",
  authenticateToken,
  deleteAllEncodingsByEmployee
);

module.exports = router;
