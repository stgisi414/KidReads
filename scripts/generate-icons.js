import favicons from 'favicons';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source image - using absolute paths
const source = path.join(path.dirname(__dirname), 'client/src/assets/logo.png');
const OUTPUT_DIR = path.join(path.dirname(__dirname), 'client/public/icons');

// Configuration
const configuration = {
  path: '/icons',  // Path for the icons files
  appName: 'KidReads',
  appShortName: 'KidReads',
  appDescription: 'An interactive read-along app for kids that provides engaging and adaptive storytelling',
  background: '#ffffff',
  theme_color: '#4f46e5',
  lang: 'en-US',
  start_url: '/',
  display: 'standalone',
  preferRelatedApplications: false,
  icons: {
    android: true,
    appleIcon: true,
    appleStartup: true,
    coast: false,
    favicons: true,
    firefox: false,
    windows: true,
    yandex: false
  }
};

console.log('Generating icons from:', source);

// Make sure the output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate icons
favicons(source, configuration)
  .then((response) => {
    // Save all generated files to the output directory
    console.log('Images:', response.images.length);
    console.log('Files:', response.files.length);
    console.log('HTML:', response.html.length);

    response.images.forEach(image => {
      fs.writeFileSync(
        path.join(OUTPUT_DIR, image.name),
        image.contents
      );
      console.log(`Generated: ${image.name}`);
    });

    response.files.forEach(file => {
      fs.writeFileSync(
        path.join(OUTPUT_DIR, file.name),
        file.contents
      );
      console.log(`Generated: ${file.name}`);
    });

    // Create an HTML reference file as a guide
    const htmlReference = response.html.join('\n');
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'reference.html'),
      htmlReference
    );

    console.log('Icon generation complete!');
  })
  .catch((error) => {
    console.error('Error generating favicons:', error);
  });