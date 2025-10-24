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
    
    // Valid first characters for VINs:
    // 1-5: USA
    // J: Japan
    // K: Korea
    // L: China
    // S: UK
    // V: France/Spain
    // W: Germany
    // Z: Italy
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
      'APPLICABLE', 'EFFECT', 'SHOWN', 'ABOVE', 'DATE'
    ];
    
    const upperStr = str.toUpperCase();
    return labelWords.some(word => upperStr.includes(word));
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
    
    // +100 points if near VIN keywords (VERY IMPORTANT!)
    const vinKeywords = ['V.I.N.', 'V.I.N', 'VIN:', 'VIN ', 'V I N', 'VIN', '++', '+n', '+ +', '+ n'];
    const upperText = originalText.toUpperCase();
    const cleanedText = originalText.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    
    // Check if VIN appears near keywords in original text
    for (const keyword of vinKeywords) {
      const keywordIndex = upperText.indexOf(keyword);
      if (keywordIndex !== -1) {
        // Find VIN position in original text (with some tolerance for spaces/special chars)
        const vinPattern = vin.split('').join('[^A-Z0-9]{0,3}'); // Allow 0-3 special chars between each character
        const vinRegex = new RegExp(vinPattern, 'i');
        const match = upperText.match(vinRegex);
        
        if (match) {
          const vinIndex = match.index;
          const distance = Math.abs(vinIndex - keywordIndex);
          
          if (distance < 20) { // Within 20 characters
            score += 100;
            console.log(`   🎯 Found VIN near keyword "${keyword}" (distance: ${distance})`);
            break; // Only count once
          }
        }
      }
    }
    
    // +30 points if VIN appears with common prefix patterns
    const vinPrefixes = ['++', '+n', '+ +', '+ n', 'VIN', 'V.I.N'];
    for (const prefix of vinPrefixes) {
      const pattern = prefix.replace(/[^A-Z0-9]/gi, '').toUpperCase() + vin;
      if (cleanedText.includes(pattern)) {
        score += 30;
        console.log(`   ✓ VIN found with prefix "${prefix}"`);
        break;
      }
    }
    
    // +20 points if alphanumeric mix (real VINs have both)
    const hasLetters = /[A-Z]/.test(vin);
    const hasNumbers = /[0-9]/.test(vin);
    if (hasLetters && hasNumbers) {
      score += 20;
    }
    
    // -50 points if contains "GAWR" or "GVWR" (weight ratings, not VINs)
    if (vin.includes('GAWR') || vin.includes('GVWR')) {
      score -= 50;
      console.log(`   ⚠️ Contains weight rating text (GAWR/GVWR)`);
    }
    
    return score;
  }

  /**
   * Extract VIN from typical label format
   */
  static extractFromLabel(text) {
    console.log('🔍 Original OCR text:', text);
    
    // Remove special characters but keep alphanumeric
    let cleaned = text.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    console.log('✅ After removing special chars:', cleaned);
    
    // Remove invalid VIN characters (I, O, Q)
    cleaned = cleaned.replace(/[IOQ]/g, '');
    console.log('✅ After removing I,O,Q:', cleaned);
    
    // Find all 17-character sequences
    const candidates = [];
    for (let i = 0; i <= cleaned.length - 17; i++) {
      const candidate = cleaned.substring(i, i + 17);
      candidates.push(candidate);
    }
    
    console.log('🎯 VIN Candidates found:', candidates);
    
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