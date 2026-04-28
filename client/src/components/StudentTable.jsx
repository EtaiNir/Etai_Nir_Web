// client/src/components/StudentTable.jsx
import { Link } from 'react-router-dom';

const COLUMNS = [
  { key: 'מספר זהות',  label: 'מספר זהות' },
  { key: 'שם מלא',     label: 'שם מלא'     },
  { key: 'שכבה',       label: 'שכבה'       },
  { key: 'מקבילה',     label: 'כיתה'       },
  { key: 'שם מוסד',    label: 'מוסד'       },
  { key: 'ישוב מוסד',  label: 'ישוב'       },
];

export default function StudentTable({ students, loading }) {
  if (loading) return <p className="text-center py-8">טוען...</p>;
  if (!students.length) return <p className="text-center py-8 text-gray-500">לא נמצאו תלמידים</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {COLUMNS.map(col => (
              <th key={col.key} className="border px-3 py-2 text-right font-medium">{col.label}</th>
            ))}
            <th className="border px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s.id} className="hover:bg-blue-50">
              {COLUMNS.map(col => (
                <td key={col.key} className="border px-3 py-1.5">
                  {col.key === 'שם מלא'
                    ? `${s['שם משפחה'] ?? ''} ${s['שם פרטי'] ?? ''}`.trim()
                    : s[col.key] ?? ''}
                </td>
              ))}
              <td className="border px-3 py-1.5 text-center">
                <Link to={`/students/${s.id}`} className="text-blue-600 hover:underline">פתח</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
