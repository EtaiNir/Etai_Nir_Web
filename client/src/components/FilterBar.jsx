// client/src/components/FilterBar.jsx
import { useState } from 'react';

export default function FilterBar({ filters, filterOptions, onFilterChange, onExportExcel, onExportPdf, allColumns }) {
  const [advanced, setAdvanced] = useState(false);

  function handleQuick(key, val) {
    onFilterChange({ ...filters, [key]: val, page: 1 });
  }

  function handleAdvanced(key, val) {
    onFilterChange({ ...filters, [key]: val, page: 1 });
  }

  function clearAll() {
    onFilterChange({ q: '', mosad: '', shkhava: '', makhbila: '', yishuv: '', col1: '', val1: '', col2: '', val2: '', page: 1 });
  }

  const activeCount = ['q','mosad','shkhava','makhbila','yishuv','col1','col2']
    .filter(k => filters[k]).length;

  return (
    <div className="bg-white border rounded-lg p-2 mb-3 space-y-2">
      {/* Row 1 — quick filters */}
      <div className="flex gap-2 items-center flex-wrap">
        <input
          value={filters.q}
          onChange={e => handleQuick('q', e.target.value)}
          placeholder="חיפוש שם..."
          className="border rounded px-2 py-1 text-sm w-36 text-right"
        />
        {[
          { key: 'mosad',    label: 'מוסד',   opts: filterOptions.mosadot   },
          { key: 'shkhava',  label: 'שכבה',   opts: filterOptions.shkavot   },
          { key: 'makhbila', label: 'מקבילה', opts: filterOptions.makhvilot },
          { key: 'yishuv',   label: 'ישוב',   opts: filterOptions.yishuvim  },
        ].map(({ key, label, opts = [] }) => (
          <select
            key={key}
            value={filters[key]}
            onChange={e => handleQuick(key, e.target.value)}
            className="border rounded px-2 py-1 text-sm text-right bg-white"
          >
            <option value="">כל {label}</option>
            {opts.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}

        <button
          onClick={() => setAdvanced(v => !v)}
          className="text-xs text-blue-600 hover:underline mr-auto"
        >
          {advanced ? 'סגור חיפוש מתקדם ▲' : 'חיפוש מתקדם ▼'}
        </button>

        {activeCount > 0 && (
          <button onClick={clearAll} className="text-xs text-red-600 hover:underline">
            נקה הכל ({activeCount})
          </button>
        )}

        <button onClick={onExportExcel} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
          Excel ↓
        </button>
        <button onClick={onExportPdf} className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">
          PDF ↓
        </button>
      </div>

      {/* Row 2 — advanced search (collapsed by default) */}
      {advanced && (
        <div className="flex gap-2 items-center border-t pt-2 flex-wrap">
          {[
            { selKey: 'col1', valKey: 'val1', color: 'blue' },
            { selKey: 'col2', valKey: 'val2', color: 'purple' },
          ].map(({ selKey, valKey, color }) => (
            <div key={selKey} className="flex gap-1">
              <select
                value={filters[selKey]}
                onChange={e => handleAdvanced(selKey, e.target.value)}
                className={`border border-${color}-300 rounded px-2 py-1 text-xs bg-white text-right`}
              >
                <option value="">בחר עמודה...</option>
                {allColumns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                value={filters[valKey]}
                onChange={e => handleAdvanced(valKey, e.target.value)}
                placeholder="ערך..."
                disabled={!filters[selKey]}
                className={`border border-${color}-300 rounded px-2 py-1 text-xs w-28 disabled:opacity-40 text-right`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
