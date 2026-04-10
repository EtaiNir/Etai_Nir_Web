// server/routes/auth.js
const express  = require('express');
const router   = express.Router();
const supabase = require('../db/supabase');

// POST /auth/login  { email, password }
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });

    res.json({
      token: data.session.access_token,
      user:  {
        id:    data.user.id,
        email: data.user.email,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
