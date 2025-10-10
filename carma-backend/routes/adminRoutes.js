const express = require('express');
const router = express.Router();
const {
  getPendingVerifications,
  getAllVerifications,
  verifyUser,
  updateVerificationStatus,
  getDashboardStats
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Protect all admin routes
router.use(protect);
router.use(authorize('admin'));

// Routes
router.get('/verifications/pending', getPendingVerifications);
router.get('/verifications/all', getAllVerifications);
router.get('/stats', getDashboardStats);

// This is the important one for approval/rejection
router.put('/verify-user', verifyUser);

// Legacy route (keeping for compatibility)
router.put('/verifications/update', updateVerificationStatus);

module.exports = router;