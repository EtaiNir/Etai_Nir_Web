// client/src/pages/Admin.jsx
import { useState } from 'react';
import ImportTab   from '../components/admin/ImportTab';
import RefTableTab from '../components/admin/RefTableTab';
import UsersTab    from '../components/admin/UsersTab';

const TABS = [
  { key: 'import', label: 'ייבוא נתונים' },
  { key: 'ref',    label: 'טבלאות עזר' },
  { key: 'users',  label: 'ניהול משתמשים' },
];

export default function Admin() {
  const [tab, setTab] = useState('import');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold mb-4">לוח ניהול</h1>

      <div className="flex gap-1 border-b mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'import' && <ImportTab />}
      {tab === 'ref'    && <RefTableTab />}
      {tab === 'users'  && <UsersTab />}
    </div>
  );
}
