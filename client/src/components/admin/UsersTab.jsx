// client/src/components/admin/UsersTab.jsx
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

const ROLES = ['viewer', 'editor', 'admin'];

export default function UsersTab() {
  const qc = useQueryClient();
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'viewer', allowed_reshuyot: [] });
  const [editId, setEditId]   = useState(null);
  const [editData, setEditData] = useState({});
  const [msg, setMsg]         = useState('');

  const { data: users = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => api.get('/admin/users').then(r => r.data),
  });

  const { data: reshuyot = [] } = useQuery({
    queryKey: ['refTable', 'rashuyot_chinuch'],
    queryFn: () => api.get('/admin/ref/rashuyot_chinuch').then(r => r.data),
  });

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await api.post('/admin/users', newUser);
      setMsg('המשתמש נוצר בהצלחה');
      setNewUser({ email: '', password: '', role: 'viewer', allowed_reshuyot: [] });
      qc.invalidateQueries(['adminUsers']);
    } catch (err) {
      setMsg('שגיאה: ' + (err.response?.data?.error || err.message));
    }
  }

  async function handleDelete(id) {
    if (!confirm('למחוק משתמש זה?')) return;
    await api.delete(`/admin/users/${id}`);
    qc.invalidateQueries(['adminUsers']);
  }

  async function saveEdit(id) {
    try {
      await api.put(`/admin/users/${id}`, editData);
      setEditId(null);
      qc.invalidateQueries(['adminUsers']);
    } catch (err) {
      setMsg('שגיאה: ' + (err.response?.data?.error || err.message));
    }
  }

  function toggleReshut(current, semel) {
    return current.includes(semel)
      ? current.filter(s => s !== semel)
      : [...current, semel];
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="font-medium mb-2 text-sm">משתמשים קיימים</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-3 py-1 text-right">דואל</th>
              <th className="border px-3 py-1 text-right">תפקיד</th>
              <th className="border px-3 py-1 text-right">רשויות מורשות</th>
              <th className="border px-2 py-1 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                {editId === u.id ? (
                  <>
                    <td className="border px-3 py-1">{u.email}</td>
                    <td className="border px-3 py-1">
                      <select value={editData.role}
                        onChange={e => setEditData(d => ({ ...d, role: e.target.value }))}
                        className="border rounded px-1 py-0.5 text-xs w-full">
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="border px-3 py-1">
                      <div className="flex flex-wrap gap-2">
                        {reshuyot.map(r => (
                          <label key={r.semel} className="flex items-center gap-1 text-xs">
                            <input type="checkbox"
                              checked={editData.allowed_reshuyot?.includes(r.semel)}
                              onChange={() => setEditData(d => ({
                                ...d,
                                allowed_reshuyot: toggleReshut(d.allowed_reshuyot || [], r.semel),
                              }))} />
                            {r.shem}
                          </label>
                        ))}
                        {reshuyot.length === 0 && <span className="text-xs text-gray-400">ללא הגבלה</span>}
                      </div>
                    </td>
                    <td className="border px-2 py-1 text-center">
                      <button onClick={() => saveEdit(u.id)} className="text-green-600 text-xs hover:underline">שמור</button>
                      <button onClick={() => setEditId(null)} className="text-gray-500 text-xs hover:underline mr-2">ביטול</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border px-3 py-1">{u.email || u.display_name}</td>
                    <td className="border px-3 py-1">{u.role}</td>
                    <td className="border px-3 py-1 text-xs text-gray-600">
                      {u.allowed_reshuyot?.length
                        ? reshuyot.filter(r => u.allowed_reshuyot.includes(r.semel)).map(r => r.shem).join(', ')
                        : 'הכל'}
                    </td>
                    <td className="border px-2 py-1 text-center space-x-1">
                      <button onClick={() => { setEditId(u.id); setEditData({ role: u.role, allowed_reshuyot: u.allowed_reshuyot || [] }); }}
                        className="text-blue-600 text-xs hover:underline">עריכה</button>
                      <button onClick={() => handleDelete(u.id)} className="text-red-600 text-xs hover:underline mr-1">מחק</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="font-medium mb-2 text-sm">הוספת משתמש חדש</h3>
        <form onSubmit={handleCreate} className="space-y-2">
          <input required type="email" placeholder="דואר אלקטרוני"
            value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))}
            className="w-full border rounded px-3 py-1.5 text-sm text-right" />
          <input required type="password" placeholder="סיסמה"
            value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))}
            className="w-full border rounded px-3 py-1.5 text-sm text-right" />
          <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}
            className="w-full border rounded px-3 py-1.5 text-sm">
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {reshuyot.length > 0 && (
            <div className="border rounded px-3 py-2">
              <p className="text-xs text-gray-500 mb-1">רשויות מורשות (ריק = הכל)</p>
              <div className="flex gap-4">
                {reshuyot.map(r => (
                  <label key={r.semel} className="flex items-center gap-1 text-sm">
                    <input type="checkbox"
                      checked={newUser.allowed_reshuyot.includes(r.semel)}
                      onChange={() => setNewUser(u => ({
                        ...u,
                        allowed_reshuyot: toggleReshut(u.allowed_reshuyot, r.semel),
                      }))} />
                    {r.shem}
                  </label>
                ))}
              </div>
            </div>
          )}
          <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 text-sm">
            צור משתמש
          </button>
          {msg && <p className="text-sm">{msg}</p>}
        </form>
      </div>
    </div>
  );
}
