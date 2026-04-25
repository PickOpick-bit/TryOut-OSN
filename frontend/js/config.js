// js/config.js
// Central configuration – change API_BASE_URL after deploying backend

const CONFIG = {
  // ⚠️  Change this to your Render backend URL after deployment
  // Example: 'https://cbt-platform-api.onrender.com'
  API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://tryout-osn-production.up.railway.app', 

  EXAM_DURATION_SECONDS: 90 * 60, // 90 minutes
  QUESTION_LIMIT: 40,
};

export default CONFIG;
