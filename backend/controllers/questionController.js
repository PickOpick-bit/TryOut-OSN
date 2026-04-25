// controllers/questionController.js
// All business logic separated from routing

const Question = require('../models/Question');
const { cloudinary } = require('../config/cloudinary');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Fisher-Yates shuffle – in-place, returns same array
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Determine if a numeric answer is correct.
 * If question defines tolerance > 0: use absolute tolerance.
 * Otherwise: 6% relative + 0.05 absolute (matches original system).
 */
function isAnswerCorrect(userAnswer, correctAnswer, tolerance) {
  const diff = Math.abs(userAnswer - correctAnswer);
  if (tolerance > 0) return diff <= tolerance;
  // Default: 6% of correct answer + 0.05 absolute buffer
  return diff < 0.06 * Math.abs(correctAnswer) + 0.05;
}

// ─── Public Controllers ───────────────────────────────────────────────────────

/**
 * GET /api/questions
 * Returns up to 40 randomized active questions (no answers/explanations)
 */
exports.getQuestions = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 40, 100);
    const topic = req.query.topic; // optional filter

    const filter = { isActive: true };
    if (topic) filter.topic = { $regex: topic, $options: 'i' };

    // Fetch all matching, then randomize in JS (works on free Atlas tier)
    const all = await Question.find(filter).select(
      '_id text unit topic image difficulty'
      // NOTE: answer, tolerance, explanation intentionally excluded from public endpoint
    );

    const questions = shuffle(all).slice(0, limit);

    res.json({
      success: true,
      count: questions.length,
      data: questions,
    });
  } catch (err) {
    console.error('getQuestions error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/questions/topics
 * Returns list of distinct topics (for filter UI)
 */
exports.getTopics = async (req, res) => {
  try {
    const topics = await Question.distinct('topic', { isActive: true });
    res.json({ success: true, data: topics.sort() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/submit
 * Body: { answers: [ { questionId, value } ] }
 * Returns: { score, correct, wrong, empty, results: [...] }
 */
exports.submitExam = async (req, res) => {
  try {
    const { answers } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'answers array is required',
      });
    }

    // Fetch all submitted question IDs with private fields
    const ids = answers.map((a) => a.questionId);
    const questions = await Question.find({ _id: { $in: ids } }).select(
      '_id answer tolerance unit topic text explanation'
    );

    // Index by ID for O(1) lookup
    const qMap = {};
    questions.forEach((q) => (qMap[q._id.toString()] = q));

    let correct = 0, wrong = 0, empty = 0;
    const results = [];

    for (const submission of answers) {
      const q = qMap[submission.questionId];
      if (!q) continue;

      const rawValue = submission.value;
      const isEmpty = rawValue === '' || rawValue === null || rawValue === undefined;

      if (isEmpty) {
        empty++;
        results.push({
          questionId: submission.questionId,
          topic: q.topic,
          userAnswer: null,
          correctAnswer: q.answer,
          unit: q.unit,
          explanation: q.explanation,
          isCorrect: false,
          isEmpty: true,
        });
        continue;
      }

      const userVal = parseFloat(rawValue);
      if (isNaN(userVal)) {
        wrong++;
        results.push({
          questionId: submission.questionId,
          topic: q.topic,
          userAnswer: rawValue,
          correctAnswer: q.answer,
          unit: q.unit,
          explanation: q.explanation,
          isCorrect: false,
          isEmpty: false,
        });
        continue;
      }

      const ok = isAnswerCorrect(userVal, q.answer, q.tolerance);
      if (ok) correct++; else wrong++;

      results.push({
        questionId: submission.questionId,
        topic: q.topic,
        userAnswer: userVal,
        correctAnswer: q.answer,
        unit: q.unit,
        explanation: q.explanation,
        isCorrect: ok,
        isEmpty: false,
      });
    }

    const total = correct + wrong + empty;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    res.json({
      success: true,
      data: { score, correct, wrong, empty, total, results },
    });
  } catch (err) {
    console.error('submitExam error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Admin Controllers ────────────────────────────────────────────────────────

/**
 * GET /api/admin/questions
 * Returns all questions (including inactive) for admin panel
 */
exports.adminGetQuestions = async (req, res) => {
  try {
    const { topic, difficulty, isActive } = req.query;
    const filter = {};
    if (topic) filter.topic = { $regex: topic, $options: 'i' };
    if (difficulty) filter.difficulty = difficulty;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const questions = await Question.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: questions.length, data: questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/admin/questions/:id
 */
exports.adminGetQuestion = async (req, res) => {
  try {
    const q = await Question.findById(req.params.id);
    if (!q) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, data: q });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/admin/questions
 * Create a new question
 */
exports.adminCreateQuestion = async (req, res) => {
  try {
    const { text, answer, tolerance, unit, topic, image, imagePublicId, explanation, difficulty } = req.body;

    const q = await Question.create({
      text, answer, tolerance, unit, topic,
      image: image || null,
      imagePublicId: imagePublicId || null,
      explanation, difficulty,
    });

    res.status(201).json({ success: true, data: q });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/admin/questions/:id
 * Update a question
 */
exports.adminUpdateQuestion = async (req, res) => {
  try {
    const q = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!q) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, data: q });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/admin/questions/:id
 * Delete question + its Cloudinary image
 */
exports.adminDeleteQuestion = async (req, res) => {
  try {
    const q = await Question.findById(req.params.id);
    if (!q) return res.status(404).json({ success: false, message: 'Question not found' });

    // Remove Cloudinary image if it exists
    if (q.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(q.imagePublicId);
      } catch (cloudErr) {
        console.warn('Cloudinary delete warning:', cloudErr.message);
      }
    }

    await q.deleteOne();
    res.json({ success: true, message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/admin/upload
 * Upload image to Cloudinary via multer middleware
 * Returns: { url, publicId }
 */
exports.adminUploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    res.json({
      success: true,
      data: {
        url: req.file.path,          // Cloudinary URL
        publicId: req.file.filename, // Cloudinary public_id
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/admin/seed
 * Seed initial questions from the original CBT (one-time use)
 */
exports.adminSeedQuestions = async (req, res) => {
  try {
    const count = await Question.countDocuments();
    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `Database already has ${count} questions. Clear first if you want to re-seed.`,
      });
    }

    const seedData = req.body.questions;
    if (!Array.isArray(seedData) || seedData.length === 0) {
      return res.status(400).json({ success: false, message: 'questions array required in body' });
    }

    const inserted = await Question.insertMany(seedData);
    res.status(201).json({ success: true, count: inserted.length, message: 'Seed successful' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
