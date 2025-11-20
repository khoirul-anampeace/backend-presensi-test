const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const { deleteUploadedFiles } = require("../utils/fileHelper");

// Helper function untuk generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = crypto.randomBytes(64).toString("hex");

  return { accessToken, refreshToken };
};

const getdatauser = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({
      success: true,
      message: "Users retrieved successfully",
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email not found",
      });
    }

    // Check password
    let isValidPassword = false;
    if (user.password.startsWith("$2b$")) {
      isValidPassword = await bcrypt.compare(password, user.password);
    } else {
      isValidPassword = password === user.password;
    }

    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Deactivate semua refresh token lama user ini
    await RefreshToken.deactivateAllByUserId(user.id);

    // Generate tokens baru
    const { accessToken, refreshToken } = generateTokens(user);

    // Simpan refresh token ke database
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create(user.id, refreshToken, refreshTokenExpiry);

    res.json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
      accessTokenExpiresIn: 15 * 60,
      refreshTokenExpiresIn: 7 * 24 * 60 * 60,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const register = async (req, res) => {
  try {
    const {
      email,
      password,
      role = "employee",
      fullName,
      department,
      position,
      phone,
      hireDate,
      faceEncodings, // Array of 5 encodings or single encoding
      photoPaths, // Array of 5 photo paths (optional)
    } = req.body;

    // Validasi required fields
    if (!email || !password || !fullName || !hireDate) {
      return res.status(400).json({
        success: false,
        message: "Email, password, full name, and hire date are required",
      });
    }

    // Check if email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 1. Create User
    const user = await User.create({
      email,
      password: hashedPassword,
      role,
    });

    // 2. Create Employee with user_id
    const Employee = require("../models/Employee");
    const employee = await Employee.create({
      userId: user.id,
      fullName,
      department,
      position,
      phone,
      hireDate,
    });

    // 3. Save Face Encodings (if provided)
    let faceEncodingData = null;
    if (
      faceEncodings &&
      Array.isArray(faceEncodings) &&
      faceEncodings.length > 0
    ) {
      const FaceEncoding = require("../models/FaceEncoding");

      if (faceEncodings.length === 1) {
        // Single photo
        faceEncodingData = await FaceEncoding.create({
          employeeId: employee.id,
          encoding: faceEncodings[0],
          photoPath: photoPaths?.[0] || null,
        });
      } else {
        // Multiple photos (5 photos)
        faceEncodingData = await FaceEncoding.createMultiple(
          employee.id,
          faceEncodings,
          photoPaths || []
        );
      }
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        employee: {
          id: employee.id,
          employeeCode: employee.employee_code,
          fullName: employee.full_name,
          department: employee.department,
          position: employee.position,
          phone: employee.phone,
          hireDate: employee.hire_date,
        },
        faceEncoding: faceEncodingData
          ? {
              photoCount: Array.isArray(faceEncodingData)
                ? faceEncodingData.length
                : 1,
              hasEncoding: true,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const registerWithPhotos = async (req, res) => {
  try {
    // 1. Validate files uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No photos uploaded. Please upload 5 face photos.",
      });
    }

    if (req.files.length !== 5) {
      // ✅ DELETE FILES if count is wrong
      deleteUploadedFiles(req.files);

      return res.status(400).json({
        success: false,
        message: `Expected 5 photos, but got ${req.files.length}. Please upload exactly 5 face photos.`,
      });
    }

    // 2. Get form data
    const {
      email,
      password,
      role = "employee",
      fullName,
      department,
      position,
      phone,
      hireDate,
      faceEncodings,
    } = req.body;

    // 3. Validasi required fields
    if (!email || !password || !fullName || !hireDate) {
      // DELETE FILES if validation fails
      deleteUploadedFiles(req.files);

      return res.status(400).json({
        success: false,
        message: "Email, password, full name, and hire date are required",
      });
    }

    if (!faceEncodings) {
      // DELETE FILES if no encodings
      deleteUploadedFiles(req.files);

      return res.status(400).json({
        success: false,
        message: "Face encodings are required",
      });
    }

    // 4. Parse face encodings
    let parsedEncodings;
    try {
      parsedEncodings = JSON.parse(faceEncodings);
    } catch (error) {
      // DELETE FILES if JSON parse fails
      deleteUploadedFiles(req.files);

      return res.status(400).json({
        success: false,
        message: "Invalid face encodings format. Must be valid JSON array.",
      });
    }

    // 5. Validate encodings count
    if (parsedEncodings.length !== req.files.length) {
      // DELETE FILES if count mismatch
      deleteUploadedFiles(req.files);

      return res.status(400).json({
        success: false,
        message: `Number of encodings (${parsedEncodings.length}) must match number of photos (${req.files.length})`,
      });
    }

    // 6. Check if email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      // DELETE FILES if email exists
      deleteUploadedFiles(req.files);

      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // 7. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 8. Create User
    const user = await User.create({
      email,
      password: hashedPassword,
      role,
    });

    // 9. Create Employee
    const Employee = require("../models/Employee");
    const employee = await Employee.create({
      userId: user.id,
      fullName,
      department,
      position,
      phone,
      hireDate,
    });

    // 10. Get photo paths
    const photoPaths = req.files.map(
      (file) => `/uploads/faces/${file.filename}`
    );

    // 11. Save face encodings with photo paths
    const FaceEncoding = require("../models/FaceEncoding");
    const savedEncodings = await FaceEncoding.createMultiple(
      employee.id,
      parsedEncodings,
      photoPaths
    );

    // 12. Success response
    res.status(201).json({
      success: true,
      message: "User registered successfully with face photos",
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        employee: {
          id: employee.id,
          employeeCode: employee.employee_code,
          fullName: employee.full_name,
          department: employee.department,
          position: employee.position,
          phone: employee.phone,
          hireDate: employee.hire_date,
        },
        faceEncoding: {
          photoCount: savedEncodings.length,
          photos: photoPaths,
        },
      },
    });
  } catch (error) {
    // DELETE FILES if unexpected error occurs
    if (req.files) {
      deleteUploadedFiles(req.files);
    }

    console.error("Register with photos error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
      });
    }

    // Cari refresh token di database
    const tokenRecord = await RefreshToken.findByToken(refreshToken);
    if (!tokenRecord) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    // Generate access token baru
    const user = {
      id: tokenRecord.user_id,
      email: tokenRecord.email,
      role: tokenRecord.role,
    };

    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({
      success: true,
      message: "Access token refreshed successfully",
      accessToken,
      accessTokenExpiresIn: 15 * 60,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role, password } = req.body;

    // Validasi
    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: "Email and role are required",
      });
    }

    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if email already used by another user
    if (email !== existingUser.email) {
      const emailCheck = await User.findByEmail(email);
      if (emailCheck && emailCheck.id != id) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Update user
    const updatedUser = await User.update(id, { email, role });

    // Update password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      await User.updatePassword(id, hashedPassword);
    }

    res.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.delete(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await RefreshToken.deactivate(refreshToken);
    }

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { id } = req.params;

    // Defensive check untuk req.body
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        success: false,
        message: "Invalid request body",
      });
    }

    const { oldPassword, newPassword } = req.body;

    // Validasi input (optional - bisa dihapus kalau mau full validasi di frontend)
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old password and new password are required",
      });
    }

    // Get user with password using direct query
    const pool = require("../config/database");
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);

    const user = rows[0];
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify old password
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await User.updatePassword(id, hashedPassword);

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  getdatauser,
  login,
  register,
  registerWithPhotos,
  refreshAccessToken,
  updateUser,
  deleteUser,
  logout,
  updatePassword,
};
