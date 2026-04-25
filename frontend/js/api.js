// js/api.js
// All HTTP calls in one place – easy to mock or swap

import CONFIG from './config.js';

const BASE = CONFIG.API_BASE_URL;

/**
 * Fetch randomized questions from backend (no answers included)
 * @returns {Promise<Array>} Array of question objects
 */
export async function fetchQuestions() {
  const res = await fetch(`${BASE}/api/questions?limit=${CONFIG.QUESTION_LIMIT}`);
  if (!res.ok) throw new Error(`Failed to load questions: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

/**
 * Submit exam answers to backend for grading
 * @param {Array<{questionId: string, value: string}>} answers
 * @returns {Promise<Object>} { score, correct, wrong, empty, results }
 */
export async function submitExam(answers) {
  const res = await fetch(`${BASE}/api/questions/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error(`Submission failed: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}
