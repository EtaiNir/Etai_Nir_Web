// client/src/components/admin/RefTableTab.jsx
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

const TABLES = [
  { key: 'yishuvei_hamoatza',       label: 'ישובי המועצה' },
  { key: 'semel_yishuv_verechevot', label: 'סמל ישוב ורחובות' },
];

export default function RefTableTab() {
  const [table, setTable]       = useState('');
  const [editId, setEditId]     = useState(null);
  const [editData, setEditData] = useState({});
  const qc = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['refTable', table],
    queryFn: () => api.get(`/admin/ref/${table}`).then(r => r.data),
    enabled: !!table,
  });

  const cols = rows[0] ? Object.keys(rows[0]).filter(k => k !== 'id' && k !== 'council_id') : [];

  async function saveEdit(id) {
    await api.put(`/admin/ref/${table}/${id}`, editData);
    qc.invalidateQueries(['refTable', table]);
    setEditId(null);
  }

  async function deleteRow(id) {
    if (!confirm('למחוק שורה זו?')) return;
    await api.delete(`/admin/ref/${table}/${id}`);
    qc.invalidateQueries(['refTable', table]);
  }

  return (
    <div>
      <div className="flex gap-3 mb-4 items-center">
        <select value={table} onChange={e => setTable(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm">
          <option value="">בחר טבלה...</option>
          {TABLES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </div>

      {isLoading && <p className="text-sm text-gray-500">טוען...</p>}

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {cols.map(c => <th key={c} className="border px-2 py-1 text-right font-medium">{c}</th>)}
                <th className="border px-2 py-1 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="hover:bg-blue-50">
                  {cols.map(c => (
                    <td key={c} className="border px-2 py-1">
                      {editId === row.id
                        ? <input value={editData[c] ?? ''} onChange={e => setEditData(d => ({ ...d, [c]: e.target.value }))}
                            className="w-full border rounded px-1 text-xs" />
                        : row[c] ?? ''}
                    </td>
                  ))}
                  <td className="border px-2 py-1 text-center">
                    {editId === row.id ? (
                      <span className="space-x-1">
                        <button onClick={() => saveEdit(row.id)} className="text-green-600 text-xs hover:underline">שמור</button>
                        <button onClick={() => setEditId(null)} className="text-gray-500 text-xs hover:underline mr-1">ביטול</button>
                      </span>
                    ) : (
                      <span className="space-x-1">
                        <button onClick={() => { setEditId(row.id); setEditData(row); }} className="text-blue-600 text-xs hover:underline">עריכה</button>
                        <button onClick={() => deleteRow(row.id)} className="text-red-600 text-xs hover:underline mr-1">מחק</button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
