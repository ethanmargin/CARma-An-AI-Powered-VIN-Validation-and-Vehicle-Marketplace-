const express = require('express');
const router = express.Router();
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

module.exports = router;