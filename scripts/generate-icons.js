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

// Create SVG that embeds the PNG directly - preserving all colors
async function convertPngToSvg(inputFile, outputFile, options = {}) {
  console.log(`Creating color-preserving SVG wrapper for ${inputFile} at ${outputFile}`);
  
  try {
    // Get dimensions of the image
    const metadata = await sharp(inputFile).metadata();
    const { width, height } = metadata;
    
    // Convert PNG to base64 for embedding
    const imageBuffer = fs.readFileSync(inputFile);
    const base64Image = imageBuffer.toString('base64');
    
    // Create SVG with embedded PNG image (preserves all colors exactly)
    const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image width="${width}" height="${height}" xlink:href="data:image/png;base64,${base64Image}"/>
</svg>`;
    
    fs.writeFileSync(outputFile, svgContent);
    console.log(`Color-preserving SVG created at ${outputFile}`);
  } catch (error) {
    console.error(`Error creating color SVG: ${error.message}`);
  }
}

// Generate favicon.ico - not using sharp since it doesn't support .ico output directly
async function generateFaviconIco() {
  try {
    // Instead of trying to create an .ico file, we'll use the PNG files
    // Modern browsers support PNG favicons, so we'll rely on those
    // The HTML already references both SVG and PNG favicons
    console.log('Note: Skipping favicon.ico generation as modern browsers support PNG/SVG favicons');
    console.log('favicon.ico generation is not supported directly by Sharp');
  } catch (error) {
    console.error(`Error with favicon handling: ${error.message}`);
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

// Clean up any existing icons
function cleanupOldIcons() {
  console.log('Cleaning up old icons...');
  
  // Clean up icons directory
  if (fs.existsSync(ICONS_DIR)) {
    const files = fs.readdirSync(ICONS_DIR);
    let cleaned = 0;
    
    for (const file of files) {
      try {
        const filePath = path.join(ICONS_DIR, file);
        if (fs.lstatSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      } catch (error) {
        console.error(`Error deleting file: ${error.message}`);
      }
    }
    
    console.log(`Cleaned up ${cleaned} old icon files`);
  }
  
  // Clean up root icon files
  const rootIconFiles = [
    'favicon.ico',
    'apple-touch-icon.png',
    'apple-touch-icon-precomposed.png',
    'logo.png'
  ];
  
  for (const file of rootIconFiles) {
    const filePath = path.join(PUBLIC_DIR, file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Removed ${filePath}`);
      } catch (error) {
        console.error(`Error deleting ${filePath}: ${error.message}`);
      }
    }
  }
}

// Run all the functions
async function main() {
  try {
    console.log('Starting icon generation...');
    
    // Clean up old icons first
    cleanupOldIcons();
    
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