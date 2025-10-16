const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { protect } = require('../middleware/auth');


// Vehicle routes - upload is handled INSIDE the controller functions
router.post('/add', protect, vehicleController.addVehicle);
router.get('/my', protect, vehicleController.getMyVehicles);
router.get('/all', protect, vehicleController.getAllVehicles);
router.get('/:vehicleId', protect, vehicleController.getVehicleById);
router.put('/:vehicleId', protect, vehicleController.updateVehicle);
router.delete('/:vehicleId', protect, vehicleController.deleteVehicle);

// Bookmarks
router.post('/bookmark', protect, vehicleController.bookmarkVehicle);
router.get('/my/bookmarks', protect, vehicleController.getBookmarkedVehicles);

module.exports = router;