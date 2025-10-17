const db = require('../config/db');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'carma/ids',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('id');

// Upload ID for verification
exports.uploadID = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const userId = req.user.user_id;
      const idPath = req.file ? req.file.path : null; // Cloudinary URL
      const idType = req.body.id_type;
      const idData = req.body.id_data ? JSON.parse(req.body.id_data) : {};

      console.log('✅ Cloudinary Upload Success:', { userId, idType, cloudinaryUrl: idPath });

      if (!idPath) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      if (!idType) {
        return res.status(400).json({ success: false, message: 'ID type is required' });
      }

      // Check if user already has a verification record
      const existing = await db.query(
        'SELECT * FROM user_verification WHERE user_id = $1',
        [userId]
      );

      if (existing.rows.length > 0) {
        await db.query(
          `UPDATE user_verification 
           SET submitted_id = $1, status = $2, id_type = $3, id_data = $4, date_verified = NULL 
           WHERE user_id = $5`,
          [idPath, 'pending', idType, JSON.stringify(idData), userId]
        );
      } else {
        await db.query(
          `INSERT INTO user_verification (user_id, submitted_id, status, id_type, id_data) 
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, idPath, 'pending', idType, JSON.stringify(idData)]
        );
      }

      await db.query(
        'INSERT INTO system_logs (user_id, action, details) VALUES ($1, $2, $3)',
        [userId, 'ID_UPLOADED', `Uploaded ${idType} for verification`]
      );

      res.json({ 
        success: true, 
        message: 'ID uploaded successfully! Awaiting verification.',
        imageUrl: idPath
      });

    } catch (error) {
      console.error('Upload ID error:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  });
};

// Get current user's verification status
exports.getVerificationStatus = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const result = await db.query(
      'SELECT * FROM user_verification WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Verification record not found' 
      });
    }

    res.json({
      success: true,
      verification: result.rows[0]
    });

  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const userResult = await db.query(
      'SELECT user_id, name, email, role, created_at FROM users WHERE user_id = $1',
      [userId]
    );

    const verificationResult = await db.query(
      'SELECT status, submitted_id, date_verified, id_type, id_data FROM user_verification WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      user: userResult.rows[0],
      verification: verificationResult.rows[0] || { status: 'pending' }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Update user profile (name, mobile)
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { name, mobile_number } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // Update profile
    const result = await db.query(
      'UPDATE users SET name = $1, mobile_number = $2 WHERE user_id = $3 RETURNING user_id, name, email, mobile_number, role',
      [name, mobile_number, userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Get current user
    const userResult = await db.query(
      'SELECT password FROM users WHERE user_id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query(
      'UPDATE users SET password = $1 WHERE user_id = $2',
      [hashedPassword, userId]
    );

    // Log action
    await db.query(
      'INSERT INTO system_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [userId, 'PASSWORD_CHANGED', 'User changed their password']
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};