const express = require('express');
const router = express.Router();
const { 
  getPendingVerifications, 
  getAllVerifications,
  updateVerificationStatus,
  getDashboardStats 
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes require admin role
router.get('/verifications/pending', protect, authorize('admin'), getPendingVerifications);
router.get('/verifications/all', protect, authorize('admin'), getAllVerifications);
router.put('/verifications/update', protect, authorize('admin'), updateVerificationStatus);
router.get('/stats', protect, authorize('admin'), getDashboardStats);

module.exports = router;