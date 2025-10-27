const db = require('../config/db');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const vinOCR = require('../services/vinOCR');
const { performVINOCR } = require('./vinOcrController');
const VINExtractor = require('../utils/vinExtractor');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for vehicle images
const vehicleStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'carma/vehicles',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 1200, height: 800, crop: 'limit' }]
  }
});

// Configure Cloudinary storage for VIN images
const vinStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'carma/vin-plates',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto:best' }]
  }
});

// Handle multiple file uploads (vehicle image + VIN image)
const upload = multer({
  storage: vehicleStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
}).fields([
  { name: 'vehicleImage', maxCount: 1 },
  { name: 'vinImage', maxCount: 1 }
]);

// Helper function to run ENHANCED OCR verification in background
async function runOCRVerification(vehicleId, vinImagePath, expectedVIN, userId) {
  try {
    console.log(`🤖 Starting ENHANCED auto-verification for vehicle ${vehicleId}...`);
    console.log(`📋 Expected VIN: ${expectedVIN}`);
    console.log(`📸 VIN Image URL: ${vinImagePath}`);
    
    let ocrResult;
    let extractedVIN;
    let similarity = 0;
    let ocrConfidence = 'low';
    
    try {
      // Use enhanced OCR with smart extraction
      console.log('🔍 Running ENHANCED OCR with smart VIN extraction...');
      const enhancedResult = await performVINOCR(vinImagePath);
      
      console.log('✅ Enhanced OCR completed:', enhancedResult);
      
      extractedVIN = enhancedResult.vin;
      ocrConfidence = enhancedResult.confidence >= 100 ? 'high' : 
                     enhancedResult.confidence >= 70 ? 'medium' : 'low';
      
      // Calculate similarity
      if (extractedVIN && expectedVIN) {
        const maxLength = Math.max(extractedVIN.length, expectedVIN.length);
        let matches = 0;
        
        for (let i = 0; i < Math.min(extractedVIN.length, expectedVIN.length); i++) {
          if (extractedVIN[i] === expectedVIN[i]) {
            matches++;
          }
        }
        
        similarity = Math.round((matches / maxLength) * 100);
      }
      
      console.log(`📊 VIN Comparison:`);
      console.log(`   Expected: ${expectedVIN}`);
      console.log(`   Extracted: ${extractedVIN}`);
      console.log(`   Similarity: ${similarity}%`);
      console.log(`   Valid: ${enhancedResult.isValid}`);
      
      ocrResult = {
        success: true,
        extractedVIN: extractedVIN,
        expectedVIN: expectedVIN,
        similarity: similarity,
        confidence: ocrConfidence,
        isValid: enhancedResult.isValid
      };
      
    } catch (enhancedOCRError) {
      console.error('⚠️ Enhanced OCR failed, falling back to legacy OCR:', enhancedOCRError);
      ocrResult = await vinOCR.verifyVINFromImage(vinImagePath, expectedVIN);
      extractedVIN = ocrResult.extractedVIN;
      similarity = ocrResult.similarity || 0;
      ocrConfidence = ocrResult.confidence || 'low';
    }
    
    // Determine status based on similarity and validation
    let newStatus = 'pending';
    let verificationNotes = '';
    let recommendation = '';
    
    if (extractedVIN === expectedVIN && ocrResult.isValid) {
      newStatus = 'approved';
      recommendation = 'auto_approve';
      verificationNotes = `✅ Auto-approved: Perfect VIN match (100%). Extracted: ${extractedVIN}. Confidence: ${ocrConfidence}. Valid check digit.`;
    } else if (similarity >= 90 && ocrResult.isValid) {
      newStatus = 'approved';
      recommendation = 'auto_approve';
      verificationNotes = `✅ Auto-approved: High similarity (${similarity}%). Expected: ${expectedVIN}, Extracted: ${extractedVIN}. Confidence: ${ocrConfidence}. Valid check digit.`;
    } else if (similarity >= 70) {
      newStatus = 'pending';
      recommendation = 'manual_review';
      verificationNotes = `⚠️ Manual review required: Moderate similarity (${similarity}%). Expected: ${expectedVIN}, Extracted: ${extractedVIN}. Confidence: ${ocrConfidence}. Admin will verify.`;
    } else {
      newStatus = 'rejected';
      recommendation = 'reject';
      verificationNotes = `❌ Auto-rejected: Low similarity (${similarity}%). Expected: ${expectedVIN}, Extracted: ${extractedVIN || 'NONE'}. Confidence: ${ocrConfidence}. Please re-upload clearer VIN image.`;
    }
    
    console.log(`🎯 OCR Decision: ${newStatus} (${recommendation})`);
    
    // Update database
    await db.query(
      `UPDATE vin_verification 
       SET status = $1, 
           ocr_extracted_vin = $2,
           ocr_confidence = $3,
           verification_notes = $4,
           date_verified = CURRENT_TIMESTAMP
       WHERE vehicle_id = $5`,
      [newStatus, extractedVIN || null, ocrConfidence, verificationNotes, vehicleId]
    );
    
    // Log OCR action
    await db.query(
      'INSERT INTO system_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [userId, 'VIN_AUTO_OCR', `Enhanced OCR for vehicle ${vehicleId}: ${newStatus} (${similarity}% similarity)`]
    );
    
    console.log(`✅ Automatic ENHANCED OCR completed for vehicle ${vehicleId}: ${newStatus}`);
    
  } catch (error) {
    console.error(`❌ OCR verification failed for vehicle ${vehicleId}:`, error);
    
    await db.query(
      `UPDATE vin_verification 
       SET verification_notes = $1
       WHERE vehicle_id = $2`,
      [`⚠️ Automatic OCR failed: ${error.message}. Admin will review manually.`, vehicleId]
    );
  }
}

