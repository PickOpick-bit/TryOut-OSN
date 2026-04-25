// routes/questions.js
// Public-facing routes (no auth required)

const express = require('express');
const router = express.Router();
const {
  getQuestions,
  getTopics,
  submitExam,
} = require('../controllers/questionController');

// GET /api/questions          → randomized question set (no answers)
// GET /api/questions?limit=20 → limit question count
// GET /api/questions?topic=XX → filter by topic
router.get('/', getQuestions);

// GET /api/questions/topics → distinct topic list
router.get('/topics', getTopics);

// POST /api/submit → grade exam submission
router.post('/submit', submitExam);

module.exports = router;
