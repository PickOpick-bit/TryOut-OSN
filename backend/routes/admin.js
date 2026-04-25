// routes/admin.js
// Admin routes – all protected by adminAuth middleware

const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
  adminGetQuestions,
  adminGetQuestion,
  adminCreateQuestion,
  adminUpdateQuestion,
  adminDeleteQuestion,
  adminUploadImage,
  adminSeedQuestions,
} = require('../controllers/questionController');

// All routes below require admin key header: x-admin-key: <ADMIN_SECRET_KEY>
router.use(adminAuth);

// ── Question CRUD ──────────────────────────────
router.get('/questions',        adminGetQuestions);
router.get('/questions/:id',    adminGetQuestion);
router.post('/questions',       adminCreateQuestion);
router.put('/questions/:id',    adminUpdateQuestion);
router.delete('/questions/:id', adminDeleteQuestion);

// ── Image Upload ──────────────────────────────
// POST /api/admin/upload  (multipart/form-data, field name: "image")
router.post('/upload', upload.single('image'), adminUploadImage);

// ── Seed (one-time) ───────────────────────────
router.post('/seed', adminSeedQuestions);

module.exports = router;
