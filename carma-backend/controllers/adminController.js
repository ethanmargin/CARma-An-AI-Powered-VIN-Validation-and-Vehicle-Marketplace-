const db = require('../config/db');

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