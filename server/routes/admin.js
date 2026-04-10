// server/routes/admin.js
const express  = require('express');
const router   = express.Router();
const supabase = require('../db/supabase');
const { requireRole } = require('../middleware/auth');

// All admin routes require admin role
router.use(requireRole('admin'));

// GET /admin/users — list users in this council
router.get('/users', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, display_name, role, created_at')
      .eq('council_id', req.user.council_id);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /admin/users  { email, password, display_name, role }
router.post('/users', async (req, res, next) => {
  try {
    const { email, password, display_name, role = 'viewer' } = req.body;

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        council_id:   req.user.council_id,
        role,
        display_name,
      },
      email_confirm: true,
    });

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ id: data.user.id, email: data.user.email });
  } catch (err) {
    next(err);
  }
});

// DELETE /admin/users/:id
router.delete('/users/:id', async (req, res, next) => {
  try {
    // Verify the target user belongs to same council
    const { data: target } = await supabase
      .from('users')
      .select('council_id')
      .eq('id', req.params.id)
      .single();

    if (!target || target.council_id !== req.user.council_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { error } = await supabase.auth.admin.deleteUser(req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
