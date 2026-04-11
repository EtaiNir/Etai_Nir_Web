// server/middleware/auth.js
const supabase = require('../db/supabase');

// Validate token using Supabase SDK (no JWT secret needed)
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  req.authUser = user;  // Supabase auth user
  next();
}

// Attach user record (council_id + role) to req.user from auth metadata
async function attachUser(req, res, next) {
  const meta = req.authUser.user_metadata;
  console.log('attachUser meta:', JSON.stringify(meta), 'app_meta:', JSON.stringify(req.authUser.app_metadata));
  if (!meta?.council_id) {
    return res.status(401).json({ error: 'User not configured' });
  }
  req.user = {
    id:         req.authUser.id,
    council_id: meta.council_id,
    role:       meta.role || 'viewer',
  };
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = { requireAuth, attachUser, requireRole };
