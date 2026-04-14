// client/src/pages/StudentSearch.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import StudentTable from '../components/StudentTable';
import FilterBar from '../components/FilterBar';

const EMPTY_FILTERS = { q: '', mosad: '', shkhava: '', makhbila: '', yishuv: '', col1: '', val1: '', col2: '', val2: '' };

export default function StudentSearch() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const { data: filterOptions = {} } = useQuery({
    queryKey: ['studentFilters'],
    queryFn: () => api.get('/students/filters').then(r => r.data),
    staleTime: 10 * 60 * 1000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['students', filters, page],
    queryFn: () => api.get('/students', { params: { ...filters, page } }).then(r => r.data),
    keepPreviousData: true,
  });

  const allColumns = data?.data?.[0]
    ? Object.keys(data.data[0]).filter(k => !['id', 'council_id'].includes(k))
    : [];

  function handleFilterChange(newFilters) {
    setFilters(newFilters);
    setPage(1);
  }

  async function handleExportExcel() {
    const { default: XLSX } = await import('xlsx');
    const { data: rows } = await api.get('/students/export', { params: filters });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'תלמידים');
    XLSX.writeFile(wb, `תלמידים_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async function handleExportPdf() {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const { data: rows } = await api.get('/students/export', { params: filters });

    const previewCols = ['שם משפחה', 'שם פרטי', 'מספר זהות', 'שם מוסד', 'שכבה', 'מקבילה'];
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFont('helvetica');
    doc.text(`תלמידים — ${new Date().toLocaleDateString('he-IL')}  (${rows.length} רשומות)`, 14, 14);
    autoTable(doc, {
      head: [previewCols],
      body: rows.map(r => previewCols.map(c => r[c] ?? '')),
      startY: 20,
    });
    doc.save(`תלמידים_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-lg font-bold mb-2">חיפוש תלמידים</h1>

      <FilterBar
        filters={filters}
        filterOptions={filterOptions}
        onFilterChange={handleFilterChange}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
        allColumns={allColumns}
      />

      <StudentTable students={data?.data ?? []} loading={isLoading} />

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1 border rounded text-sm disabled:opacity-40">הקודם</button>
          <span className="px-3 py-1 text-sm">
            עמוד {page} מתוך {data.totalPages} ({data.total} רשומות)
          </span>
          <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}
            className="px-3 py-1 border rounded text-sm disabled:opacity-40">הבא</button>
        </div>
      )}
    </div>
  );
}
