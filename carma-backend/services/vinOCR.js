const Tesseract = require('tesseract.js');

// VIN validation regex (17 characters, no I, O, Q)
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

/**
 * Extract text from image using Tesseract OCR
 */
async function extractTextFromImage(imageUrl) {
  try {
    console.log('🔍 Starting Tesseract OCR on image:', imageUrl);

    const { data: { text, confidence } } = await Tesseract.recognize(
      imageUrl,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`📊 OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );

    console.log('📄 Extracted text:', text);
    console.log('📈 Confidence:', confidence);

    if (!text || text.trim().length === 0) {
      return { 
        success: false, 
        message: 'No text detected in image',
        confidence: 0
      };
    }

    return { 
      success: true, 
      text: text,
      confidence: confidence 
    };

  } catch (error) {
    console.error('❌ Tesseract OCR Error:', error);
    return { 
      success: false, 
      message: 'Failed to process image with OCR',
      error: error.message 
    };
  }
}

/**
 * Find valid VIN in extracted text
 */
function findVINInText(text) {
  // Remove whitespace, newlines, and common OCR mistakes
  let cleanText = text
    .replace(/\s+/g, '')
    .toUpperCase()
    .replace(/[IOQ]/g, (match) => {
      // Common OCR mistakes: I->1, O->0, Q->0
      if (match === 'I') return '1';
      if (match === 'O' || match === 'Q') return '0';
      return match;
    });
  
  console.log('🧹 Cleaned text for VIN search:', cleanText);
  
  // Look for 17-character sequences
  const matches = cleanText.match(/[A-HJ-NPR-Z0-9]{17}/g);
  
  if (!matches || matches.length === 0) {
    // Try with more flexible pattern (allows some special chars that might be OCR errors)
    const flexibleMatches = text.replace(/\s+/g, '').match(/.{17}/g);
    console.log('🔍 Flexible matches found:', flexibleMatches);
    
    if (flexibleMatches) {
      // Try to clean each match
      for (let match of flexibleMatches) {
        const cleaned = match
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .replace(/[IOQ]/g, (m) => m === 'I' ? '1' : '0');
        
        if (cleaned.length === 17 && VIN_REGEX.test(cleaned)) {
          console.log('✅ Found valid VIN after cleaning:', cleaned);
          return cleaned;
        }
      }
    }
    
    return null;
  }

  console.log('✅ VIN matches found:', matches);
  return matches[0];
}

/**
 * Validate VIN format
 */
function isValidVIN(vin) {
  if (!vin || typeof vin !== 'string') return false;
  
  // Check length and characters
  if (!VIN_REGEX.test(vin)) return false;
  
  // VINs cannot contain I, O, or Q (already handled in regex)
  return true;
}

/**
 * Calculate VIN similarity (for fuzzy matching)
 */
function calculateVINSimilarity(vin1, vin2) {
  if (!vin1 || !vin2) return 0;
  
  const v1 = vin1.toUpperCase().replace(/\s+/g, '');
  const v2 = vin2.toUpperCase().replace(/\s+/g, '');
  
  if (v1.length !== 17 || v2.length !== 17) return 0;
  
  let matches = 0;
  for (let i = 0; i < 17; i++) {
    if (v1[i] === v2[i]) matches++;
  }
  
  return (matches / 17) * 100;
}

/**
 * Main function: Extract and verify VIN from image
 */
async function verifyVINFromImage(imageUrl, expectedVIN) {
  try {
    console.log('🚗 Starting VIN verification with Tesseract...');
    console.log('📸 Image URL:', imageUrl);
    console.log('🎯 Expected VIN:', expectedVIN);

    // Step 1: Extract text from image
    const ocrResult = await extractTextFromImage(imageUrl);
    
    if (!ocrResult.success) {
      return {
        success: false,
        verified: false,
        message: ocrResult.message,
        recommendation: 'manual_review',
        reason: 'OCR failed to read image'
      };
    }

    // Step 2: Find VIN in extracted text
    const extractedVIN = findVINInText(ocrResult.text);
    
    if (!extractedVIN) {
      return {
        success: true,
        verified: false,
        message: 'No valid VIN found in image',
        extractedText: ocrResult.text,
        ocrConfidence: ocrResult.confidence,
        recommendation: 'manual_review',
        reason: 'No 17-character VIN pattern detected'
      };
    }

    console.log('✅ Extracted VIN:', extractedVIN);

    // Step 3: Validate VIN format
    if (!isValidVIN(extractedVIN)) {
      return {
        success: true,
        verified: false,
        extractedVIN: extractedVIN,
        message: 'Extracted VIN has invalid format',
        ocrConfidence: ocrResult.confidence,
        recommendation: 'manual_review',
        reason: 'VIN format validation failed'
      };
    }

   // Step 4: Compare with expected VIN and apply new thresholds
const cleanExpectedVIN = expectedVIN.replace(/\s+/g, '').toUpperCase();
const vinMatch = extractedVIN === cleanExpectedVIN;
const similarity = calculateVINSimilarity(extractedVIN, cleanExpectedVIN);

console.log('🔍 VIN Comparison:');
console.log('   Expected:', cleanExpectedVIN);
console.log('   Extracted:', extractedVIN);
console.log('   Similarity:', similarity.toFixed(2) + '%');

// 🆕 NEW THRESHOLDS: 70%+ approve, <70% reject
if (vinMatch) {
  // Perfect match - auto approve
  return {
    success: true,
    verified: true,
    extractedVIN: extractedVIN,
    expectedVIN: cleanExpectedVIN,
    similarity: similarity,
    ocrConfidence: ocrResult.confidence,
    message: '✅ VIN verified successfully! Perfect match.',
    recommendation: 'auto_approve',
    confidence: 'high'
  };
} else if (similarity >= 70) {
  // 70%+ similarity - auto approve (likely OCR minor errors)
  const differentChars = 17 - Math.round((similarity / 100) * 17);
  return {
    success: true,
    verified: true,
    extractedVIN: extractedVIN,
    expectedVIN: cleanExpectedVIN,
    similarity: similarity,
    ocrConfidence: ocrResult.confidence,
    message: `✅ VIN approved with ${similarity.toFixed(0)}% match (${differentChars} character${differentChars > 1 ? 's' : ''} different - likely OCR error)`,
    recommendation: 'auto_approve',
    confidence: similarity >= 90 ? 'high' : 'medium',
    reason: `Auto-approved: ${similarity.toFixed(1)}% similarity. Expected: ${cleanExpectedVIN}, Found: ${extractedVIN}`
  };
} else {
  // Less than 70% - reject
  const differentChars = 17 - Math.round((similarity / 100) * 17);
  return {
    success: true,
    verified: false,
    extractedVIN: extractedVIN,
    expectedVIN: cleanExpectedVIN,
    similarity: similarity,
    ocrConfidence: ocrResult.confidence,
    message: `❌ VIN rejected - only ${similarity.toFixed(0)}% match (${differentChars} characters different)`,
    recommendation: 'reject',
    reason: `Too many differences. Expected: ${cleanExpectedVIN}, Found: ${extractedVIN}. Please verify VIN number or upload clearer image.`
  };
}

  } catch (error) {
    console.error('❌ VIN Verification Error:', error);
    return {
      success: false,
      verified: false,
      message: 'System error during verification',
      error: error.message,
      recommendation: 'manual_review'
    };
  }
}

module.exports = {
  verifyVINFromImage,
  extractTextFromImage,
  findVINInText,
  isValidVIN
};