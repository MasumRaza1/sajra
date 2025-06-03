import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconSizes = [640, 750, 1125, 1242, 1536];
const splashSizes = [1136, 1334, 2208, 2436, 2048];

// Ensure the icons directory exists
const iconsDir = join(__dirname, '../public/icons');
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

// Generate app icons
sizes.forEach(size => {
  sharp('src/assets/app-icon.png')
    .resize(size, size)
    .toFile(join(iconsDir, `icon-${size}x${size}.png`))
    .catch(err => console.error(`Error generating ${size}x${size} icon:`, err));
});

// Generate splash screens
iconSizes.forEach((width, index) => {
  const height = splashSizes[index];
  sharp('src/assets/splash-screen.png')
    .resize(width, height, {
      fit: 'cover',
      position: 'center'
    })
    .toFile(join(iconsDir, `splash-${width}x${height}.png`))
    .catch(err => console.error(`Error generating ${width}x${height} splash:`, err));
});

const outputDir = join(__dirname, '../public/icons');

async function generateIcons() {
  try {
    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Create base icon
    const baseIcon = await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 4,
        background: { r: 31, g: 41, b: 55, alpha: 1 }
      }
    })
    .composite([{
      input: Buffer.from(
        '<svg><text x="50%" y="50%" font-family="Arial" font-size="200" fill="white" text-anchor="middle" dominant-baseline="middle">K</text></svg>'
      ),
      top: 0,
      left: 0
    }])
    .png()
    .toBuffer();

    // Generate icons for each size
    for (const size of sizes) {
      await sharp(baseIcon)
        .resize(size, size)
        .toFile(join(outputDir, `icon-${size}x${size}.png`));
      
      console.log(`Generated ${size}x${size} icon`);
    }

    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons(); 