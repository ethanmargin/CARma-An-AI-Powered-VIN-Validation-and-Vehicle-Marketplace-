const Tesseract = require('tesseract.js');
const VINImagePreprocessor = require('../utils/vinImagePreprocessor');
const VINExtractor = require('../utils/vinExtractor');
const fs = require('fs').promises;

/**
 * Perform OCR on VIN image with smart extraction
 */
async function performVINOCR(imagePath) {
  console.log('🔍 Starting VIN OCR process...');
  
  const filesToCleanup = [];
  
  try {
    // Step 1: Download and preprocess image multiple ways
    console.log('📸 Preprocessing image...');
    const processedImages = await VINImagePreprocessor.multiplePreprocessAttempts(imagePath);
    filesToCleanup.push(...processedImages);
    
    // Step 2: Run OCR on all variants
    console.log('🤖 Running OCR on variants...');
    const ocrResults = [];
    
    for (const processedPath of processedImages) {
      try {
        const result = await Tesseract.recognize(processedPath, 'eng', {
          tessedit_char_whitelist: 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789',
          tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE
        });
        
        ocrResults.push(result.data.text);
        console.log(`✅ OCR result: ${result.data.text}`);
        
      } catch (err) {
        console.error('OCR error on variant:', err);
      }
    }
    
    // Step 3: Extract VIN from all OCR results
    console.log('🎯 Extracting VIN from results...');
    const extractedVIN = VINExtractor.smartExtract(ocrResults);
    
    if (!extractedVIN) {
      throw new Error('Could not extract valid VIN from image');
    }
    
    // Step 4: Validate
    const isValid = VINExtractor.isValidVIN(extractedVIN);
    
    console.log('✅ Final VIN:', extractedVIN);
    console.log('✅ Valid:', isValid);
    
    // Cleanup temp files
    await VINImagePreprocessor.cleanupFiles(filesToCleanup);
    
    return {
      vin: extractedVIN,
      isValid: isValid,
      confidence: isValid ? 100 : 70,
      rawOcrResults: ocrResults
    };
    
  } catch (error) {
    console.error('❌ VIN OCR Error:', error);
    
    // Cleanup temp files even on error
    await VINImagePreprocessor.cleanupFiles(filesToCleanup);
    
    throw error;
  }
}

/**
 * Test endpoint - extract VIN from text
 */
async function testVINExtraction(req, res) {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        message: 'Text required' 
      });
    }
    
    console.log('🧪 Testing VIN extraction from text:', text);
    
    const extractedVIN = VINExtractor.extractFromLabel(text);
    const isValid = VINExtractor.isValidVIN(extractedVIN);
    
    res.json({
      success: true,
      extractedVIN: extractedVIN,
      isValid: isValid,
      originalText: text
    });
  } catch (error) {
    console.error('Test extraction error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}

module.exports = {
  performVINOCR,
  testVINExtraction
};