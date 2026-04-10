// client/src/components/StudentTable.jsx
import { Link } from 'react-router-dom';

export default function StudentTable({ students, loading }) {
  if (loading) return <p className="text-center py-8">טוען...</p>;
  if (!students.length) return <p className="text-center py-8 text-gray-500">לא נמצאו תלמידים</p>;

  // Show first 8 columns as preview — excludes internal fields
  const previewCols = Object.keys(students[0]).filter(
    k => !['id', 'council_id', 'updated_at'].includes(k)
  ).slice(0, 8);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {previewCols.map(col => (
              <th key={col} className="border px-3 py-2 text-right font-medium">{col}</th>
            ))}
            <th className="border px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s.id} className="hover:bg-blue-50">
              {previewCols.map(col => (
                <td key={col} className="border px-3 py-1.5">{s[col] ?? ''}</td>
              ))}
              <td className="border px-3 py-1.5 text-center">
                <Link to={`/students/${s.id}`} className="text-blue-600 hover:underline">
                  פתח
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
