const path = require("path");
const {
  deleteUploadedFiles,
  deleteUploadedFile,
} = require("../utils/fileHelper"); // ← ADD THIS

// Upload single face photo
const uploadFacePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const photoPath = `/uploads/faces/${req.file.filename}`;

    res.json({
      success: true,
      message: "Face photo uploaded successfully",
      data: {
        filename: req.file.filename,
        path: photoPath,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    // ✅ DELETE FILE if error
    if (req.file) {
      deleteUploadedFile(req.file);
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Upload multiple face photos (max 5)
const uploadMultipleFacePhotos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const photoPaths = req.files.map((file) => ({
      filename: file.filename,
      path: `/uploads/faces/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype,
    }));

    res.json({
      success: true,
      message: `${req.files.length} face photos uploaded successfully`,
      data: {
        count: req.files.length,
        photos: photoPaths,
      },
    });
  } catch (error) {
    // ✅ DELETE FILES if error
    if (req.files) {
      deleteUploadedFiles(req.files);
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Upload attendance photo
const uploadAttendancePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const photoPath = `/uploads/attendances/${req.file.filename}`;

    res.json({
      success: true,
      message: "Attendance photo uploaded successfully",
      data: {
        filename: req.file.filename,
        path: photoPath,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    // ✅ DELETE FILE if error
    if (req.file) {
      deleteUploadedFile(req.file);
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  uploadFacePhoto,
  uploadMultipleFacePhotos,
  uploadAttendancePhoto,
};
