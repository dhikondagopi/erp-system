const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');
const authenticate = require('../middlewares/auth');
const audit = require('../middlewares/audit');

// Set up memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limit files to 10MB
  }
});

// Upload route with authentication
router.post(
  '/',
  authenticate,
  upload.single('file'),
  uploadController.uploadFile
);

module.exports = router;
