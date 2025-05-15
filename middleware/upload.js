// backend/middlewares/upload.js

import multer from 'multer';
import path from 'path';

// Configure storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // specify the directory for file storage
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // generating unique filename
  }
});

// Create multer instance with storage config
const upload = multer({ storage: storage });

// Export upload middleware
export default upload;
