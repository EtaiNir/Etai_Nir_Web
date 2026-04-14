// client/src/pages/StudentRecord.jsx
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

const HIDDEN = ['id', 'council_id', 'updated_at'];

function splitFields(student, baseStudent) {
  if (!baseStudent) return { main: Object.keys(student).filter(k => !HIDDEN.includes(k)), extra: [] };
  const baseKeys = new Set(Object.keys(baseStudent));
  const main  = Object.keys(student).filter(k => baseKeys.has(k)  && !HIDDEN.includes(k));
  const extra = Object.keys(student).filter(k => !baseKeys.has(k) && !HIDDEN.includes(k));
  return { main, extra };
}

export default function StudentRecord() {
  const { id } = useParams();
  const [showFull, setShowFull] = useState(false);

  const { data: base, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => api.get(`/students/${id}`).then(r => r.data),
  });

  const { data: full } = useQuery({
    queryKey: ['student', id, 'full'],
    queryFn: () => api.get(`/students/${id}?full=true`).then(r => r.data),
    enabled: showFull,
  });

  if (isLoading) return <p className="p-8 text-center">טוען...</p>;
  if (!base)     return <p className="p-8 text-center text-red-600">רשומה לא נמצאה</p>;

  const student = showFull && full ? full : base;
  const { main, extra } = splitFields(student, base);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <Link to="/" className="text-blue-600 hover:underline text-sm">→ חזרה לחיפוש</Link>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFull(v => !v)}
            className="text-sm bg-blue-50 border border-blue-300 px-3 py-1.5 rounded hover:bg-blue-100"
          >
            {showFull ? 'הסתר נתונים נוספים ▲' : 'הצג נתונים נוספים ▼'}
          </button>
          <button onClick={() => window.print()}
            className="bg-gray-100 border px-4 py-1.5 rounded hover:bg-gray-200 text-sm">
            הדפסה
          </button>
        </div>
      </div>

      <h1 className="text-xl font-bold mb-4">
        {base['שם משפחה']} {base['שם פרטי']}
      </h1>

      <div className="grid grid-cols-2 gap-x-8 gap-y-1 print:grid-cols-2">
        {main.map(col => (
          <div key={col} className="flex gap-2 border-b py-1">
            <span className="font-medium w-48 shrink-0 text-gray-600 text-sm">{col}:</span>
            <span className="text-sm">{student[col] ?? '—'}</span>
          </div>
        ))}
      </div>

      {showFull && extra.length > 0 && (
        <div className="mt-6">
          <h2 className="text-base font-bold mb-2 text-blue-800 border-b-2 border-blue-200 pb-1">
            נתונים נוספים
          </h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 bg-blue-50 rounded-lg p-4 print:grid-cols-2">
            {extra.map(col => (
              <div key={col} className="flex gap-2 border-b border-blue-100 py-1">
                <span className="font-medium w-48 shrink-0 text-blue-700 text-sm">{col}:</span>
                <span className="text-sm">{student[col] ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
