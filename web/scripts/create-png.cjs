const fs = require('fs');
const path = require('path');

// Copy logo.png to icons directory as is
const sourceLogo = path.join(__dirname, '..', 'public', 'logo', 'logo.png');
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Copy logo.png as is - iOS will handle scaling
fs.copyFileSync(sourceLogo, path.join(iconsDir, 'icon-192x192.png'));
fs.copyFileSync(sourceLogo, path.join(iconsDir, 'icon-152x152.png'));
fs.copyFileSync(sourceLogo, path.join(iconsDir, 'icon-180x180.png'));
fs.copyFileSync(sourceLogo, path.join(iconsDir, 'icon-512x512.png'));

console.log('iOS PWA icons updated from logo.png!');
console.log('Note: iOS PWA requires users to tap Share → Add to Home Screen');
