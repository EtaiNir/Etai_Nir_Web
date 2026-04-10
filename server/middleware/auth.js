// server/middleware/auth.js
const { expressjwt: jwt } = require('express-jwt');
const supabase = require('../db/supabase');

// Validate Supabase JWT
const requireAuth = jwt({
  secret: process.env.SUPABASE_JWT_SECRET,
  algorithms: ['HS256'],
});

// Attach user record (council_id + role) to req.user
async function attachUser(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, council_id, role')
      .eq('id', req.auth.sub)
      .single();

    if (error || !data) return res.status(401).json({ error: 'User not found' });

    req.user = data;  // { id, council_id, role }
    next();
  } catch (err) {
    next(err);
  }
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
