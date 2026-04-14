// client/src/components/admin/UsersTab.jsx
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

const ROLES = ['viewer', 'admin'];

export default function UsersTab() {
  const qc = useQueryClient();
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'viewer' });
  const [msg, setMsg]         = useState('');

  const { data: users = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => api.get('/admin/users').then(r => r.data),
  });

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await api.post('/admin/users', newUser);
      setMsg('המשתמש נוצר בהצלחה');
      setNewUser({ email: '', password: '', role: 'viewer' });
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

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h3 className="font-medium mb-2 text-sm">משתמשים קיימים</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-3 py-1 text-right">דואל</th>
              <th className="border px-3 py-1 text-right">תפקיד</th>
              <th className="border px-2 py-1 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="border px-3 py-1">{u.email || u.display_name}</td>
                <td className="border px-3 py-1">{u.role}</td>
                <td className="border px-2 py-1 text-center">
                  <button onClick={() => handleDelete(u.id)} className="text-red-600 text-xs hover:underline">מחק</button>
                </td>
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
          <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 text-sm">
            צור משתמש
          </button>
          {msg && <p className="text-sm">{msg}</p>}
        </form>
      </div>
    </div>
  );
}
