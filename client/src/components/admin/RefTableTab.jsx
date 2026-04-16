// client/src/components/admin/RefTableTab.jsx
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

const TABLES = [
  { key: 'rashuyot_chinuch',        label: 'רשויות חינוך' },
  { key: 'yishuvei_hamoatza',       label: 'ישובי המועצה' },
  { key: 'semel_yishuv_verechevot', label: 'סמל ישוב ורחובות' },
];

export default function RefTableTab() {
  const [table, setTable]       = useState('');
  const [editId, setEditId]     = useState(null);
  const [editData, setEditData] = useState({});
  const [newRow, setNewRow]     = useState(null);
  const qc = useQueryClient();

  const { data: rows = [], isLoading, error } = useQuery({
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

  function startNewRow() {
    const empty = cols.length > 0
      ? Object.fromEntries(cols.map(c => [c, '']))
      : {};
    setNewRow(empty);
  }

  async function saveNewRow() {
    await api.post(`/admin/ref/${table}`, newRow);
    qc.invalidateQueries(['refTable', table]);
    setNewRow(null);
  }

  const effectiveCols = cols.length > 0 ? cols
    : newRow ? Object.keys(newRow).filter(k => k !== 'id' && k !== 'council_id') : [];

  return (
    <div>
      <div className="flex gap-3 mb-4 items-center">
        <select value={table} onChange={e => { setTable(e.target.value); setEditId(null); setNewRow(null); }}
          className="border rounded px-3 py-1.5 text-sm">
          <option value="">בחר טבלה...</option>
          {TABLES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
        {table && (
          <button onClick={startNewRow} disabled={!!newRow}
            className="text-sm bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-50">
            + שורה חדשה
          </button>
        )}
      </div>

      {isLoading && <p className="text-sm text-gray-500">טוען...</p>}
      {error   && <p className="text-sm text-red-600">שגיאה: {error.response?.data?.error || error.message}</p>}

      {table && !isLoading && !error && rows.length === 0 && !newRow && (
        <p className="text-sm text-gray-500">הטבלה ריקה. לחץ "+ שורה חדשה" להוספה.</p>
      )}

      {(rows.length > 0 || newRow) && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {effectiveCols.map(c => <th key={c} className="border px-2 py-1 text-right font-medium">{c}</th>)}
                <th className="border px-2 py-1 w-24"></th>
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

              {newRow && (
                <tr className="bg-green-50">
                  {effectiveCols.map(c => (
                    <td key={c} className="border px-2 py-1">
                      <input value={newRow[c] ?? ''} onChange={e => setNewRow(r => ({ ...r, [c]: e.target.value }))}
                        className="w-full border rounded px-1 text-xs" />
                    </td>
                  ))}
                  <td className="border px-2 py-1 text-center">
                    <button onClick={saveNewRow} className="text-green-600 text-xs hover:underline">שמור</button>
                    <button onClick={() => setNewRow(null)} className="text-gray-500 text-xs hover:underline mr-1">ביטול</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
