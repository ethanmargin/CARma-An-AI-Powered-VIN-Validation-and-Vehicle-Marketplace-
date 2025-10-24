class VINExtractor {
  /**
   * Check if VIN has valid check digit (position 9)
   */
  static isValidVIN(vin) {
    if (!vin || vin.length !== 17) return false;
    
    const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
    const transliteration = {
      'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
      'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
      'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9
    };
    
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      const char = vin[i];
      let value;
      
      if (char >= '0' && char <= '9') {
        value = parseInt(char);
      } else {
        value = transliteration[char];
        if (value === undefined) return false;
      }
      
      sum += value * weights[i];
    }
    
    const checkDigit = sum % 11;
    const ninthChar = vin[8];
    
    if (checkDigit === 10) {
      return ninthChar === 'X';
    } else {
      return ninthChar === checkDigit.toString();
    }
  }

  /**
   * Check if VIN starts with valid manufacturer code
   */
  static hasValidManufacturerCode(vin) {
    if (!vin || vin.length < 1) return false;
    
    const firstChar = vin[0];
    const validFirstChars = ['1', '2', '3', '4', '5', 'J', 'K', 'L', 'S', 'V', 'W', 'Z'];
    
    return validFirstChars.includes(firstChar);
  }

  /**
   * Check if string contains common label words (not a VIN)
   */
  static containsLabelWords(str) {
    const labelWords = [
      'BUMPER', 'SAFETY', 'MOTOR', 'VEHICLE', 'THEFT', 'PREVENTION',
      'FEDERAL', 'STANDARD', 'MANUFACTURE', 'PASSENGER', 'CONFORM',
      'APPLICABLE', 'EFFECT', 'SHOWN', 'ABOVE', 'DATE', 'FRONT', 'REAR'
    ];
    
    const upperStr = str.toUpperCase();
    return labelWords.some(word => upperStr.includes(word));
  }

  /**
   * 🆕 NEW: Check if VIN looks like a real VIN pattern
   */
  static hasRealVINPattern(vin) {
    // Real VINs have specific patterns
    // Must have at least 2 letters and 5 numbers
    const letterCount = (vin.match(/[A-Z]/g) || []).length;
    const numberCount = (vin.match(/[0-9]/g) || []).length;
    
    if (letterCount < 2 || numberCount < 5) return false;
    
    // Must NOT be all sequential numbers (like 23855258)
    const hasOnlySequentialDigits = /^\d+$/.test(vin);
    if (hasOnlySequentialDigits) return false;
    
    // Real VINs usually have letters in first 3 positions
    const firstThree = vin.substring(0, 3);
    const hasLettersInFirst3 = /[A-Z]/.test(firstThree);
    
    return hasLettersInFirst3;
  }

  /**
   * 🆕 NEW: Check if VIN is near "MADE IN" keywords
   */
  static isNearMadeIn(vin, originalText) {
    const keywords = ['MADE IN', 'MADE', 'GERMANY', 'JAPAN', 'USA', 'CANADA', 'KOREA', 'CHINA'];
    const upperText = originalText.toUpperCase();
    
    // Find VIN position in text
    const vinIndex = upperText.indexOf(vin);
    if (vinIndex === -1) return false;
    
    // Check if any keyword is within 50 characters
    for (const keyword of keywords) {
      const keywordIndex = upperText.indexOf(keyword);
      if (keywordIndex !== -1) {
        const distance = Math.abs(vinIndex - keywordIndex);
        if (distance < 50) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Calculate score for VIN candidate (higher = better)
   */
  static scoreVINCandidate(vin, originalText) {
    let score = 0;
    
    // +100 points if valid check digit
    if (this.isValidVIN(vin)) {
      score += 100;
    }
    
    // +50 points if has valid manufacturer code
    if (this.hasValidManufacturerCode(vin)) {
      score += 50;
    }
    
    // -100 points if contains label words
    if (this.containsLabelWords(vin)) {
      score -= 100;
    }
    
    // 🆕 NEW: +100 points if has real VIN pattern
    if (this.hasRealVINPattern(vin)) {
      score += 100;
      console.log(`   ✓ Has real VIN pattern`);
    }
    
    // 🆕 NEW: +150 points if near "MADE IN" keywords (VERY STRONG!)
    if (this.isNearMadeIn(vin, originalText)) {
      score += 150;
      console.log(`   🎯 Found VIN near MADE IN keyword!`);
    }
    
    // 🆕 UPDATED: +100 points if near VIN keywords (BUT NOT ++ for VINs with GAWR/GVWR!)
const vinKeywords = vin.includes('GAWR') || vin.includes('GVWR') 
  ? ['V.I.N.', 'V.I.N', 'VIN:', 'VIN ', 'V I N', 'VIN'] // No ++ for weight ratings
  : ['V.I.N.', 'V.I.N', 'VIN:', 'VIN ', 'V I N', 'VIN', '++', '+n', '+ +', '+ n']; // Include ++ for real VINs
    const upperText = originalText.toUpperCase();
    const cleanedText = originalText.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    
    for (const keyword of vinKeywords) {
      const keywordIndex = upperText.indexOf(keyword);
      if (keywordIndex !== -1) {
        const vinPattern = vin.split('').join('[^A-Z0-9]{0,3}');
        const vinRegex = new RegExp(vinPattern, 'i');
        const match = upperText.match(vinRegex);
        
        if (match) {
          const vinIndex = match.index;
          const distance = Math.abs(vinIndex - keywordIndex);
          
          if (distance < 20) {
            score += 100;
            console.log(`   🎯 Found VIN near keyword "${keyword}" (distance: ${distance})`);
            break;
          }
        }
      }
    }
    
    // 🆕 UPDATED: +30 points if VIN appears with common prefix patterns (BUT NOT if it contains GAWR/GVWR!)
if (!vin.includes('GAWR') && !vin.includes('GVWR')) {
  const vinPrefixes = ['++', '+n', '+ +', '+ n', 'VIN', 'V.I.N'];
  for (const prefix of vinPrefixes) {
    const pattern = prefix.replace(/[^A-Z0-9]/gi, '').toUpperCase() + vin;
    if (cleanedText.includes(pattern)) {
      score += 30;
      console.log(`   ✓ VIN found with prefix "${prefix}"`);
      break;
    }
  }
}
    
    // +20 points if alphanumeric mix
    const hasLetters = /[A-Z]/.test(vin);
    const hasNumbers = /[0-9]/.test(vin);
    if (hasLetters && hasNumbers) {
      score += 20;
    }
    
    // 🆕 UPDATED: -300 points if contains "GAWR" or "GVWR" (VERY STRONG penalty!)
    if (vin.includes('GAWR') || vin.includes('GVWR')) {
      score -= 300;
      console.log(`   ❌ STRONG PENALTY: Contains weight rating text (GAWR/GVWR)`);
    }
    
    // 🆕 UPDATED: Check for weight-specific patterns instead of just number ratio
// Weight data has specific patterns like "1765LBS" or "GVWR2385"
const hasWeightPattern = /\d{3,4}LBS/i.test(vin) || /GVWR\d+/i.test(vin) || /GAWR\d+/i.test(vin);
if (hasWeightPattern) {
  score -= 200;
  console.log(`   ⚠️ Contains weight pattern (LBS/GVWR/GAWR with numbers)`);
}
    
    return score;
  }

  /**
   * Extract VIN from typical label format
   */
  static extractFromLabel(text) {
    console.log('🔍 Original OCR text:', text.substring(0, 200) + '...');
    
    // Remove special characters but keep alphanumeric
    let cleaned = text.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    console.log('✅ After removing special chars:', cleaned.substring(0, 100) + '...');
    
    // Remove invalid VIN characters (I, O, Q)
    cleaned = cleaned.replace(/[IOQ]/g, '');
    console.log('✅ After removing I,O,Q:', cleaned.substring(0, 100) + '...');
    
    // Find all 17-character sequences
    const candidates = [];
    for (let i = 0; i <= cleaned.length - 17; i++) {
      const candidate = cleaned.substring(i, i + 17);
      candidates.push(candidate);
    }
    
    console.log(`🎯 Found ${candidates.length} total VIN candidates`);
    
    // Score all candidates and pick the best one
    let bestCandidate = null;
    let bestScore = -Infinity;
    
    for (const candidate of candidates) {
      const score = this.scoreVINCandidate(candidate, text);
      
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
      
      // Log top candidates for debugging
      if (score > 50) {
        console.log(`   Candidate: ${candidate}, Score: ${score}`);
      }
    }
    
    if (bestCandidate && bestScore > 0) {
      console.log(`✅ Best VIN candidate: ${bestCandidate} (score: ${bestScore})`);
      return bestCandidate;
    }
    
    console.log('❌ No valid VIN found');
    return null;
  }

  /**
   * Smart extraction from multiple OCR results
   */
  static smartExtract(ocrResults) {
    if (!Array.isArray(ocrResults) || ocrResults.length === 0) {
      return null;
    }
    
    // Try each OCR result and pick the best VIN
    let bestVIN = null;
    let bestScore = -Infinity;
    
    for (const result of ocrResults) {
      const vin = this.extractFromLabel(result);
      
      if (vin) {
        const score = this.scoreVINCandidate(vin, result);
        
        if (score > bestScore) {
          bestScore = score;
          bestVIN = vin;
        }
      }
    }
    
    return bestVIN;
  }
}

module.exports = VINExtractor;