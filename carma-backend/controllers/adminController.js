const db = require('../config/db');
const vinOCR = require('../services/vinOCR');

// Get all pending verifications
exports.getPendingVerifications = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        uv.verification_id,
        uv.user_id,
        uv.status,
        uv.submitted_id,
        uv.date_verified,
        uv.id_type,
        uv.id_data,
        u.name,
        u.email,
        u.role,
        u.created_at
      FROM user_verification uv
      JOIN users u ON uv.user_id = u.user_id
      WHERE uv.status = 'pending'
      ORDER BY u.created_at DESC
    `);

    res.json({
      success: true,
      verifications: result.rows
    });

  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Get all verifications (approved, rejected, pending)
exports.getAllVerifications = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.role,
        u.created_at,
        uv.verification_id,
        uv.status,
        uv.submitted_id,
        uv.date_verified,
        uv.id_type,
        uv.id_data
      FROM users u
      LEFT JOIN user_verification uv ON u.user_id = uv.user_id
      WHERE u.role IN ('buyer', 'seller')
      ORDER BY 
        CASE 
          WHEN uv.status = 'pending' THEN 1
          WHEN uv.status = 'approved' THEN 2
          WHEN uv.status = 'rejected' THEN 3
          ELSE 4
        END,
        u.created_at DESC
    `);

    res.json({
      success: true,
      verifications: result.rows
    });

  } catch (error) {
    console.error('Get all verifications error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Verify or reject user (Updated function)
exports.verifyUser = async (req, res) => {
  try {
    const { userId, status } = req.body;

    console.log('Verification request:', { userId, status });

    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be "approved" or "rejected"' 
      });
    }

    // Check if user exists
    const userCheck = await db.query(
      'SELECT * FROM users WHERE user_id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if verification record exists
    const verificationCheck = await db.query(
      'SELECT * FROM user_verification WHERE user_id = $1',
      [userId]
    );

    if (verificationCheck.rows.length === 0) {
      // Create verification record if it doesn't exist
      await db.query(
        'INSERT INTO user_verification (user_id, status, date_verified) VALUES ($1, $2, NOW())',
        [userId, status]
      );
    } else {
      // Update existing verification
      await db.query(
        'UPDATE user_verification SET status = $1, date_verified = NOW() WHERE user_id = $2',
        [status, userId]
      );
    }

    // Log the action
    await db.query(
      'INSERT INTO system_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.user_id, 'USER_VERIFICATION_UPDATED', `Admin ${status} user ${userId}`]
    );

    console.log('✅ Verification updated successfully');

    res.json({ 
      success: true, 
      message: `User ${status} successfully!` 
    });

  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Approve or reject verification (Legacy - keeping for compatibility)
exports.updateVerificationStatus = async (req, res) => {
  try {
    const { userId, status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be "approved" or "rejected"' 
      });
    }

    const result = await db.query(
      'UPDATE user_verification SET status = $1, date_verified = NOW() WHERE user_id = $2 RETURNING *',
      [status, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User verification not found' 
      });
    }

    // Log the action
    await db.query(
      'INSERT INTO system_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.user_id, 'VERIFICATION_UPDATE', `Admin ${status} user ${userId}`]
    );

    res.json({
      success: true,
      message: `User verification ${status} successfully`,
      verification: result.rows[0]
    });

  } catch (error) {
    console.error('Update verification status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Total users
    const totalUsers = await db.query('SELECT COUNT(*) FROM users WHERE role != $1', ['admin']);
    
    // Verified users
    const verifiedUsers = await db.query(
      'SELECT COUNT(*) FROM user_verification WHERE status = $1',
      ['approved']
    );
    
    // Pending verifications
    const pendingVerifications = await db.query(
      'SELECT COUNT(*) FROM user_verification WHERE status = $1',
      ['pending']
    );
    
    // Total vehicles
    const totalVehicles = await db.query('SELECT COUNT(*) FROM vehicles');
    
    // Verified vehicles
    const verifiedVehicles = await db.query(
      'SELECT COUNT(*) FROM vin_verification WHERE status = $1',
      ['approved']
    );

    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(totalUsers.rows[0].count),
        verifiedUsers: parseInt(verifiedUsers.rows[0].count),
        pendingVerifications: parseInt(pendingVerifications.rows[0].count),
        totalVehicles: parseInt(totalVehicles.rows[0].count),
        verifiedVehicles: parseInt(verifiedVehicles.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Get pending VIN verifications
exports.getPendingVINs = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        v.*,
        vv.status as vin_status,
        vv.submitted_vin_image,
        vv.ocr_extracted_vin,
        vv.ocr_confidence,
        vv.verification_notes,
        u.name as seller_name,
        u.email as seller_email
      FROM vehicles v
      LEFT JOIN vin_verification vv ON v.vehicle_id = vv.vehicle_id
      JOIN users u ON v.user_id = u.user_id
      WHERE vv.status = 'pending'
      ORDER BY v.created_at DESC
    `);

    res.json({
      success: true,
      vins: result.rows
    });

  } catch (error) {
    console.error('Get pending VINs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending VINs'
    });
  }
};

// Manually verify/reject VIN
exports.verifyVIN = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { status, notes } = req.body; // status: 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either approved or rejected'
      });
    }

    // Update VIN verification
    await db.query(
      `UPDATE vin_verification 
       SET status = $1, 
           verification_notes = $2,
           date_verified = CURRENT_TIMESTAMP
       WHERE vehicle_id = $3`,
      [status, notes || `Manually ${status} by admin`, vehicleId]
    );

    // Log action
    await db.query(
      'INSERT INTO system_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.user_id, 'VIN_MANUAL_VERIFICATION', `Admin ${status} VIN for vehicle ${vehicleId}`]
    );

    res.json({
      success: true,
      message: `VIN ${status} successfully`
    });

  } catch (error) {
    console.error('Verify VIN error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify VIN'
    });
  }
};

// Auto-verify VIN using OCR (Tesseract)
exports.autoVerifyVIN = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    console.log('🤖 Starting auto-verification for vehicle:', vehicleId);

    // Get vehicle info
    const vehicleResult = await db.query(
      'SELECT v.*, vv.submitted_vin_image FROM vehicles v LEFT JOIN vin_verification vv ON v.vehicle_id = vv.vehicle_id WHERE v.vehicle_id = $1',
      [vehicleId]
    );

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    const vehicle = vehicleResult.rows[0];

    if (!vehicle.submitted_vin_image) {
      return res.status(400).json({
        success: false,
        message: 'No VIN image uploaded for this vehicle'
      });
    }

    // Run OCR verification
    console.log('🔍 Running Tesseract OCR verification...');
    const ocrResult = await vinOCR.verifyVINFromImage(
      vehicle.submitted_vin_image,
      vehicle.vin_number
    );

    console.log('📊 OCR Result:', ocrResult);

    // Update verification based on OCR result
    let newStatus = 'pending';
    let verificationNotes = '';

    if (ocrResult.recommendation === 'auto_approve') {
      newStatus = 'approved';
      verificationNotes = `✅ Auto-approved by OCR. VIN matched: ${ocrResult.extractedVIN}. Confidence: ${ocrResult.confidence}`;
    } else if (ocrResult.recommendation === 'reject') {
      newStatus = 'rejected';
      verificationNotes = `❌ Auto-rejected. ${ocrResult.reason}`;
    } else {
      newStatus = 'pending';
      verificationNotes = `⚠️ Flagged for manual review. ${ocrResult.reason || ocrResult.message}`;
    }

    // Update database
    await db.query(
      `UPDATE vin_verification 
       SET status = $1, 
           ocr_extracted_vin = $2,
           ocr_confidence = $3,
           verification_notes = $4,
           date_verified = CURRENT_TIMESTAMP
       WHERE vehicle_id = $5`,
      [
        newStatus,
        ocrResult.extractedVIN || null,
        ocrResult.confidence || 'low',
        verificationNotes,
        vehicleId
      ]
    );

    // Log action
    await db.query(
      'INSERT INTO system_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.user_id, 'VIN_OCR_VERIFICATION', `OCR verified vehicle ${vehicleId}: ${newStatus}`]
    );

    res.json({
      success: true,
      message: 'OCR verification completed',
      ocrResult: ocrResult,
      newStatus: newStatus,
      notes: verificationNotes
    });

  } catch (error) {
    console.error('❌ Auto verify VIN error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify VIN',
      error: error.message
    });
  }
};

// Get system logs
exports.getSystemLogs = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        sl.*,
        u.name as user_name,
        u.email as user_email
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.user_id
      ORDER BY sl.timestamp DESC
      LIMIT 100
    `);

    res.json({
      success: true,
      logs: result.rows
    });

  } catch (error) {
    console.error('Get system logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system logs'
    });
    // Get all vehicles for admin
exports.getAllVehiclesForAdmin = async (req, res) => {
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
    console.error('Get all vehicles error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Toggle vehicle visibility
exports.toggleVehicleVisibility = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { status } = req.body; // 'visible' or 'hidden'

    await db.query(
      'UPDATE vehicles SET visibility_status = $1 WHERE vehicle_id = $2',
      [status, vehicleId]
    );

    // Log action
    await db.query(
      'INSERT INTO system_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.user_id, 'VEHICLE_VISIBILITY_CHANGED', `Vehicle ${vehicleId} set to ${status}`]
    );

    res.json({ 
      success: true, 
      message: `Vehicle ${status === 'hidden' ? 'hidden' : 'shown'} successfully` 
    });
  } catch (error) {
    console.error('Toggle visibility error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
  }
};