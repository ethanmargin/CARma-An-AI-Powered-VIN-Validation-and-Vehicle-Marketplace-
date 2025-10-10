const db = require('../config/db');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/ids/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'id-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDFs are allowed!'));
    }
  }
}).single('idDocument');

// Upload ID for verification
exports.uploadID = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const userId = req.user.user_id;
      const idPath = req.file ? req.file.path : null;
      const idType = req.body.id_type;
      const idData = req.body.id_data ? JSON.parse(req.body.id_data) : {};

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
        // Update existing record
        await db.query(
          `UPDATE user_verification 
           SET submitted_id = $1, status = $2, id_type = $3, id_data = $4, date_verified = NULL 
           WHERE user_id = $5`,
          [idPath, 'pending', idType, JSON.stringify(idData), userId]
        );
      } else {
        // Create new record
        await db.query(
          `INSERT INTO user_verification (user_id, submitted_id, status, id_type, id_data) 
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, idPath, 'pending', idType, JSON.stringify(idData)]
        );
      }

      // Log the action
      await db.query(
        'INSERT INTO system_logs (user_id, action, details) VALUES ($1, $2, $3)',
        [userId, 'ID_UPLOADED', `Uploaded ${idType} for verification`]
      );

      res.json({ 
        success: true, 
        message: 'ID uploaded successfully! Awaiting verification.' 
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
      'SELECT status, date_verified FROM user_verification WHERE user_id = $1',
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