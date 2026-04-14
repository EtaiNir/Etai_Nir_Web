// client/src/components/admin/ImportTab.jsx
import { useState } from 'react';
import api from '../../api/client';

export default function ImportTab() {
  const [files, setFiles]     = useState({ file_kesher: null, file_nospim: null });
  const [status, setStatus]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleImport() {
    if (!files.file_kesher && !files.file_nospim) {
      setStatus('יש לבחור לפחות קובץ אחד');
      return;
    }
    setLoading(true);
    setStatus('מייבא...');
    try {
      const fd = new FormData();
      if (files.file_kesher) fd.append('file_kesher', files.file_kesher);
      if (files.file_nospim) fd.append('file_nospim', files.file_nospim);
      const { data } = await api.post('/admin/import', fd);
      setStatus(Object.entries(data.results).map(([t, r]) => `${t}: ${r}`).join(' | '));
    } catch (e) {
      setStatus('שגיאה: ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 max-w-lg">
      <p className="text-sm text-gray-600">העלה את קבצי האקסל החודשיים ממשרד החינוך.</p>

      {[
        { key: 'file_kesher', label: 'קובץ גורמי קשר (talmidim_kesher)' },
        { key: 'file_nospim', label: 'קובץ שדות תוספתיים (talmidim_nospim)' },
      ].map(({ key, label }) => (
        <div key={key}>
          <label className="block text-sm font-medium mb-1">{label}</label>
          <input type="file" accept=".xlsx"
            onChange={e => setFiles(f => ({ ...f, [key]: e.target.files[0] }))}
            className="text-sm" />
        </div>
      ))}

      <button onClick={handleImport} disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'מייבא...' : 'ייבא נתונים'}
      </button>

      {status && <p className="text-sm font-medium mt-2">{status}</p>}
    </div>
  );
}
