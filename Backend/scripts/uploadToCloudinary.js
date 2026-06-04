import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cloudinary from '../cloudinary.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bladeImagesDir = path.join(__dirname, '../data/Blade_Images');

const run = async () => {
  try {
    // Check credentials first
    console.log('Checking Cloudinary credentials...');
    console.log('  CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✓' : '✗ MISSING');
    console.log('  CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✓' : '✗ MISSING');
    console.log('  CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✓' : '✗ MISSING');

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Missing Cloudinary credentials in .env file');
    }

    // Check if directory exists
    console.log('\nChecking Blade_Images directory:', bladeImagesDir);
    if (!fs.existsSync(bladeImagesDir)) {
      throw new Error(`Directory not found: ${bladeImagesDir}`);
    }

    const files = fs.readdirSync(bladeImagesDir);
    const imageMap = {};
    
    console.log(`\nFound ${files.length} images. Uploading...\n`);
    
    for (const file of files) {
      const filePath = path.join(bladeImagesDir, file);
      
      try {
        console.log(`Uploading: ${file}...`);
        const res = await cloudinary.uploader.upload(filePath, {
          folder: 'BeautyStore/Blade_Images',
          resource_type: 'auto',
        });
        
        imageMap[file] = res.secure_url;
        console.log(`✓ ${file} → ${res.secure_url}`);
      } catch (fileError) {
        console.error(`✗ Failed to upload ${file}:`, fileError.message || fileError);
        // Continue with next file instead of stopping
      }
    }
    
    fs.writeFileSync(
      path.join(__dirname, 'image-mapping.json'),
      JSON.stringify(imageMap, null, 2)
    );
    
    console.log('\n✓ All images uploaded! Mapping saved to image-mapping.json');
    
  } catch (error) {
    console.error('\n✗ Upload failed:');
    console.error('  Message:', error.message);
    console.error('  Full error:', error);
    if (error.stack) {
      console.error('  Stack:', error.stack);
    }
    process.exit(1);
  }
};

run();