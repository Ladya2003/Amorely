import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'heart-2.png');
const publicDir = join(root, 'client', 'public');
const paddedMaster = join(root, 'heart-icon-padded.png');

/** Heart occupies ~72% of canvas — matches reference padding from photo 2 */
const HEART_SCALE = 0.72;
const BACKGROUND = { r: 255, g: 255, b: 255, alpha: 1 };

async function buildIcon(size) {
  const inner = Math.round(size * HEART_SCALE);
  const heart = await sharp(src)
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([{ input: heart, gravity: 'center' }])
    .png();
}

const outputs = [
  [512, paddedMaster],
  [512, join(publicDir, 'logo512.png')],
  [192, join(publicDir, 'logo192.png')],
  [180, join(publicDir, 'apple-touch-icon.png')],
  [32, join(publicDir, 'favicon-32.png')],
  [16, join(publicDir, 'favicon-16.png')],
];

for (const [size, path] of outputs) {
  await (await buildIcon(size)).toFile(path);
  console.log(`✓ ${path} (${size}×${size})`);
}
