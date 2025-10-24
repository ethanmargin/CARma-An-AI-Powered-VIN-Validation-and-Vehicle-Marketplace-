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
    // Step 1: Download and preprocess image multiple ways (now 5 variants!)
    console.log('📸 Preprocessing image...');
    const processedImages = await VINImagePreprocessor.multiplePreprocessAttempts(imagePath);
    filesToCleanup.push(...processedImages);
    
    // Step 2: Run OCR on all variants
    console.log(`🤖 Running OCR on ${processedImages.length} variants...`);
    const ocrResults = [];
    
    for (let i = 0; i < processedImages.length; i++) {
      const processedPath = processedImages[i];
      try {
        // Use different OCR modes for different variants
        const ocrMode = i < 3 ? Tesseract.PSM.SINGLE_LINE : Tesseract.PSM.AUTO;
        
        const result = await Tesseract.recognize(processedPath, 'eng', {
          tessedit_char_whitelist: 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789',
          tessedit_pageseg_mode: ocrMode // AUTO mode for variants 4 & 5
        });
        
        ocrResults.push(result.data.text);
        console.log(`✅ OCR result (variant ${i + 1}): ${result.data.text.substring(0, 100)}...`);
        
      } catch (err) {
        console.error(`OCR error on variant ${i + 1}:`, err);
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