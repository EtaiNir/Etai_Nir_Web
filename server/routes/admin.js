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
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    const filtered = users
      .filter(u => u.user_metadata?.council_id === req.user.council_id)
      .map(u => ({
        id:               u.id,
        email:            u.email,
        display_name:     u.user_metadata?.display_name || '',
        role:             u.user_metadata?.role || 'viewer',
        allowed_reshuyot: u.user_metadata?.allowed_reshuyot || [],
      }));
    res.json(filtered);
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
      console.error('createUser supabase error:', JSON.stringify(error));
      return res.status(400).json({ error: error.message });
    }
    res.status(201).json({ id: data.user.id, email: data.user.email });
  } catch (err) {
    console.error('createUser exception:', err?.message, JSON.stringify(err));
    next(err);
  }
});

// PUT /admin/users/:id  — update role + allowed_reshuyot
router.put('/users/:id', async (req, res, next) => {
  try {
    const { role, allowed_reshuyot } = req.body;
    const { error } = await supabase.auth.admin.updateUserById(req.params.id, {
      user_metadata: {
        council_id:       req.user.council_id,
        role,
        allowed_reshuyot: allowed_reshuyot || [],
      },
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
    const results   = {};

    const parseExcel = (buffer) => {
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      return XLSX.utils.sheet_to_json(ws, { defval: null });
    };

    // Auto-detect authority code from kesher file
    let semelReshut = null;
    const kesherFile = req.files?.['file_kesher']?.[0];
    if (kesherFile) {
      const rows = parseExcel(kesherFile.buffer);
      semelReshut = rows[0]?.['סמל רשות חינוך'] ?? null;
    }

    // --- kesher ---
    if (kesherFile) {
      const rows = parseExcel(kesherFile.buffer);
      if (!rows.length) {
        results['talmidim_kesher'] = '0 שורות';
      } else {
        const semel = rows[0]['סמל רשות חינוך'];
        const { error: delErr } = await supabase
          .from('talmidim_kesher').delete()
          .eq('council_id', councilId)
          .eq('סמל רשות חינוך', semel);
        if (delErr) throw delErr;

        const BATCH = 500;
        for (let i = 0; i < rows.length; i += BATCH) {
          const batch = rows.slice(i, i + BATCH).map(r => {
            const { '__EMPTY': _empty, ...rest } = r;
            return { council_id: councilId, ...rest };
          });
          const { error: insErr } = await supabase.from('talmidim_kesher').insert(batch);
          if (insErr) throw insErr;
        }
        results['talmidim_kesher'] = `${rows.length} שורות יובאו`;
      }
    } else {
      results['talmidim_kesher'] = 'לא הועלה';
    }

    // --- nospim ---
    const nospimFile = req.files?.['file_nospim']?.[0];
    if (nospimFile) {
      const rows = parseExcel(nospimFile.buffer);
      if (!rows.length) {
        results['talmidim_nospim'] = '0 שורות';
      } else {
        const { error: delErr } = await supabase
          .from('talmidim_nospim').delete()
          .eq('council_id', councilId)
          .eq('semel_reshut', semelReshut);
        if (delErr) throw delErr;

        const BATCH = 500;
        for (let i = 0; i < rows.length; i += BATCH) {
          const batch = rows.slice(i, i + BATCH).map(r => {
            const { 'מזהה': _id, ...rest } = r;
            return { council_id: councilId, semel_reshut: semelReshut, ...rest };
          });
          const { error: insErr } = await supabase.from('talmidim_nospim').insert(batch);
          if (insErr) throw insErr;
        }
        results['talmidim_nospim'] = `${rows.length} שורות יובאו`;
      }
    } else {
      results['talmidim_nospim'] = 'לא הועלה';
    }

    res.json({ success: true, results });
  } catch (err) {
    next(err);
  }
});

const REF_TABLES = ['yishuvei_hamoatza', 'semel_yishuv_verechevot', 'rashuyot_chinuch'];

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
