const express = require('express');
const router = express.Router();
const db = require('../config/db'); // 🆕 ADD THIS LINE
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Protect all admin routes
router.use(protect);
router.use(authorize('admin'));

// Dashboard Stats
router.get('/stats', adminController.getDashboardStats);

// User Verification Routes
router.get('/verifications/pending', adminController.getPendingVerifications);
router.get('/verifications/all', adminController.getAllVerifications);
router.put('/verify-user', adminController.verifyUser);
router.put('/verifications/update', adminController.updateVerificationStatus);

// VIN Verification Routes
router.get('/pending-vins', adminController.getPendingVINs);
router.post('/verify-vin/:vehicleId', adminController.verifyVIN);

// Auto-verify VIN using OCR (Tesseract)
router.post('/vehicles/:vehicleId/auto-verify-vin', adminController.autoVerifyVIN);

// System Logs
router.get('/logs', adminController.getSystemLogs);

// Get all vehicles for admin
router.get('/all-vehicles', adminController.getAllVehiclesForAdmin);

// Toggle vehicle visibility
router.put('/vehicles/:vehicleId/visibility', adminController.toggleVehicleVisibility);

// Get analytics/reports (admin only)
router.get('/reports', async (req, res) => { // 🆕 REMOVED 'authenticate' - already protected by router.use(protect)
  try {
    // USER ANALYTICS
    const userStats = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'buyer' THEN 1 END) as total_buyers,
        COUNT(CASE WHEN role = 'seller' THEN 1 END) as total_sellers,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins
      FROM users
    `);

    const verificationStats = await db.query(`
      SELECT 
        COUNT(*) as total_verifications,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as verified_users,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_verifications,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_verifications
      FROM user_verification
    `);

    // VEHICLE ANALYTICS
    const vehicleStats = await db.query(`
      SELECT 
        COUNT(*) as total_vehicles,
        COUNT(CASE WHEN visibility_status = 'visible' OR visibility_status IS NULL THEN 1 END) as visible_vehicles,
        COUNT(CASE WHEN visibility_status = 'hidden' THEN 1 END) as hidden_vehicles,
        ROUND(AVG(price), 2) as avg_price,
        MAX(price) as max_price,
        MIN(price) as min_price
      FROM vehicles
    `);

    // VIN VERIFICATION ANALYTICS
    const vinStats = await db.query(`
      SELECT 
        COUNT(*) as total_vin_verifications,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_vins,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_vins,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_vins,
        COUNT(CASE WHEN ocr_confidence = 'high' THEN 1 END) as high_confidence_ocr,
        COUNT(CASE WHEN ocr_confidence = 'medium' THEN 1 END) as medium_confidence_ocr,
        COUNT(CASE WHEN ocr_confidence = 'low' THEN 1 END) as low_confidence_ocr
      FROM vin_verification
    `);

    // TOP VEHICLE MAKES
    const topMakes = await db.query(`
      SELECT make, COUNT(*) as count
      FROM vehicles
      WHERE visibility_status = 'visible' OR visibility_status IS NULL
      GROUP BY make
      ORDER BY count DESC
      LIMIT 5
    `);

    // RECENT ACTIVITY (last 7 days)
    const recentActivity = await db.query(`
      SELECT 
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as users_this_week,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as users_this_month
      FROM users
    `);

    const recentVehicles = await db.query(`
      SELECT 
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as vehicles_this_week,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as vehicles_this_month
      FROM vehicles
    `);

    // Calculate percentages (🆕 ADDED SAFETY CHECKS)
    const totalUsers = parseInt(userStats.rows[0].total_users) || 0;
    const verifiedUsers = parseInt(verificationStats.rows[0].verified_users) || 0;
    const userVerificationRate = totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(1) : '0.0';

    const totalVehicles = parseInt(vehicleStats.rows[0].total_vehicles) || 0;
    const approvedVins = parseInt(vinStats.rows[0].approved_vins) || 0;
    const vinVerificationRate = totalVehicles > 0 ? ((approvedVins / totalVehicles) * 100).toFixed(1) : '0.0';

    const totalVinChecks = parseInt(vinStats.rows[0].total_vin_verifications) || 0;
    const ocrAutoApproved = parseInt(vinStats.rows[0].high_confidence_ocr) || 0;
    const ocrSuccessRate = totalVinChecks > 0 ? ((ocrAutoApproved / totalVinChecks) * 100).toFixed(1) : '0.0';

    res.json({
      success: true,
      reports: {
        users: {
          total_users: totalUsers,
          total_buyers: parseInt(userStats.rows[0].total_buyers) || 0,
          total_sellers: parseInt(userStats.rows[0].total_sellers) || 0,
          total_admins: parseInt(userStats.rows[0].total_admins) || 0,
          total_verifications: parseInt(verificationStats.rows[0].total_verifications) || 0,
          verified_users: verifiedUsers,
          pending_verifications: parseInt(verificationStats.rows[0].pending_verifications) || 0,
          rejected_verifications: parseInt(verificationStats.rows[0].rejected_verifications) || 0,
          verification_rate: userVerificationRate
        },
        vehicles: {
          total_vehicles: totalVehicles,
          visible_vehicles: parseInt(vehicleStats.rows[0].visible_vehicles) || 0,
          hidden_vehicles: parseInt(vehicleStats.rows[0].hidden_vehicles) || 0,
          avg_price: parseFloat(vehicleStats.rows[0].avg_price) || 0,
          max_price: parseFloat(vehicleStats.rows[0].max_price) || 0,
          min_price: parseFloat(vehicleStats.rows[0].min_price) || 0,
          vin_verification_rate: vinVerificationRate
        },
        vin_verification: {
          total_vin_verifications: totalVinChecks,
          approved_vins: approvedVins,
          pending_vins: parseInt(vinStats.rows[0].pending_vins) || 0,
          rejected_vins: parseInt(vinStats.rows[0].rejected_vins) || 0,
          high_confidence_ocr: ocrAutoApproved,
          medium_confidence_ocr: parseInt(vinStats.rows[0].medium_confidence_ocr) || 0,
          low_confidence_ocr: parseInt(vinStats.rows[0].low_confidence_ocr) || 0,
          ocr_success_rate: ocrSuccessRate
        },
        top_makes: topMakes.rows,
        recent_activity: {
          users_this_week: parseInt(recentActivity.rows[0].users_this_week) || 0,
          users_this_month: parseInt(recentActivity.rows[0].users_this_month) || 0,
          vehicles_this_week: parseInt(recentVehicles.rows[0].vehicles_this_week) || 0,
          vehicles_this_month: parseInt(recentVehicles.rows[0].vehicles_this_month) || 0
        }
      }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;