// client/src/pages/StudentRecord.jsx
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

const HIDDEN_COLS = ['id', 'council_id', 'updated_at'];

export default function StudentRecord() {
  const { id } = useParams();

  const { data: student, isLoading, error } = useQuery({
    queryKey: ['student', id],
    queryFn: () => api.get(`/students/${id}`).then(r => r.data),
  });

  if (isLoading) return <p className="p-8 text-center">טוען...</p>;
  if (error)     return <p className="p-8 text-center text-red-600">שגיאה בטעינת הרשומה</p>;

  const cols = Object.keys(student).filter(k => !HIDDEN_COLS.includes(k));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <Link to="/" className="text-blue-600 hover:underline text-sm">→ חזרה לחיפוש</Link>
        <button
          onClick={() => window.print()}
          className="bg-gray-100 border px-4 py-1.5 rounded hover:bg-gray-200 text-sm"
        >
          הדפסה
        </button>
      </div>

      <h1 className="text-xl font-bold mb-4">פרטי תלמיד</h1>

      <div className="grid grid-cols-2 gap-x-8 gap-y-2 print:grid-cols-2">
        {cols.map(col => (
          <div key={col} className="flex gap-2 border-b py-1.5">
            <span className="font-medium w-48 shrink-0 text-gray-600">{col}:</span>
            <span>{student[col] ?? '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
