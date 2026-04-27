// config/cloudinary.js - ImageKit upload handler
const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

// Inisialisasi ImageKit LAZY - dipanggil saat dibutuhkan, bukan saat module diload
function getImageKit() {
  const ImageKit = require('imagekit');
  return new ImageKit({
    publicKey:   process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey:  process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
}

module.exports = { upload, getImageKit };