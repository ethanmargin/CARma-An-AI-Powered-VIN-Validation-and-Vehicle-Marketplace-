const express = require('express');
const router = express.Router();
const {
  addVehicle,
  getAllVehicles,
  getMyVehicles,
  getVehicleById,
  bookmarkVehicle,
  getBookmarkedVehicles
} = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/all', getAllVehicles);
router.get('/:id', getVehicleById);

// Protected routes
router.post('/add', protect, authorize('seller'), addVehicle);
router.get('/my/vehicles', protect, authorize('seller'), getMyVehicles);
router.post('/bookmark', protect, bookmarkVehicle);
router.get('/my/bookmarks', protect, getBookmarkedVehicles);

module.exports = router;