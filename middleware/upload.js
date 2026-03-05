const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Faqat rasmlar yuklash mumkin!'));
};

// Hajm cheklovini 10MB ga oshirish
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter
});

const resizeImage = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const filePath = req.file.path;
    const resizedPath = filePath.replace(/(\.[\w\d_-]+)$/i, '-resized$1');
    await sharp(filePath)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .toFile(resizedPath);
    fs.unlinkSync(filePath);
    fs.renameSync(resizedPath, filePath);
    next();
  } catch (err) {
    console.error('Rasmni resize qilishda xatolik:', err);
    next(err);
  }
};

module.exports = { upload, resizeImage };