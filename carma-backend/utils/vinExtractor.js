class VINExtractor {
  // Characters NOT allowed in VINs
  static EXCLUDED_CHARS = /[IOQ]/g;
  
  // Valid VIN characters only
  static VALID_VIN_CHARS = /[A-HJ-NPR-Z0-9]/g;
  
  /**
   * Clean and extract VIN from messy OCR text
   */
  static extractVIN(ocrText) {
    console.log('🔍 Original OCR text:', ocrText);
    
    // Step 1: Remove all whitespace and special characters
    let cleaned = ocrText.toUpperCase().replace(/[^A-Z0-9]/g, '');
    console.log('✅ After removing special chars:', cleaned);
    
    // Step 2: Remove invalid VIN characters (I, O, Q)
    cleaned = cleaned.replace(this.EXCLUDED_CHARS, '');
    console.log('✅ After removing I,O,Q:', cleaned);
    
    // Step 3: Try to find 17 consecutive valid characters
    const vinCandidates = this.findVINCandidates(cleaned);
    console.log('🎯 VIN Candidates found:', vinCandidates);
    
    // Step 4: Validate candidates
    for (const candidate of vinCandidates) {
      if (this.isValidVIN(candidate)) {
        console.log('✅ Valid VIN found:', candidate);
        return candidate;
      }
    }
    
    // Step 5: If no valid VIN, return best candidate
    return vinCandidates[0] || null;
  }
  
  /**
   * Find all possible 17-character sequences
   */
  static findVINCandidates(text) {
    const candidates = [];
    
    // Method 1: Find any 17 consecutive valid characters
    const matches = text.match(/[A-HJ-NPR-Z0-9]{17,}/g);
    if (matches) {
      matches.forEach(match => {
        if (match.length === 17) {
          candidates.push(match);
        } else if (match.length > 17) {
          // Try sliding window
          for (let i = 0; i <= match.length - 17; i++) {
            candidates.push(match.substr(i, 17));
          }
        }
      });
    }
    
    // Method 2: Look for patterns (most VINs start with digit)
    const patternMatches = text.match(/[1-5][A-HJ-NPR-Z0-9]{16}/g);
    if (patternMatches) {
      candidates.push(...patternMatches);
    }
    
    // Remove duplicates
    return [...new Set(candidates)];
  }
  
  /**
   * Validate VIN structure and check digit
   */
  static isValidVIN(vin) {
    // Must be exactly 17 characters
    if (vin.length !== 17) return false;
    
    // Must contain only valid characters
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return false;
    
    // Validate check digit (position 9)
    return this.validateCheckDigit(vin);
  }
  
  /**
   * Validate VIN check digit (position 9)
   */
  static validateCheckDigit(vin) {
    const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
    const transliteration = {
      'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
      'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
      'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9
    };
    
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      const char = vin[i];
      const value = /[0-9]/.test(char) ? parseInt(char) : transliteration[char];
      
      if (value === undefined) return false;
      
      sum += value * weights[i];
    }
    
    const remainder = sum % 11;
    const checkDigit = remainder === 10 ? 'X' : remainder.toString();
    
    return checkDigit === vin[8];
  }
  
  /**
   * Smart extraction - tries multiple strategies
   */
  static smartExtract(ocrTexts) {
    if (!Array.isArray(ocrTexts)) {
      ocrTexts = [ocrTexts];
    }
    
    const allCandidates = [];
    
    for (const text of ocrTexts) {
      const vin = this.extractVIN(text);
      if (vin) {
        allCandidates.push({
          vin: vin,
          confidence: this.isValidVIN(vin) ? 100 : 50,
          source: text
        });
      }
    }
    
    // Sort by confidence
    allCandidates.sort((a, b) => b.confidence - a.confidence);
    
    return allCandidates.length > 0 ? allCandidates[0].vin : null;
  }
  
  /**
   * Extract VIN from image label text
   */
  static extractFromLabel(labelText) {
    console.log('📋 Processing label text:', labelText);
    
    // Remove common label words
    const cleaned = labelText
      .replace(/V\.?I\.?N\.?/gi, '')
      .replace(/VIN/gi, '')
      .replace(/VEHICLE\s+IDENTIFICATION\s+NUMBER/gi, '')
      .replace(/BARCODE/gi, '')
      .replace(/MANUFACTURED/gi, '')
      .replace(/PASSENGER\s+CAR/gi, '');
    
    return this.extractVIN(cleaned);
  }
}

module.exports = VINExtractor;