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

// Configure Cloudinary storage for vehicle images
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'carma/vehicles',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 1200, height: 800, crop: 'limit' }]
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('vehicleImage');


//add Vehicle
exports.addVehicle = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      console.error('Vehicle upload error:', err);
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const { make, model, year, price, description, vin_number, mileage, location, transmission } = req.body;
      const userId = req.user.user_id;
      const imagePath = req.file ? req.file.path : null;

      console.log('✅ Vehicle Image Uploaded to Cloudinary:', imagePath);

      // Validation
      if (!make || !model || !vin_number || !year || !price) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please provide all required fields' 
        });
      }

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

      // Check if VIN already exists
      const vinCheck = await db.query(
        'SELECT * FROM vehicles WHERE vin_number = $1',
        [vin_number]
      );

      if (vinCheck.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'A vehicle with this VIN already exists' 
        });
      }

      // Insert vehicle with transmission field
      const result = await db.query(
        `INSERT INTO vehicles (user_id, make, model, year, price, description, vin_number, image_path, mileage, location, transmission, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) 
         RETURNING *`,
        [userId, make, model, year, price, description, vin_number, imagePath, mileage, location, transmission]
      );

      // Create VIN verification record
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
    const { vehicleId } = req.params;
    const userId = req.user.user_id;

    const result = await db.query(
      `SELECT v.*, vv.status as vin_status
       FROM vehicles v
       LEFT JOIN vin_verification vv ON v.vehicle_id = vv.vehicle_id
       WHERE v.vehicle_id = $1 AND v.user_id = $2`,
      [vehicleId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      vehicle: result.rows[0]
    });

  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vehicle'
    });
  }
};

// Update vehicle
exports.updateVehicle = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      console.error('Vehicle upload error:', err);
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const { vehicleId } = req.params;
      const userId = req.user.user_id;
      const { make, model, year, price, description, mileage, location, transmission } = req.body;

      // Check ownership
      const ownerCheck = await db.query(
        'SELECT * FROM vehicles WHERE vehicle_id = $1 AND user_id = $2',
        [vehicleId, userId]
      );

      if (ownerCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to edit this vehicle'
        });
      }

      // Handle new image if uploaded
      let imagePath = ownerCheck.rows[0].image_path;
      if (req.file) {
        imagePath = req.file.path;
        console.log('✅ New vehicle image uploaded:', imagePath);
      }

      // Update vehicle with transmission
      const updateResult = await db.query(
        `UPDATE vehicles 
         SET make = $1, model = $2, year = $3, price = $4, 
             description = $5, image_path = $6, mileage = $7, location = $8, transmission = $9
         WHERE vehicle_id = $10 AND user_id = $11
         RETURNING *`,
        [make, model, year, price, description, imagePath, mileage, location, transmission, vehicleId, userId]
      );

      res.json({
        success: true,
        message: 'Vehicle updated successfully',
        vehicle: updateResult.rows[0]
      });

    } catch (error) {
      console.error('Update vehicle error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update vehicle'
      });
    }
  });
};

// Delete vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const userId = req.user.user_id;

    // Check ownership
    const ownerCheck = await db.query(
      'SELECT * FROM vehicles WHERE vehicle_id = $1 AND user_id = $2',
      [vehicleId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this vehicle'
      });
    }

    // Delete bookmarks first
    await db.query('DELETE FROM bookmarks WHERE vehicle_id = $1', [vehicleId]);

    // Delete VIN verification
    await db.query('DELETE FROM vin_verification WHERE vehicle_id = $1', [vehicleId]);

    // Delete vehicle
    await db.query('DELETE FROM vehicles WHERE vehicle_id = $1', [vehicleId]);

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });

  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vehicle'
    });
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