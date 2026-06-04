import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../cloudinary.config.js';

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'BeautyStore/products',
    allowed_formats: ['jpg','jpeg','png','webp'],
    transformation: [{ quality: 'auto' }],
  },
});

const parser = multer({ storage });

router.post('/', parser.array('images', 10), (req, res) => {
  const urls = req.files.map(f => f.path || f.filename || f.url);
  res.json({ success: true, urls });
});

export default router;