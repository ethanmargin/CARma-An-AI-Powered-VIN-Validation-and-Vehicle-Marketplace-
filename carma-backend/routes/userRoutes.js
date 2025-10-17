const express = require('express');
const router = express.Router();
const { uploadID, getVerificationStatus, getProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// All routes are protected (require authentication)
router.post('/upload-id', protect, userController.uploadID);
router.get('/verification-status', protect, getVerificationStatus);
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
// Change password
router.put('/change-password', protect, userController.changePassword);
module.exports = router;