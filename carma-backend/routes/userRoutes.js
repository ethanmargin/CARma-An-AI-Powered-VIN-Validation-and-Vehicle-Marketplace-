const express = require('express');
const router = express.Router();
const { uploadID, getVerificationStatus, getProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// All routes are protected (require authentication)
router.post('/upload-id', protect, uploadID);
router.get('/verification-status', protect, getVerificationStatus);
router.get('/profile', protect, getProfile);

module.exports = router;