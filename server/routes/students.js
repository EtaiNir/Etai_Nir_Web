// server/routes/students.js
const express  = require('express');
const router   = express.Router();
const supabase = require('../db/supabase');

const PAGE_SIZE = 50;

// GET /students/filters — distinct values for quick-filter dropdowns
router.get('/filters', async (req, res, next) => {
  try {
    const councilId = req.user.council_id;

    const fetchDistinct = async (col) => {
      const { data, error } = await supabase
        .from('talmidim_kesher')
        .select(`"${col}"`)
        .eq('council_id', councilId)
        .not(`"${col}"`, 'is', null);
      if (error) throw error;
      return [...new Set(data.map(r => r[col]).filter(Boolean))].sort();
    };

    const [mosadot, shkavot, makhvilot, yishuvim] = await Promise.all([
      fetchDistinct('שם מוסד'),
      fetchDistinct('שכבה'),
      fetchDistinct('מקבילה'),
      fetchDistinct('תאור ישוב 1ת'),
    ]);

    res.json({ mosadot, shkavot, makhvilot, yishuvim });
  } catch (err) {
    next(err);
  }
});

// GET /students?q=&mosad=&shkhava=&makhbila=&yishuv=&col1=&val1=&col2=&val2=&page=
router.get('/', async (req, res, next) => {
  try {
    const councilId = req.user.council_id;
    const page      = parseInt(req.query.page) || 1;
    const offset    = (page - 1) * PAGE_SIZE;
    const { q, mosad, shkhava, makhbila, yishuv, col1, val1, col2, val2 } = req.query;

    let query = supabase
      .from('talmidim_kesher')
      .select('*', { count: 'exact' })
      .eq('council_id', councilId)
      .range(offset, offset + PAGE_SIZE - 1);

    if (req.user.allowed_reshuyot?.length)
      query = query.in('סמל רשות חינוך', req.user.allowed_reshuyot);

    if (q)        query = query.or(`"שם משפחה".ilike.%${q}%,"שם פרטי".ilike.%${q}%`);
    if (mosad)    query = query.eq('"שם מוסד"',      mosad);
    if (shkhava)  query = query.eq('"שכבה"',          shkhava);
    if (makhbila) query = query.eq('"מקבילה"',        makhbila);
    if (yishuv)   query = query.eq('"תאור ישוב 1ת"',  yishuv);
    if (col1 && val1) query = query.ilike(`"${col1}"`, `%${val1}%`);
    if (col2 && val2) query = query.ilike(`"${col2}"`, `%${val2}%`);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({ data, total: count, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(count / PAGE_SIZE) });
  } catch (err) {
    next(err);
  }
});

// GET /students/export — all matching rows, no pagination (for Excel/PDF export)
router.get('/export', async (req, res, next) => {
  try {
    const councilId = req.user.council_id;
    const { q, mosad, shkhava, makhbila, yishuv, col1, val1, col2, val2 } = req.query;

    let query = supabase
      .from('talmidim_kesher')
      .select('*')
      .eq('council_id', councilId);

    if (req.user.allowed_reshuyot?.length)
      query = query.in('סמל רשות חינוך', req.user.allowed_reshuyot);

    if (q)        query = query.or(`"שם משפחה".ilike.%${q}%,"שם פרטי".ilike.%${q}%`);
    if (mosad)    query = query.eq('"שם מוסד"',      mosad);
    if (shkhava)  query = query.eq('"שכבה"',          shkhava);
    if (makhbila) query = query.eq('"מקבילה"',        makhbila);
    if (yishuv)   query = query.eq('"תאור ישוב 1ת"',  yishuv);
    if (col1 && val1) query = query.ilike(`"${col1}"`, `%${val1}%`);
    if (col2 && val2) query = query.ilike(`"${col2}"`, `%${val2}%`);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /students/:id?full=true
router.get('/:id', async (req, res, next) => {
  try {
    const table = req.query.full === 'true' ? 'talmidim_full' : 'talmidim_kesher';
    const { data, error } = await supabase
      .from(table)
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
