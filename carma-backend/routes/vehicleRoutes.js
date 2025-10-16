const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Existing routes...
router.post('/add', protect, upload.single('vehicleImage'), vehicleController.addVehicle);
router.get('/my', protect, vehicleController.getMyVehicles);
router.get('/all', protect, vehicleController.getAllVehicles);

// 🆕 NEW ROUTES
router.get('/:vehicleId', protect, vehicleController.getVehicleById);
router.put('/:vehicleId', protect, upload.single('vehicleImage'), vehicleController.updateVehicle);
router.delete('/:vehicleId', protect, vehicleController.deleteVehicle);

// Bookmarks
router.post('/:vehicleId/bookmark', protect, vehicleController.toggleBookmark);
router.get('/my/bookmarks', protect, vehicleController.getMyBookmarks);

module.exports = router;