// Add Vehicle with VIN Image and AUTO-OCR
exports.addVehicle = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      console.error('Vehicle upload error:', err);
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const { make, model, year, price, description, vin_number, mileage, location, transmission, fuel_type } = req.body;
      const userId = req.user.user_id;
      
      const vehicleImagePath = req.files?.vehicleImage ? req.files.vehicleImage[0].path : null;
      const vinImagePath = req.files?.vinImage ? req.files.vinImage[0].path : null;

      console.log('✅ Vehicle Image Uploaded:', vehicleImagePath);
      console.log('✅ VIN Image Uploaded:', vinImagePath);

      // Validation
      if (!make || !model || !vin_number || !year || !price || !fuel_type) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please provide all required fields (including fuel type)' 
        });
      }

      if (!vinImagePath) {
        return res.status(400).json({
          success: false,
          message: 'VIN plate image is required for verification'
        });
      }

      // Validate seller is verified
      const verificationCheck = await db.query(
        'SELECT status FROM user_verification WHERE user_id = $1',
        [userId]
      );

      if (verificationCheck.rows[0]?.status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: 'You must be verified before adding vehicles'
        });
      }

      // Check if VIN already exists
      const vinCheck = await db.query(
        'SELECT * FROM vehicles WHERE vin_number = $1',
        [vin_number]
      );

      if (vinCheck.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'A vehicle with this VIN already exists' 
        });
      }

      // 🆕 FIXED: Insert vehicle with listed_at set to NOW() since it's immediately visible
      const result = await db.query(
        `INSERT INTO vehicles (user_id, make, model, year, price, description, vin_number, image_path, mileage, location, transmission, fuel_type, visibility_status, listed_at, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()) 
         RETURNING *`,
        [userId, make, model, year, price, description, vin_number, vehicleImagePath, mileage, location, transmission, fuel_type, 'visible']
      );

      const vehicleId = result.rows[0].vehicle_id;
      console.log(`✅ Vehicle ${vehicleId} created and listed at: ${new Date().toISOString()}`);

      // Create VIN verification record
      await db.query(
        'INSERT INTO vin_verification (vehicle_id, status, submitted_vin_image) VALUES ($1, $2, $3)',
        [vehicleId, 'pending', vinImagePath]
      );

      // Auto-trigger ENHANCED OCR
      console.log('🤖 Auto-triggering ENHANCED OCR verification...');
      runOCRVerification(vehicleId, vinImagePath, vin_number, userId).catch(error => {
        console.error('❌ Background OCR error:', error);
      });

      // Log action
      await db.query(
        'INSERT INTO system_logs (user_id, action, details) VALUES ($1, $2, $3)',
        [userId, 'VEHICLE_ADDED', `Added vehicle: ${make} ${model} (${fuel_type}) - Listed immediately with enhanced OCR`]
      );

      res.status(201).json({
        success: true,
        message: '🚗 Vehicle added and listed successfully! 🤖 AI is automatically verifying your VIN with enhanced detection...',
        vehicle: result.rows[0]
      });

    } catch (error) {
      console.error('Add vehicle error:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  });
};

// Get all vehicles (for buyers to browse) - EXCLUDE HIDDEN
exports.getAllVehicles = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        v.vehicle_id,
        v.make,
        v.model,
        v.year,
        v.price,
        v.description,
        v.vin_number,
        v.image_path,
        v.mileage,
        v.location,
        v.transmission,
        v.fuel_type,
        v.created_at,
        v.listed_at,
        u.name as seller_name,
        u.email as seller_email,
        u.mobile_number as seller_mobile,
        vv.status as vin_status
      FROM vehicles v
      JOIN users u ON v.user_id = u.user_id
      LEFT JOIN vin_verification vv ON v.vehicle_id = vv.vehicle_id
      WHERE (v.visibility_status = 'visible' OR v.visibility_status IS NULL)
      ORDER BY v.created_at DESC
    `);

    res.json({ success: true, vehicles: result.rows });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Get seller's own vehicles
exports.getMyVehicles = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const result = await db.query(`
      SELECT 
        v.*,
        vv.status as vin_status,
        vv.date_verified,
        vv.verification_notes
      FROM vehicles v
      LEFT JOIN vin_verification vv ON v.vehicle_id = vv.vehicle_id
      WHERE v.user_id = $1
      ORDER BY v.created_at DESC
    `, [userId]);

    res.json({ success: true, vehicles: result.rows });
  } catch (error) {
    console.error('Get my vehicles error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get single vehicle details
exports.getVehicleById = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const userId = req.user.user_id;

    const result = await db.query(
      `SELECT v.*, vv.status as vin_status
       FROM vehicles v
       LEFT JOIN vin_verification vv ON v.vehicle_id = vv.vehicle_id
       WHERE v.vehicle_id = $1 AND v.user_id = $2`,
      [vehicleId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      vehicle: result.rows[0]
    });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vehicle'
    });
  }
};

// Update vehicle with VIN editing and AUTO-OCR
exports.updateVehicle = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      console.error('Vehicle upload error:', err);
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const { vehicleId } = req.params;
      const userId = req.user.user_id;
      const { make, model, year, price, description, mileage, location, transmission, fuel_type, vin_number, visibility_status } = req.body;

      // Check ownership
      const ownerCheck = await db.query(
        'SELECT * FROM vehicles WHERE vehicle_id = $1 AND user_id = $2',
        [vehicleId, userId]
      );

      if (ownerCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to edit this vehicle'
        });
      }

      const vehicle = ownerCheck.rows[0];

      // 🆕 NEW: Track when vehicle is first listed
      let listedAtUpdate = '';
      if (
        visibility_status === 'visible' && 
        vehicle.visibility_status !== 'visible' && 
        !vehicle.listed_at
      ) {
        listedAtUpdate = ', listed_at = NOW()';
        console.log(`🎉 Vehicle ${vehicleId} is being listed for the first time!`);
      }

      // Handle new vehicle image if uploaded
      let vehicleImagePath = vehicle.image_path;
      if (req.files?.vehicleImage) {
        vehicleImagePath = req.files.vehicleImage[0].path;
        console.log('✅ New vehicle image uploaded:', vehicleImagePath);
      }

      // Handle new VIN image and auto-trigger ENHANCED OCR
      if (req.files?.vinImage) {
        const vinImagePath = req.files.vinImage[0].path;
        console.log('✅ New VIN image uploaded:', vinImagePath);
        
        await db.query(
          `UPDATE vin_verification 
           SET submitted_vin_image = $1, 
               status = 'pending',
               ocr_extracted_vin = NULL,
               ocr_confidence = NULL,
               verification_notes = 'Seller re-uploaded VIN image. Enhanced AI is auto-verifying...',
               date_verified = NULL
           WHERE vehicle_id = $2`,
          [vinImagePath, vehicleId]
        );
        
        console.log('✅ VIN image updated, verification reset to pending');
        
        // Use the VIN number from the request body or existing vehicle
        const vinToVerify = vin_number || vehicle.vin_number;
        
        console.log('🤖 Auto-triggering ENHANCED OCR verification on re-upload...');
        runOCRVerification(vehicleId, vinImagePath, vinToVerify, userId).catch(error => {
          console.error('❌ Background OCR error:', error);
        });
      }

      // 🆕 Handle VIN number editing
      let updateQuery = `UPDATE vehicles 
         SET make = $1, model = $2, year = $3, price = $4, 
             description = $5, image_path = $6, mileage = $7, location = $8, transmission = $9, fuel_type = $10`;
      let updateParams = [make, model, year, price, description, vehicleImagePath, mileage, location, transmission, fuel_type];
      
      let paramCount = 11;

      // Add visibility_status if provided
      if (visibility_status !== undefined) {
        updateQuery += `, visibility_status = $${paramCount}`;
        updateParams.push(visibility_status);
        paramCount++;
      }

      // Check VIN verification status
      const vinStatusCheck = await db.query(
        'SELECT status FROM vin_verification WHERE vehicle_id = $1',
        [vehicleId]
      );
      const vinStatus = vinStatusCheck.rows[0]?.status;

      // Allow VIN editing only if pending, rejected, or no status
      if (vin_number && vin_number !== vehicle.vin_number) {
        if (vinStatus === 'approved') {
          return res.status(400).json({
            success: false,
            message: '❌ Cannot edit VIN - already approved by admin. Contact support if you need to change it.'
          });
        }

        // VIN can be edited
        updateQuery += `, vin_number = $${paramCount}`;
        updateParams.push(vin_number);
        paramCount++;
        
        console.log(`✅ VIN updated from ${vehicle.vin_number} to ${vin_number} (status was: ${vinStatus})`);
        
        // Reset VIN verification
        await db.query(
          `UPDATE vin_verification 
           SET status = 'pending', 
               ocr_extracted_vin = NULL,
               ocr_confidence = NULL,
               verification_notes = 'VIN number changed by seller. Needs re-verification.',
               date_verified = NULL
           WHERE vehicle_id = $1`,
          [vehicleId]
        );
      }

      // Add listed_at update if needed
      updateQuery += `${listedAtUpdate} WHERE vehicle_id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING *`;
      updateParams.push(vehicleId, userId);

      const updateResult = await db.query(updateQuery, updateParams);

      let message = 'Vehicle updated successfully';
      if (listedAtUpdate) {
        message = '🎉 Vehicle listed successfully!';
      } else if (req.files?.vinImage) {
        message = '🚗 Vehicle updated! 🤖 Enhanced AI is automatically re-verifying your VIN...';
      } else if (vin_number && vin_number !== vehicle.vin_number) {
        message = '🚗 Vehicle and VIN updated! ⚠️ VIN verification reset to pending. Please re-upload VIN image for auto-verification.';
      }

      res.json({
        success: true,
        message: message,
        vehicle: updateResult.rows[0]
      });

    } catch (error) {
      console.error('Update vehicle error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update vehicle',
        error: error.message
      });
    }
  });
};

// Delete vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const userId = req.user.user_id;

    const ownerCheck = await db.query(
      'SELECT * FROM vehicles WHERE vehicle_id = $1 AND user_id = $2',
      [vehicleId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this vehicle'
      });
    }

    await db.query('DELETE FROM bookmarks WHERE vehicle_id = $1', [vehicleId]);
    await db.query('DELETE FROM vin_verification WHERE vehicle_id = $1', [vehicleId]);
    await db.query('DELETE FROM vehicles WHERE vehicle_id = $1', [vehicleId]);

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vehicle'
    });
  }
};

// Bookmark vehicle
exports.bookmarkVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.body;
    const userId = req.user.user_id;

    const existing = await db.query(
      'SELECT * FROM bookmarks WHERE user_id = $1 AND vehicle_id = $2',
      [userId, vehicleId]
    );

    if (existing.rows.length > 0) {
      await db.query(
        'DELETE FROM bookmarks WHERE user_id = $1 AND vehicle_id = $2',
        [userId, vehicleId]
      );
      return res.json({ success: true, message: 'Bookmark removed', bookmarked: false });
    }

    await db.query(
      'INSERT INTO bookmarks (user_id, vehicle_id) VALUES ($1, $2)',
      [userId, vehicleId]
    );

    res.json({ success: true, message: 'Vehicle bookmarked!', bookmarked: true });
  } catch (error) {
    console.error('Bookmark error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get user's bookmarked vehicles
exports.getBookmarkedVehicles = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const result = await db.query(`
      SELECT 
        v.*,
        u.name as seller_name,
        u.email as seller_email,
        u.mobile_number as seller_mobile,
        vv.status as vin_status,
        b.created_at as bookmarked_at
      FROM bookmarks b
      JOIN vehicles v ON b.vehicle_id = v.vehicle_id
      JOIN users u ON v.user_id = u.user_id
      LEFT JOIN vin_verification vv ON v.vehicle_id = vv.vehicle_id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [userId]);

    res.json({ success: true, bookmarks: result.rows });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = exports;