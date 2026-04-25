// js/state.js
// Central exam state – single source of truth

const state = {
  questions:   [],  // { _id, text, unit, topic, image }
  answers:     {},  // { [questionId]: string }
  currentIdx:  0,
  submitted:   false,
  results:     null,  // server grading response after submit
  score:       0,
};

export default state;

// ── Convenience helpers ───────────────────────────────────────────────────────

export function setAnswer(questionId, value) {
  state.answers[questionId] = value;
}

export function getAnswer(questionId) {
  return state.answers[questionId] ?? '';
}

export function getAnsweredCount() {
  return Object.values(state.answers).filter(v => v.trim() !== '').length;
}

export function buildSubmitPayload() {
  return state.questions.map(q => ({
    questionId: q._id,
    value: state.answers[q._id] ?? '',
  }));
}

/**
 * Store grading results indexed by questionId for O(1) lookup
 */
export function indexResults(results) {
  const map = {};
  results.forEach(r => (map[r.questionId] = r));
  return map;
}
