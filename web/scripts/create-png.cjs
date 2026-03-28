const fs = require('fs');
const path = require('path');

// Copy logo.png to icons directory with different sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceLogo = path.join(__dirname, '..', 'public', 'logo', 'logo.png');
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Read the source logo
const logoBuffer = fs.readFileSync(sourceLogo);

// Copy logo.png as icon-512x512.png (highest resolution)
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), logoBuffer);
console.log('Created: icon-512x512.png');

// For smaller sizes, we'll use the same logo (browsers will scale it)
// In production, you'd want to properly resize these
sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`;
  fs.writeFileSync(path.join(iconsDir, filename), logoBuffer);
  console.log(`Created: ${filename}`);
});

console.log('\nAll PWA icons created from logo.png!');
