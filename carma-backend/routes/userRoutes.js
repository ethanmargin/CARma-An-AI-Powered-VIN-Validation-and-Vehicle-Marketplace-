const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // ← Make sure this line exists
const { protect } = require('../middleware/auth');

// Get user profile
router.get('/profile', protect, userController.getProfile);

// Update profile (name, mobile)
router.put('/profile', protect, userController.updateProfile);

// Change password
router.put('/change-password', protect, userController.changePassword);

// Upload ID
router.post('/upload-id', protect, userController.uploadID);

// Get verification status
router.get('/verification-status', protect, userController.getVerificationStatus);

module.exports = router;