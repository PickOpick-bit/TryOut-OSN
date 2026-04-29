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

let timer        = null;
let resultsMap   = null;
let studentNama  = '';
let studentKelas = '';
let startTime    = null;

// Google Apps Script URL
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbw8pT-Aul0GVj93BrVTIwH4Psyap1zc9h3Ko4kh-OOtsLGxQDStkG3uHa7gw4rX3Rewmg/exec';
// ── Student Form ──────────────────────────────────────────────────────────────

function initStudentForm() {
  const btnMulai = document.getElementById('btn-mulai');

  btnMulai.addEventListener('click', () => {
    const nama  = document.getElementById('input-nama').value.trim();
    const kelas = document.getElementById('input-kelas').value;

    if (!nama) {
      alert('Nama tidak boleh kosong!');
      document.getElementById('input-nama').focus();
      return;
    }
    if (!kelas) {
      alert('Silakan pilih kelas terlebih dahulu!');
      return;
    }

    studentNama  = nama;
    studentKelas = kelas;
    startTime    = Date.now();

    document.getElementById('student-form-screen').style.display = 'none';
    init();
  });

  document.getElementById('input-nama').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-mulai').click();
  });
}

// ── Send to Google Sheets ─────────────────────────────────────────────────────

async function sendToSheets(grading) {
  const durasi = startTime ? Math.round((Date.now() - startTime) / 60000) : 0;

  const payload = {
    nama:   studentNama,
    kelas:  studentKelas,
    skor:   grading.score,
    benar:  grading.correct,
    salah:  grading.wrong,
    kosong: grading.empty,
    total:  grading.total,
    durasi: durasi,
  };

  try {
    await fetch(SHEETS_URL, {
      method: 'POST',
      mode:   'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log('✅ Data terkirim ke Google Sheets');
  } catch (err) {
    console.warn('⚠️ Gagal kirim ke Sheets:', err.message);
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  showLoading('Memuat soal dari server...');

  try {
    state.questions = await fetchQuestions();

    if (state.questions.length === 0) {
      showError('Tidak ada soal tersedia. Hubungi admin.');
      return;
    }

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
    handleSubmit(true);
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

  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Menilai...'; }

  timer?.stop();
  state.submitted = true;

  try {
    const payload = buildSubmitPayload();
    const grading = await submitExam(payload);

    resultsMap    = indexResults(grading.results);
    state.results = grading;
    state.score   = grading.score;

    // Kirim ke Google Sheets di background
    sendToSheets(grading);

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
  state.submitted  = false;
  state.currentIdx = 0;
  state.results    = null;
  state.score      = 0;
  resultsMap       = null;
  startTime        = Date.now();
  state.questions.forEach(q => (state.answers[q._id] = ''));

  document.getElementById('modal-overlay').classList.remove('show');
  timer?.stop();
  init();
}

// ── Review ────────────────────────────────────────────────────────────────────

function handleReviewAll() {
  document.getElementById('modal-overlay').classList.remove('show');
  navigateTo(0);
}

// ── Event Wiring ──────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initStudentForm();
  document.getElementById('submit-btn')?.addEventListener('click', () => handleSubmit(false));
  document.getElementById('btn-retry')?.addEventListener('click', handleRetry);
  document.getElementById('btn-review')?.addEventListener('click', handleReviewAll);
});
