// models/Question.js
// Core data model for CBT questions

const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    answer: {
      type: Number,
      required: [true, 'Correct answer is required'],
    },
    // Tolerance: answer is correct if |user - answer| <= tolerance
    // If 0, use percentage-based default (6% relative + 0.05 absolute)
    tolerance: {
      type: Number,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      default: '',
      trim: true,
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
    },
    // Cloudinary URL (or local path fallback)
    image: {
      type: String,
      default: null,
    },
    // Cloudinary public_id for deletion
    imagePublicId: {
      type: String,
      default: null,
    },
    explanation: {
      type: String,
      default: '',
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['mudah', 'sedang', 'sulit'],
      default: 'sedang',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search
QuestionSchema.index({ topic: 1, isActive: 1 });

module.exports = mongoose.model('Question', QuestionSchema);
