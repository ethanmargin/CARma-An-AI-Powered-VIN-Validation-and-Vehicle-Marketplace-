const db = require('../config/db');
const multer = require('multer');
const path = require('path');

// Configure multer for vehicle images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/vehicles/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'vehicle-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed!'));
    }
  }
}).single('vehicleImage');

// Add new vehicle
exports.addVehicle = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const { make, model, year, price, description, vin_number } = req.body;
      const userId = req.user.user_id;
      const imagePath = req.file ? req.file.path : null;

      // Validate seller is verified
      const verificationCheck = await db.query(
        'SELECT status FROM user_verification WHERE user_id = $1',
        [userId]
      );

      if (verificationCheck.rows[0]?.status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: 'You must be verified before adding vehicles'
        });
      }

      // Insert vehicle
      const result = await db.query(
        `INSERT INTO vehicles (user_id, make, model, year, price, description, vin_number, image_path, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
         RETURNING *`,
        [userId, make, model, year, price, description, vin_number, imagePath]
      );

      // Create VIN verification record (pending)
      await db.query(
        'INSERT INTO vin_verification (vehicle_id, status) VALUES ($1, $2)',
        [result.rows[0].vehicle_id, 'pending']
      );

      // Log action
      await db.query(
        'INSERT INTO system_logs (user_id, action, details) VALUES ($1, $2, $3)',
        [userId, 'VEHICLE_ADDED', `Added vehicle: ${make} ${model}`]
      );

      res.status(201).json({
        success: true,
        message: 'Vehicle added successfully! Awaiting VIN verification.',
        vehicle: result.rows[0]
      });

    } catch (error) {
      console.error('Add vehicle error:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  });
};

// Get all vehicles (for buyers to browse)
exports.getAllVehicles = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        v.*,
        u.name as seller_name,
        u.email as seller_email,
        vv.status as vin_status
      FROM vehicles v
      JOIN users u ON v.user_id = u.user_id
      LEFT JOIN vin_verification vv ON v.vehicle_id = vv.vehicle_id
      ORDER BY v.created_at DESC
    `);

    res.json({ success: true, vehicles: result.rows });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get seller's own vehicles
exports.getMyVehicles = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const result = await db.query(`
      SELECT 
        v.*,
        vv.status as vin_status,
        vv.date_verified
      FROM vehicles v
      LEFT JOIN vin_verification vv ON v.vehicle_id = vv.vehicle_id
      WHERE v.user_id = $1
      ORDER BY v.created_at DESC
    `, [userId]);

    res.json({ success: true, vehicles: result.rows });
  } catch (error) {
    console.error('Get my vehicles error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get single vehicle details
exports.getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT 
        v.*,
        u.name as seller_name,
        u.email as seller_email,
        vv.status as vin_status
      FROM vehicles v
      JOIN users u ON v.user_id = u.user_id
      LEFT JOIN vin_verification vv ON v.vehicle_id = vv.vehicle_id
      WHERE v.vehicle_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.json({ success: true, vehicle: result.rows[0] });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Bookmark vehicle
exports.bookmarkVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.body;
    const userId = req.user.user_id;

    // Check if already bookmarked
    const existing = await db.query(
      'SELECT * FROM bookmarks WHERE user_id = $1 AND vehicle_id = $2',
      [userId, vehicleId]
    );

    if (existing.rows.length > 0) {
      // Remove bookmark
      await db.query(
        'DELETE FROM bookmarks WHERE user_id = $1 AND vehicle_id = $2',
        [userId, vehicleId]
      );
      return res.json({ success: true, message: 'Bookmark removed', bookmarked: false });
    }

    // Add bookmark
    await db.query(
      'INSERT INTO bookmarks (user_id, vehicle_id) VALUES ($1, $2)',
      [userId, vehicleId]
    );

    res.json({ success: true, message: 'Vehicle bookmarked!', bookmarked: true });
  } catch (error) {
    console.error('Bookmark error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get user's bookmarked vehicles
exports.getBookmarkedVehicles = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const result = await db.query(`
      SELECT 
        v.*,
        u.name as seller_name,
        vv.status as vin_status,
        b.created_at as bookmarked_at
      FROM bookmarks b
      JOIN vehicles v ON b.vehicle_id = v.vehicle_id
      JOIN users u ON v.user_id = u.user_id
      LEFT JOIN vin_verification vv ON v.vehicle_id = vv.vehicle_id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [userId]);

    res.json({ success: true, bookmarks: result.rows });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};