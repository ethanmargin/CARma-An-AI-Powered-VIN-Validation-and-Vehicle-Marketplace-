// Add to existing vin.js routes
const vinOcrController = require('../controllers/vinOcrController');

// Test VIN extraction from text
router.post('/test-extract', vinOcrController.testVINExtraction);