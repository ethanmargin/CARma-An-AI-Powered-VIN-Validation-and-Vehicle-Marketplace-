const sharp = require('sharp');

class VINImagePreprocessor {
  /**
   * Preprocess VIN image for better OCR accuracy
   */
  static async preprocessForOCR(inputPath) {
    try {
      const outputPath = inputPath.replace(/(\.\w+)$/, '_processed$1');
      
      await sharp(inputPath)
        .grayscale()
        .normalize()
        .sharpen({
          sigma: 1.5,
          m1: 1.0,
          m2: 0.5
        })
        .threshold(128, {
          grayscale: true
        })
        .resize({
          width: 2000,
          fit: 'inside',
          withoutEnlargement: false
        })
        .toFile(outputPath);
      
      return outputPath;
    } catch (error) {
      console.error('Preprocessing error:', error);
      throw error;
    }
  }

  /**
   * Multiple preprocessing attempts for difficult images
   */
  static async multiplePreprocessAttempts(inputPath) {
    const variants = [];
    
    // Variant 1: Standard preprocessing
    variants.push(await this.preprocessForOCR(inputPath));
    
    // Variant 2: Higher contrast
    const highContrastPath = inputPath.replace(/(\.\w+)$/, '_highcontrast$1');
    await sharp(inputPath)
      .grayscale()
      .linear(1.5, -(128 * 1.5) + 128)
      .threshold(100)
      .toFile(highContrastPath);
    variants.push(highContrastPath);
    
    // Variant 3: Inverted (white text on black)
    const invertedPath = inputPath.replace(/(\.\w+)$/, '_inverted$1');
    await sharp(inputPath)
      .grayscale()
      .negate()
      .normalize()
      .toFile(invertedPath);
    variants.push(invertedPath);
    
    return variants;
  }
}

module.exports = VINImagePreprocessor;