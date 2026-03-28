const fs = require('fs');
const path = require('path');

// Create a simple 144x144 transparent PNG with blue color (#2563eb - Fixora brand color)
// PNG signature
const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

// IHDR chunk - 144x144 24-bit RGB
const width = 144;
const height = 144;
const bitDepth = 8;
const colorType = 2; // RGB
const ihdrData = Buffer.concat([
  Buffer.from([width >> 24, width >> 16 & 0xFF, width >> 8 & 0xFF, width & 0xFF]),
  Buffer.from([height >> 24, height >> 16 & 0xFF, height >> 8 & 0xFF, height & 0xFF]),
  Buffer.from([bitDepth]),
  Buffer.from([colorType]),
  Buffer.from([0]), // compression
  Buffer.from([0]), // filter
  Buffer.from([0])  // interlace
]);

// Calculate CRC for IHDR
const ihdrType = Buffer.from('IHDR');
const ihdrCrc = require('zlib').crc32(Buffer.concat([ihdrType, ihdrData])) >>> 0;
const ihdr = Buffer.concat([
  Buffer.from([0, 0, 0, 13]), // length
  ihdrType,
  ihdrData,
  Buffer.from([(ihdrCrc >> 24) & 0xFF, (ihdrCrc >> 16) & 0xFF, (ihdrCrc >> 8) & 0xFF, ihdrCrc & 0xFF])
]);

// IDAT chunk - compressed image data
// Create simple blue square pixels (R=37, G=99, B=235)
const pixels = Buffer.alloc(width * height * 3 + height); // RGB + filter byte per row
for (let y = 0; y < height; y++) {
  pixels[y * (width * 3 + 1)] = 0; // filter byte
  for (let x = 0; x < width; x++) {
    const offset = y * (width * 3 + 1) + 1 + x * 3;
    pixels[offset] = 37;     // R
    pixels[offset + 1] = 99;  // G
    pixels[offset + 2] = 235; // B
  }
}

const compressed = require('zlib').deflateSync(pixels, { level: 9 });
const idatType = Buffer.from('IDAT');
const idatCrc = require('zlib').crc32(Buffer.concat([idatType, compressed])) >>> 0;
const idat = Buffer.concat([
  Buffer.from([(compressed.length >> 24) & 0xFF, (compressed.length >> 16) & 0xFF, (compressed.length >> 8) & 0xFF, compressed.length & 0xFF]),
  idatType,
  compressed,
  Buffer.from([(idatCrc >> 24) & 0xFF, (idatCrc >> 16) & 0xFF, (idatCrc >> 8) & 0xFF, idatCrc & 0xFF])
]);

// IEND chunk
const iend = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);

// Combine all chunks
const png = Buffer.concat([signature, ihdr, idat, iend]);

// Save
const outputPath = process.argv[2] || 'icon-144x144.png';
fs.writeFileSync(outputPath, png);
console.log('Created:', outputPath, 'Size:', png.length, 'bytes');
