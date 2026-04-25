// js/app.js
// Orchestrates all modules – thin controller layer

import { fetchQuestions, submitExam } from './api.js';
import { ExamTimer } from './timer.js';
import state, { setAnswer, buildSubmitPayload, indexResults } from './state.js';
import {
  buildNavGrid, updateNavGrid, updateProgress,
  renderQuestion, showScoreModal, showLoading, showError,
} from './renderer.js';
import CONFIG from './config.js';

let timer      = null;
let resultsMap = null;  // set after submission

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  showLoading('Memuat soal dari server...');

  try {
    state.questions = await fetchQuestions();

    if (state.questions.length === 0) {
      showError('Tidak ada soal tersedia. Hubungi admin.');
      return;
    }

    // Init answer map
    state.questions.forEach(q => (state.answers[q._id] = ''));

    buildNavGrid(navigateTo);
    renderQuestion(0, null, handleAnswer, navigateTo);
    updateNavGrid();
    updateProgress();
    startTimer();

  } catch (err) {
    console.error(err);
    showError(`Gagal memuat soal: ${err.message}. Pastikan server aktif dan coba lagi.`);
  }
}

// ── Timer ─────────────────────────────────────────────────────────────────────

function startTimer() {
  const el = document.getElementById('timer-display');
  timer = new ExamTimer(CONFIG.EXAM_DURATION_SECONDS, el, () => {
    handleSubmit(true); // auto-submit on expire
  });
  timer.start();
}

// ── Navigation ────────────────────────────────────────────────────────────────

function navigateTo(idx) {
  if (idx < 0 || idx >= state.questions.length) return;
  state.currentIdx = idx;
  renderQuestion(idx, resultsMap, handleAnswer, navigateTo);
  updateNavGrid(resultsMap);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Answer Handling ───────────────────────────────────────────────────────────

function handleAnswer(value) {
  const q = state.questions[state.currentIdx];
  setAnswer(q._id, value.trim());
  updateNavGrid(resultsMap);
  updateProgress();

  // Visual feedback on input
  const inp = document.getElementById('answer-input');
  if (inp) inp.classList.toggle('filled', value.trim() !== '');
}

// ── Submit ────────────────────────────────────────────────────────────────────

async function handleSubmit(auto = false) {
  if (state.submitted) return;

  const unanswered = state.questions.filter(q => (state.answers[q._id] ?? '').trim() === '').length;

  if (!auto && unanswered > 0) {
    if (!confirm(`Masih ada ${unanswered} soal yang belum dijawab.\nYakin ingin mengumpulkan?`)) return;
  }

  // Disable submit button immediately
  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Menilai...'; }

  timer?.stop();
  state.submitted = true;

  try {
    const payload  = buildSubmitPayload();
    const grading  = await submitExam(payload);

    resultsMap = indexResults(grading.results);
    state.results = grading;
    state.score   = grading.score;

    // Re-render current question in review mode
    renderQuestion(state.currentIdx, resultsMap, handleAnswer, navigateTo);
    updateNavGrid(resultsMap);
    showScoreModal(grading);

  } catch (err) {
    console.error('Submit error:', err);
    alert(`Gagal mengumpulkan jawaban: ${err.message}\nCoba lagi.`);
    state.submitted = false;
    timer?.start();
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Kumpulkan'; }
  }
}

// ── Retry ─────────────────────────────────────────────────────────────────────

function handleRetry() {
  // Reset state
  state.submitted  = false;
  state.currentIdx = 0;
  state.results    = null;
  state.score      = 0;
  resultsMap       = null;
  state.questions.forEach(q => (state.answers[q._id] = ''));

  document.getElementById('modal-overlay').classList.remove('show');
  timer?.stop();

  // Re-fetch fresh questions
  init();
}

// ── Review Navigation (from modal) ────────────────────────────────────────────

function handleReviewAll() {
  document.getElementById('modal-overlay').classList.remove('show');
  navigateTo(0);
}

// ── Event Wiring ──────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('submit-btn')?.addEventListener('click', () => handleSubmit(false));
  document.getElementById('btn-retry')?.addEventListener('click', handleRetry);
  document.getElementById('btn-review')?.addEventListener('click', handleReviewAll);
  init();
});
