// client/src/pages/StudentSearch.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import StudentTable from '../components/StudentTable';

export default function StudentSearch() {
  const [search, setSearch] = useState('');
  const [page,   setPage]   = useState(1);
  const [q,      setQ]      = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['students', q, page],
    queryFn: () =>
      api.get('/students', { params: { q, page } }).then(r => r.data),
    keepPreviousData: true,
  });

  function handleSearch(e) {
    e.preventDefault();
    setQ(search);
    setPage(1);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-xl font-bold mb-4">חיפוש תלמידים</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חפש לפי שם..."
          className="flex-1 border rounded-lg px-3 py-2 text-right"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
        >
          חפש
        </button>
      </form>

      <StudentTable students={data?.data ?? []} loading={isLoading} />

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            הקודם
          </button>
          <span className="px-3 py-1">עמוד {page} מתוך {data.totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            הבא
          </button>
        </div>
      )}
    </div>
  );
}
