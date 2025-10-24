const sharp = require('sharp');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class VINImagePreprocessor {
  /**
   * Download image from URL to temp file
   */
  static async downloadImage(imageUrl) {
    try {
      console.log('📥 Downloading image from URL:', imageUrl);
      
      const response = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'arraybuffer'
      });
      
      // Create temp file
      const tempDir = os.tmpdir();
      const tempFileName = `vin-${Date.now()}.jpg`;
      const tempFilePath = path.join(tempDir, tempFileName);
      
      await fs.writeFile(tempFilePath, response.data);
      
      console.log('✅ Image downloaded to:', tempFilePath);
      return tempFilePath;
      
    } catch (error) {
      console.error('❌ Download error:', error);
      throw new Error(`Failed to download image: ${error.message}`);
    }
  }

  /**
   * Preprocess VIN image for better OCR accuracy
   */
  static async preprocessForOCR(inputPath) {
    try {
      // Check if inputPath is URL
      let localPath = inputPath;
      let isDownloaded = false;
      
      if (inputPath.startsWith('http://') || inputPath.startsWith('https://')) {
        localPath = await this.downloadImage(inputPath);
        isDownloaded = true;
      }
      
      const outputPath = localPath.replace(/(\.\w+)$/, '_processed$1');
      
      await sharp(localPath)
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
   * Multiple preprocessing attempts for difficult images (5 variants for different label types)
   */
  static async multiplePreprocessAttempts(inputPath) {
    const variants = [];
    
    try {
      // Check if inputPath is URL and download once
      let localPath = inputPath;
      let isDownloaded = false;
      
      if (inputPath.startsWith('http://') || inputPath.startsWith('https://')) {
        localPath = await this.downloadImage(inputPath);
        isDownloaded = true;
      }
      
      // Get image metadata first
      const metadata = await sharp(localPath).metadata();
      console.log(`📏 Image size: ${metadata.width}x${metadata.height}`);
      
      // Variant 1: Standard preprocessing (works for most Honda/Toyota labels)
      const processed1 = localPath.replace(/(\.\w+)$/, '_processed1$1');
      await sharp(localPath)
        .grayscale()
        .normalize()
        .sharpen()
        .threshold(128)
        .toFile(processed1);
      variants.push(processed1);
      
      // Variant 2: Higher contrast (for faded labels)
      const processed2 = localPath.replace(/(\.\w+)$/, '_processed2$1');
      await sharp(localPath)
        .grayscale()
        .linear(1.5, -(128 * 1.5) + 128)
        .threshold(100)
        .toFile(processed2);
      variants.push(processed2);
      
      // Variant 3: Inverted (white text on black background)
      const processed3 = localPath.replace(/(\.\w+)$/, '_processed3$1');
      await sharp(localPath)
        .grayscale()
        .negate()
        .normalize()
        .toFile(processed3);
      variants.push(processed3);
      
      // 🆕 NEW: Variant 4: Increased resolution + sharpen (for small text like Porsche labels)
      const processed4 = localPath.replace(/(\.\w+)$/, '_processed4$1');
      await sharp(localPath)
        .resize({
          width: Math.min(metadata.width * 2, 4000), // Double size, max 4000px
          fit: 'inside',
          kernel: sharp.kernel.lanczos3
        })
        .grayscale()
        .sharpen({ sigma: 2 })
        .normalize()
        .threshold(130)
        .toFile(processed4);
      variants.push(processed4);
      
      // 🆕 NEW: Variant 5: Very high contrast (for luxury car labels - Porsche, BMW, Mercedes)
      const processed5 = localPath.replace(/(\.\w+)$/, '_processed5$1');
      await sharp(localPath)
        .grayscale()
        .linear(2.0, -(128 * 2.0) + 128) // Very aggressive contrast
        .sharpen({ sigma: 1.5 })
        .threshold(90)
        .toFile(processed5);
      variants.push(processed5);
      
      console.log(`✅ Created ${variants.length} preprocessing variants`);
      
      return variants;
      
    } catch (error) {
      console.error('Multiple preprocessing error:', error);
      throw error;
    }
  }
  
  /**
   * Cleanup temp files
   */
  static async cleanupFiles(filePaths) {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }
}

module.exports = VINImagePreprocessor;