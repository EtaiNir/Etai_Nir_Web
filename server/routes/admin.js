// server/routes/admin.js
const express  = require('express');
const router   = express.Router();
const supabase = require('../db/supabase');
const { requireRole } = require('../middleware/auth');
const multer   = require('multer');
const XLSX     = require('xlsx');

const upload = multer({ storage: multer.memoryStorage() });

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

    if (error) {
      console.error('createUser error:', JSON.stringify(error));
      return res.status(400).json({ error: error.message });
    }
    res.status(201).json({ id: data.user.id, email: data.user.email });
  } catch (err) {
    next(err);
  }
});

// PUT /admin/users/:id  — update role
router.put('/users/:id', async (req, res, next) => {
  try {
    const { role } = req.body;
    const { error } = await supabase.auth.admin.updateUserById(req.params.id, {
      user_metadata: { council_id: req.user.council_id, role },
    });
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /admin/users/:id
router.delete('/users/:id', async (req, res, next) => {
  try {
    const { error } = await supabase.auth.admin.deleteUser(req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /admin/import  multipart: file_kesher, file_nospim
router.post('/import', upload.fields([
  { name: 'file_kesher', maxCount: 1 },
  { name: 'file_nospim', maxCount: 1 },
]), async (req, res, next) => {
  try {
    const councilId = req.user.council_id;
    const results = {};

    for (const [fieldName, tableName] of [
      ['file_kesher', 'talmidim_kesher'],
      ['file_nospim', 'talmidim_nospim'],
    ]) {
      const file = req.files?.[fieldName]?.[0];
      if (!file) { results[tableName] = 'לא הועלה'; continue; }

      const wb   = XLSX.read(file.buffer, { type: 'buffer' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: null });

      if (!rows.length) { results[tableName] = '0 שורות'; continue; }

      const { error: delErr } = await supabase
        .from(tableName).delete().eq('council_id', councilId);
      if (delErr) throw delErr;

      const BATCH = 500;
      for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH).map(r => ({ council_id: councilId, ...r }));
        const { error: insErr } = await supabase.from(tableName).insert(batch);
        if (insErr) throw insErr;
      }

      results[tableName] = `${rows.length} שורות יובאו`;
    }

    res.json({ success: true, results });
  } catch (err) {
    next(err);
  }
});

const REF_TABLES = ['yishuvei_hamoatza', 'semel_yishuv_verechevot'];

// GET /admin/ref/:table
router.get('/ref/:table', async (req, res, next) => {
  try {
    if (!REF_TABLES.includes(req.params.table))
      return res.status(400).json({ error: 'טבלה לא מורשית' });

    const { data, error } = await supabase
      .from(req.params.table)
      .select('*')
      .eq('council_id', req.user.council_id)
      .order('id');
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// POST /admin/ref/:table
router.post('/ref/:table', async (req, res, next) => {
  try {
    if (!REF_TABLES.includes(req.params.table))
      return res.status(400).json({ error: 'טבלה לא מורשית' });

    const { data, error } = await supabase
      .from(req.params.table)
      .insert({ ...req.body, council_id: req.user.council_id })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// PUT /admin/ref/:table/:id
router.put('/ref/:table/:id', async (req, res, next) => {
  try {
    if (!REF_TABLES.includes(req.params.table))
      return res.status(400).json({ error: 'טבלה לא מורשית' });

    const { data, error } = await supabase
      .from(req.params.table)
      .update(req.body)
      .eq('id', req.params.id)
      .eq('council_id', req.user.council_id)
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// DELETE /admin/ref/:table/:id
router.delete('/ref/:table/:id', async (req, res, next) => {
  try {
    if (!REF_TABLES.includes(req.params.table))
      return res.status(400).json({ error: 'טבלה לא מורשית' });

    const { error } = await supabase
      .from(req.params.table)
      .delete()
      .eq('id', req.params.id)
      .eq('council_id', req.user.council_id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
