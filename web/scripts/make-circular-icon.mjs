import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const SIZE = 512;

// SVG circle mask — white circle on transparent background
const circleMask = Buffer.from(
  `<svg width="${SIZE}" height="${SIZE}"><circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2}" fill="white"/></svg>`
);

async function run() {
  // 1. Resize + composite the circle mask → produces circular icon
  const circular = await sharp(path.join(root, "public/images/logo.png"))
    .resize(SIZE, SIZE, { fit: "cover", position: "centre" })
    .composite([{ input: circleMask, blend: "dest-in" }])
    .png()
    .toBuffer();

  // 2. Write multiple sizes
  const targets = [
    { file: "public/favicon-circle.png", size: 512 },
    { file: "public/favicon-64.png",     size: 64  },
  ];

  for (const { file, size } of targets) {
    await sharp(circular)
      .resize(size, size)
      .png()
      .toFile(path.join(root, file));
    console.log(`✓  Written ${file} (${size}×${size})`);
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
