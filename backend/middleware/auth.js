// middleware/auth.js
// Simple key-based admin authentication
// In production, replace with JWT or session-based auth

const adminAuth = (req, res, next) => {
  const key = req.headers['x-admin-key'] || req.query.adminKey;

  if (!key || key !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Valid admin key required.',
    });
  }

  next();
};

module.exports = adminAuth;
