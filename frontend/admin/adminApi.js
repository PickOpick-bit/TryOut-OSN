// admin/js/adminApi.js
// All admin API calls

const BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'http://localhost:5000'; // <-- REPLACE

function getKey() {
  return sessionStorage.getItem('adminKey') || '';
}

function headers(extra = {}) {
  return { 'Content-Type': 'application/json', 'x-admin-key': getKey(), ...extra };
}

async function req(method, path, body = null) {
  const opts = { method, headers: headers() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || `HTTP ${res.status}`);
  return json;
}

export const adminApi = {
  BASE,
  getKey,

  login: async (key) => {
    // Validate key by hitting admin endpoint
    const res = await fetch(`${BASE}/api/admin/questions?limit=1`, {
      headers: { 'x-admin-key': key }
    });
    const json = await res.json();
    if (!json.success) throw new Error('Invalid admin key');
    sessionStorage.setItem('adminKey', key);
    return true;
  },

  getQuestions: (params = '') => req('GET', `/api/admin/questions${params}`),
  getQuestion:  (id) => req('GET', `/api/admin/questions/${id}`),
  createQuestion: (data) => req('POST', '/api/admin/questions', data),
  updateQuestion: (id, data) => req('PUT', `/api/admin/questions/${id}`, data),
  deleteQuestion: (id) => req('DELETE', `/api/admin/questions/${id}`),

  uploadImage: async (file) => {
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch(`${BASE}/api/admin/upload`, {
      method: 'POST',
      headers: { 'x-admin-key': getKey() },
      body: fd,
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data; // { url, publicId }
  },

  seedQuestions: (questions) => req('POST', '/api/admin/seed', { questions }),
};
