const fs = require("fs");
const path = require("path");

/**
 * Delete uploaded files
 * @param {Array} files - Array of multer file objects (req.files)
 */
const deleteUploadedFiles = (files) => {
  if (!files || files.length === 0) return;

  files.forEach((file) => {
    const filePath = path.join(__dirname, "..", file.path);

    // Check if file exists
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`✅ Deleted file: ${file.filename}`);
      } catch (error) {
        console.error(
          `❌ Error deleting file ${file.filename}:`,
          error.message
        );
      }
    }
  });
};

/**
 * Delete single uploaded file
 * @param {Object} file - Multer file object (req.file)
 */
const deleteUploadedFile = (file) => {
  if (!file) return;

  const filePath = path.join(__dirname, "..", file.path);

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ Deleted file: ${file.filename}`);
    } catch (error) {
      console.error(`❌ Error deleting file ${file.filename}:`, error.message);
    }
  }
};

module.exports = {
  deleteUploadedFiles,
  deleteUploadedFile,
};
