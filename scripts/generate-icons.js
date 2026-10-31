import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal pure-JS PNG generator (no external dependencies needed)
function createSolidPNG(width, height, r, g, b, a = 255) {
  // Color type 6 (RGBA), 8 bits per channel
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      // Create a futuristic arc-reactor radial pattern
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = width / 2;

      let pr = 3, pg = 7, pb = 18; // dark navy
      if (dist < radius * 0.95 && dist > radius * 0.90) {
        pr = 56; pg = 189; pb = 248; // outer cyan ring
      } else if (dist < radius * 0.75 && dist > radius * 0.70) {
        pr = 14; pg = 165; pb = 233; // mid blue ring
      } else if (dist < radius * 0.40) {
        // inner glowing core
        const intensity = 1 - dist / (radius * 0.40);
        pr = Math.min(255, Math.floor(180 + 75 * intensity));
        pg = Math.min(255, Math.floor(220 + 35 * intensity));
        pb = 255;
      } else if (dist < radius * 0.55 && dist > radius * 0.48) {
        pr = 2; pg = 132; pb = 199;
      }

      rawData[offset++] = pr;
      rawData[offset++] = pg;
      rawData[offset++] = pb;
      rawData[offset++] = 255;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  function createChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    // CRC calculation
    let c = 0xffffffff;
    for (let i = 4; i < 8 + len; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    buf.writeInt32BE((c ^ 0xffffffff) | 0, 8 + len);
    return buf;
  }

  // Precomputed CRC table
  const crcTable = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }

  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdr = createChunk('IHDR', ihdrData);
  const idat = createChunk('IDAT', deflated);
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdr, idat, iend]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write out compliant icons
const png192 = createSolidPNG(192, 192, 6, 182, 212);
const png512 = createSolidPNG(512, 512, 6, 182, 212);
const pngApple = createSolidPNG(180, 180, 6, 182, 212);

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), png192);

console.log('Successfully created PWA PNG icons in /public');
