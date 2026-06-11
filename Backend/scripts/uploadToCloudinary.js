import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cloudinary from "../cloudinary.config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const uploadFolders = [
  {
    name: "Redone_Images",
    localDirectory: path.join(__dirname, "../data/Redone_Images"),
    cloudinaryFolder: "BeautyStore/Redone_Images",
  },
  {
    name: "Gummy_Images",
    localDirectory: path.join(__dirname, "../data/Gummy_Images"),
    cloudinaryFolder: "BeautyStore/Gummy_Images",
  },
];

const uploadDirectory = async ({ name, localDirectory, cloudinaryFolder }) => {
  if (!fs.existsSync(localDirectory)) {
    throw new Error(`Directory not found: ${localDirectory}`);
  }

  const files = fs
    .readdirSync(localDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
  const imageMap = {};

  console.log(`\n${name}: found ${files.length} images. Uploading to ${cloudinaryFolder}...\n`);

  for (const file of files) {
    const filePath = path.join(localDirectory, file);

    try {
      console.log(`Uploading: ${file}...`);
      const result = await cloudinary.uploader.upload(filePath, {
        folder: cloudinaryFolder,
        resource_type: "auto",
      });

      imageMap[file] = result.secure_url;
      console.log(`Uploaded: ${file}`);
    } catch (error) {
      console.error(`Failed to upload ${file}:`, error.message || error);
    }
  }

  return imageMap;
};

const run = async () => {
  try {
    console.log("Checking Cloudinary credentials...");

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new Error("Missing Cloudinary credentials in .env file");
    }

    const imageMappings = {};

    for (const folder of uploadFolders) {
      imageMappings[folder.name] = await uploadDirectory(folder);
    }

    fs.writeFileSync(
      path.join(__dirname, "image-mapping.json"),
      JSON.stringify(imageMappings, null, 2)
    );

    console.log("\nAll images uploaded. Mapping saved to scripts/image-mapping.json");
  } catch (error) {
    console.error("\nUpload failed:", error.message || error);
    process.exit(1);
  }
};

run();
