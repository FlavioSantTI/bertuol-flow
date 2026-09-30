import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

function createIcon(size, isMaskable = false) {
  const png = new PNG({ width: size, height: size });
  const center = size / 2;
  const radius = size * 0.42;

  // Amber Brand Colors: #FFB347 -> #FF981A
  const r1 = 255, g1 = 179, b1 = 71;
  const r2 = 255, g2 = 152, b2 = 26;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const t = (x + y) / (size * 2);

      // Gradient background
      let r = Math.round(r1 + (r2 - r1) * t);
      let g = Math.round(g1 + (g2 - g1) * t);
      let b = Math.round(b1 + (b2 - b1) * t);
      let a = 255;

      if (!isMaskable) {
        // Squircle corner smoothing for standard icon
        const cornerR = size * 0.22;
        let isInside = true;
        if (x < cornerR && y < cornerR) {
          isInside = Math.hypot(x - cornerR, y - cornerR) <= cornerR;
        } else if (x > size - cornerR && y < cornerR) {
          isInside = Math.hypot(x - (size - cornerR), y - cornerR) <= cornerR;
        } else if (x < cornerR && y > size - cornerR) {
          isInside = Math.hypot(x - cornerR, y - (size - cornerR)) <= cornerR;
        } else if (x > size - cornerR && y > size - cornerR) {
          isInside = Math.hypot(x - (size - cornerR), y - (size - cornerR)) <= cornerR;
        }
        if (!isInside) {
          a = 0;
        }
      }

      // Draw white tooth / emblem in the center (Safe Zone)
      const dx = (x - center) / (size * 0.25);
      const dy = (y - center * 1.05) / (size * 0.28);
      const dist = Math.hypot(dx, dy);

      // Central tooth outline & fill
      if (a > 0) {
        // Tooth crown and roots shape approximation
        const isTooth = (Math.abs(dx) <= 0.85 && dy >= -0.8 && dy <= 0.75) &&
          !(dy > 0.3 && Math.abs(dx) < 0.25 && dy > 0.4);

        if (isTooth) {
          // White tooth body
          r = 255;
          g = 255;
          b = 255;

          // Cross motif inside tooth
          const isCrossH = Math.abs(dy - (-0.1)) < 0.12 && Math.abs(dx) < 0.45;
          const isCrossV = Math.abs(dx) < 0.12 && dy >= -0.45 && dy <= 0.25;
          if (isCrossH || isCrossV) {
            r = 255;
            g = 152;
            b = 26;
          }
        }
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }

  return PNG.sync.write(png);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createIcon(192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createIcon(512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createIcon(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createIcon(180));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createIcon(48));

console.log('PWA PNG icons generated successfully!');
