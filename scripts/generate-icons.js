import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import potrace from 'potrace';
import { promisify } from 'util';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const trace = promisify(potrace.trace);

// Configuration
const SOURCE_LOGO = path.join(__dirname, '../attached_assets/logo.png');
const ICONS_DIR = path.join(__dirname, '../client/public/icons');
const PUBLIC_DIR = path.join(__dirname, '../client/public');
const FAVICON_SIZES = [16, 32, 48, 64, 128, 192, 256];
const APPLE_TOUCH_ICON_SIZES = [57, 60, 72, 76, 114, 120, 144, 152, 180];
const ANDROID_ICON_SIZES = [192, 512];

// Ensure the icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Create SVG from PNG
async function convertPngToSvg(inputFile, outputFile, options = {}) {
  console.log(`Converting ${inputFile} to SVG ${outputFile}`);
  
  try {
    const potraceOptions = {
      ...options,
      threshold: options.threshold || 180,
      background: '#00000000', // transparent
      color: 'auto',
      optTolerance: 0.2,
      turdSize: 0  // Minimum size of shapes to ignore
    };
    
    const svg = await trace(inputFile, potraceOptions);
    fs.writeFileSync(outputFile, svg);
    console.log(`SVG created at ${outputFile}`);
  } catch (error) {
    console.error(`Error converting to SVG: ${error.message}`);
  }
}

// Generate favicon.ico
async function generateFaviconIco() {
  try {
    const sizes = [16, 32, 48];
    const faviconPath = path.join(PUBLIC_DIR, 'favicon.ico');
    
    console.log('Generating favicon.ico...');
    
    const buffers = await Promise.all(sizes.map(async (size) => {
      return await sharp(SOURCE_LOGO)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toFormat('png')
        .toBuffer();
    }));
    
    const ico = await sharp(buffers[0])
      .toFormat('ico')
      .toBuffer();
    
    fs.writeFileSync(faviconPath, ico);
    console.log(`Favicon created at ${faviconPath}`);
  } catch (error) {
    console.error(`Error generating favicon.ico: ${error.message}`);
  }
}

// Generate PNG icons of various sizes
async function generatePngIcons() {
  // Generate favicon PNGs
  for (const size of FAVICON_SIZES) {
    try {
      const outputPath = path.join(ICONS_DIR, `favicon-${size}x${size}.png`);
      await sharp(SOURCE_LOGO)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toFile(outputPath);
      console.log(`Generated ${outputPath}`);
    } catch (error) {
      console.error(`Error generating ${size}x${size} favicon: ${error.message}`);
    }
  }

  // Generate Apple touch icons
  for (const size of APPLE_TOUCH_ICON_SIZES) {
    try {
      const outputPath = path.join(ICONS_DIR, `apple-touch-icon-${size}x${size}.png`);
      await sharp(SOURCE_LOGO)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toFile(outputPath);
      console.log(`Generated ${outputPath}`);
    } catch (error) {
      console.error(`Error generating ${size}x${size} Apple touch icon: ${error.message}`);
    }
  }

  // Generate Android icons
  for (const size of ANDROID_ICON_SIZES) {
    try {
      const outputPath = path.join(ICONS_DIR, `android-chrome-${size}x${size}.png`);
      await sharp(SOURCE_LOGO)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toFile(outputPath);
      console.log(`Generated ${outputPath}`);
    } catch (error) {
      console.error(`Error generating ${size}x${size} Android icon: ${error.message}`);
    }
  }

  // Generate default Apple touch icon
  try {
    const outputPath = path.join(PUBLIC_DIR, 'apple-touch-icon.png');
    await sharp(SOURCE_LOGO)
      .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFile(outputPath);
    console.log(`Generated ${outputPath}`);
  } catch (error) {
    console.error(`Error generating default Apple touch icon: ${error.message}`);
  }
}

// Generate SVG icons
async function generateSvgIcons() {
  // Generate favicon SVG
  await convertPngToSvg(
    SOURCE_LOGO,
    path.join(ICONS_DIR, 'favicon.svg')
  );

  // Generate icon SVG
  await convertPngToSvg(
    SOURCE_LOGO,
    path.join(ICONS_DIR, 'icon.svg')
  );

  // Generate apple-touch-icon SVG
  await convertPngToSvg(
    SOURCE_LOGO,
    path.join(ICONS_DIR, 'apple-touch-icon.svg')
  );

  // Generate OG image SVG
  await convertPngToSvg(
    SOURCE_LOGO,
    path.join(ICONS_DIR, 'og-image.svg')
  );
}

// Create Web Manifest
function createWebManifest() {
  const manifest = {
    name: 'Kid Reads',
    short_name: 'KidReads',
    icons: [
      {
        src: '/icons/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icons/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ],
    theme_color: '#55A5C4',
    background_color: '#ffffff',
    display: 'standalone',
    start_url: '/'
  };

  fs.writeFileSync(
    path.join(PUBLIC_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('Web Manifest created');
}

// Run all the functions
async function main() {
  try {
    console.log('Starting icon generation...');
    
    // Copy the source logo to the public directory
    const publicLogoPath = path.join(PUBLIC_DIR, 'logo.png');
    fs.copyFileSync(SOURCE_LOGO, publicLogoPath);
    console.log(`Logo copied to ${publicLogoPath}`);
    
    await generatePngIcons();
    await generateFaviconIco();
    await generateSvgIcons();
    createWebManifest();
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

main();