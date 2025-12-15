// Generate placeholder PNG assets
const fs = require('fs');
const path = require('path');

// Simple PNG header for a 1x1 transparent pixel
// This is a minimal valid PNG that Expo can use as a placeholder
const minimalPNG = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
  0x49, 0x48, 0x44, 0x52, // IHDR
  0x00, 0x00, 0x00, 0x01, // width = 1
  0x00, 0x00, 0x00, 0x01, // height = 1
  0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, color type, etc.
  0x1F, 0x15, 0xC4, 0x89, // CRC
  0x00, 0x00, 0x00, 0x0A, // IDAT chunk length
  0x49, 0x44, 0x41, 0x54, // IDAT
  0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, // compressed data
  0x0D, 0x0A, 0x2D, 0xB4, // CRC
  0x00, 0x00, 0x00, 0x00, // IEND chunk length
  0x49, 0x45, 0x4E, 0x44, // IEND
  0xAE, 0x42, 0x60, 0x82  // CRC
]);

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create placeholder files
const assets = ['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png'];
assets.forEach(asset => {
  const filePath = path.join(assetsDir, asset);
  fs.writeFileSync(filePath, minimalPNG);
  console.log(`Created: ${asset}`);
});

console.log('\n✅ Placeholder assets created!');
console.log('⚠️  Replace these with actual images before building for production.');
console.log('   Required sizes:');
console.log('   - icon.png: 1024x1024');
console.log('   - splash.png: 1242x2436');
console.log('   - adaptive-icon.png: 1024x1024');
console.log('   - favicon.png: 48x48');

