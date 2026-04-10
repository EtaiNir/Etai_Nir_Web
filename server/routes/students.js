// server/routes/students.js
const express  = require('express');
const router   = express.Router();
const supabase = require('../db/supabase');

const PAGE_SIZE = 50;

// GET /students?q=שם&page=1
router.get('/', async (req, res, next) => {
  try {
    const councilId = req.user.council_id;
    const page      = parseInt(req.query.page) || 1;
    const q         = req.query.q || '';
    const offset    = (page - 1) * PAGE_SIZE;

    let query = supabase
      .from('students')
      .select('*', { count: 'exact' })
      .eq('council_id', councilId)
      .range(offset, offset + PAGE_SIZE - 1);

    if (q) {
      query = query.ilike('"שם תלמיד"', `%${q}%`);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({
      data,
      total: count,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(count / PAGE_SIZE),
    });
  } catch (err) {
    next(err);
  }
});

// GET /students/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', req.params.id)
      .eq('council_id', req.user.council_id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Student not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
