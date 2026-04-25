// js/renderer.js
// All DOM rendering logic – keeps app.js clean

import state, { getAnswer, getAnsweredCount } from './state.js';

// ── KaTeX Helper ──────────────────────────────────────────────────────────────
function renderMath(el) {
  if (window.renderMathInElement) {
    renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$',  right: '$',  display: false },
      ],
      throwOnError: false,
    });
  }
}

// ── Nav Grid ──────────────────────────────────────────────────────────────────

export function buildNavGrid(onNavigate) {
  const grid = document.getElementById('nav-grid');
  grid.innerHTML = '';
  state.questions.forEach((q, i) => {
    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.textContent = i + 1;
    btn.id = `nav-${i}`;
    btn.setAttribute('aria-label', `Soal ${i + 1}`);
    btn.addEventListener('click', () => onNavigate(i));
    grid.appendChild(btn);
  });
}

export function updateNavGrid(resultsMap = null) {
  state.questions.forEach((q, i) => {
    const btn = document.getElementById(`nav-${i}`);
    if (!btn) return;
    btn.className = 'nav-btn';

    const answered = getAnswer(q._id).trim() !== '';

    if (state.submitted && resultsMap) {
      const r = resultsMap[q._id];
      if (r) {
        if (r.isEmpty)       btn.classList.add('empty-submitted');
        else if (r.isCorrect) btn.classList.add('correct-submitted');
        else                  btn.classList.add('wrong-submitted');
      }
    } else {
      if (answered) btn.classList.add('answered');
    }

    if (i === state.currentIdx) btn.classList.add('active');
  });
}

// ── Progress ──────────────────────────────────────────────────────────────────

export function updateProgress() {
  const answered = getAnsweredCount();
  const total    = state.questions.length;
  const pct      = total ? (answered / total) * 100 : 0;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-label').textContent = `${answered} / ${total} dijawab`;
}

// ── Question Card ─────────────────────────────────────────────────────────────

export function renderQuestion(idx, resultsMap = null, onAnswer, onNavigate) {
  const q   = state.questions[idx];
  const val = getAnswer(q._id);

  // Build result block (review mode)
  let reviewHTML = '';
  if (state.submitted && resultsMap) {
    const r = resultsMap[q._id];
    if (r) {
      if (r.isEmpty) {
        reviewHTML = `
          <div class="review-block review-empty">
            <span class="review-badge">⊘ Tidak dijawab</span>
            <div class="review-correct">Jawaban: <strong>${r.correctAnswer}${r.unit ? ' ' + r.unit : ''}</strong></div>
            ${r.explanation ? `<div class="review-explanation"><strong>💡 Pembahasan:</strong><br>${r.explanation}</div>` : ''}
          </div>`;
      } else {
        reviewHTML = `
          <div class="review-block ${r.isCorrect ? 'review-correct-block' : 'review-wrong-block'}">
            <span class="result-badge ${r.isCorrect ? 'correct' : 'wrong'}">
              ${r.isCorrect ? '✓ Benar' : '✗ Salah'}
            </span>
            ${!r.isCorrect ? `<div class="review-correct">Jawaban: <strong>${r.correctAnswer}${r.unit ? ' ' + r.unit : ''}</strong></div>` : ''}
            ${r.explanation ? `<div class="review-explanation"><strong>💡 Pembahasan:</strong><br>${r.explanation}</div>` : ''}
          </div>`;
      }
    }
  }

  // Input color class
  let inputClass = '';
  if (state.submitted && resultsMap) {
    const r = resultsMap[q._id];
    if (r && !r.isEmpty) inputClass = r.isCorrect ? 'answer-result-correct' : 'answer-result-wrong';
  } else if (val.trim() !== '') {
    inputClass = 'filled';
  }

  // Image
  let imageHTML = '';
  if (q.image) {
    imageHTML = `
      <div class="question-image-wrap">
        <img src="${q.image}" alt="Gambar soal ${idx + 1}"
          onerror="this.parentElement.innerHTML='<div class=\\'img-placeholder\\'><span>🖼️</span>Gambar tidak tersedia</div>'" />
      </div>`;
  }

  const total = state.questions.length;
  const html  = `
    <div class="question-card">
      <div class="question-header">
        <div class="question-number">${idx + 1}</div>
        <div class="question-topic">${q.topic || ''}</div>
        ${q.difficulty ? `<span class="difficulty-badge diff-${q.difficulty}">${q.difficulty}</span>` : ''}
      </div>
      <div class="question-body">
        <div class="question-text">${q.text}</div>
        ${imageHTML}
        <div class="answer-area">
          <div class="answer-label">Jawaban</div>
          <div class="answer-row">
            <input
              type="number"
              step="any"
              class="answer-input ${inputClass}"
              id="answer-input"
              value="${val}"
              placeholder="0.0"
              ${state.submitted ? 'disabled' : ''}
              autocomplete="off"
            />
            ${q.unit ? `<span class="answer-unit">${q.unit}</span>` : ''}
          </div>
          ${reviewHTML}
        </div>
      </div>
    </div>
    <div class="nav-controls">
      <button class="btn-nav" id="btn-prev" ${idx === 0 ? 'disabled' : ''}>← Soal ${idx}</button>
      <span class="nav-counter">${idx + 1} / ${total}</span>
      <button class="btn-nav btn-nav-next" id="btn-next" ${idx === total - 1 ? 'disabled' : ''}>Soal ${idx + 2} →</button>
    </div>
  `;

  const container = document.getElementById('main-content');
  container.innerHTML = html;

  // Wire answer input
  const inp = document.getElementById('answer-input');
  if (inp && !state.submitted) {
    inp.addEventListener('input', (e) => onAnswer(e.target.value));
    inp.focus();
  }

  // Wire nav buttons
  document.getElementById('btn-prev')?.addEventListener('click', () => onNavigate(idx - 1));
  document.getElementById('btn-next')?.addEventListener('click', () => onNavigate(idx + 1));

  renderMath(container);
}

// ── Score Modal ───────────────────────────────────────────────────────────────

export function showScoreModal(data) {
  const { score, correct, wrong, empty } = data;

  document.getElementById('stat-correct').textContent = correct;
  document.getElementById('stat-wrong').textContent   = wrong;
  document.getElementById('stat-empty').textContent   = empty;
  document.getElementById('score-number').textContent = score;

  const circle = document.getElementById('score-circle');
  circle.style.setProperty('--pct', `${score * 3.6}deg`);

  const trophy = score >= 80 ? '🏆' : score >= 60 ? '🎓' : score >= 40 ? '📚' : '💪';
  document.getElementById('modal-trophy').textContent = trophy;

  // Color the circle based on score
  const color = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--blue)' : score >= 40 ? 'var(--accent)' : 'var(--red)';
  circle.style.setProperty('--circle-color', color);

  document.getElementById('modal-overlay').classList.add('show');
}

// ── Loading / Error States ────────────────────────────────────────────────────

export function showLoading(msg = 'Memuat soal...') {
  document.getElementById('main-content').innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>${msg}</p>
    </div>`;
}

export function showError(msg) {
  document.getElementById('main-content').innerHTML = `
    <div class="error-state">
      <div class="error-icon">⚠️</div>
      <p>${msg}</p>
      <button class="btn-submit" onclick="location.reload()">Coba Lagi</button>
    </div>`;
}
