const express = require("express");
const {
  uploadFacePhoto,
  uploadMultipleFacePhotos,
  uploadAttendancePhoto,
} = require("../controllers/uploadController");
const { uploadFace, uploadAttendance } = require("../config/multer");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Upload single face photo
router.post(
  "/face",
  authenticateToken,
  uploadFace.single("photo"),
  uploadFacePhoto
);

// Upload multiple face photos (max 5)
router.post("/faces", uploadFace.array("photos", 5), uploadMultipleFacePhotos);

// Upload attendance photo
router.post(
  "/attendance",
  authenticateToken,
  uploadAttendance.single("photo"),
  uploadAttendancePhoto
);

module.exports = router;
