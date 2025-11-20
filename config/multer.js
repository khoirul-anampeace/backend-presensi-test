const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist
const uploadDirs = ["uploads/faces", "uploads/attendances"];
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration untuk face photos
const faceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/faces/");
  },
  filename: function (req, file, cb) {
    // Format: face_timestamp_random.jpg
    // Example: face_1699876543210_a3f2d1.jpg
    const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `face_${uniqueSuffix}${ext}`);
  },
});

// Storage configuration untuk attendance photos
const attendanceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/attendances/");
  },
  filename: function (req, file, cb) {
    // Format: attendance_timestamp_random.jpg
    const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `attendance_${uniqueSuffix}${ext}`);
  },
});

// File filter - hanya terima image
const fileFilter = (req, file, cb) => {
  // Accept images only
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, PNG, GIF) are allowed!"), false);
  }
};

// Multer instances
const uploadFace = multer({
  storage: faceStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: fileFilter,
});

const uploadAttendance = multer({
  storage: attendanceStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: fileFilter,
});

module.exports = {
  uploadFace,
  uploadAttendance,
};
