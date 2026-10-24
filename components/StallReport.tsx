import React, { useEffect, useMemo, useState } from 'react';
import { utils, writeFile } from 'xlsx';
import { StallEmployee } from '../types.ts';
import { fetchStallEmployees } from '../services/stall.ts';

interface StallReportProps {
  refreshKey: number;
  onPrint: (empCode: string, reprint: boolean) => void;
}

type StatusFilter = 'all' | 'printed' | 'pending' | 'reprinted';

export const StallReport: React.FC<StallReportProps> = ({ refreshKey, onPrint }) => {
  const [rows, setRows] = useState<StallEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [company, setCompany] = useState('all');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchStallEmployees());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [refreshKey]);

  const companies = useMemo(() => Array.from(new Set(rows.map(r => r.company))).sort(), [rows]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter(r =>
      (company === 'all' || r.company === company) &&
      (status === 'all'
        || (status === 'printed' && r.isPrinted)
        || (status === 'pending' && !r.isPrinted)
        || (status === 'reprinted' && r.reprintCount > 0)) &&
      (!term || [r.empCode, r.empName, r.department].some(v => v?.toLowerCase().includes(term)))
    );
  }, [rows, search, status, company]);

  const scope = company === 'all' ? rows : rows.filter(r => r.company === company);
  const stats = [
    { label: 'Total', value: scope.length, tone: 'text-slate-800' },
    { label: 'Printed', value: scope.filter(r => r.isPrinted).length, tone: 'text-green-600' },
    { label: 'Pending', value: scope.filter(r => !r.isPrinted).length, tone: 'text-amber-600' },
    { label: 'Reprints', value: scope.reduce((sum, r) => sum + r.reprintCount, 0), tone: 'text-red-600' }
  ];

  const handleExport = () => {
    const data = filtered.map(r => ({
      'Emp Code': r.empCode,
      'Emp Name': r.empName,
      'Company': r.company,
      'Department': r.department,
      'Status': r.isPrinted ? 'Printed' : 'Pending',
      'Print Date': r.printDateTime || '',
      'Reprint Count': r.reprintCount
    }));
    const wb = utils.book_new();
    utils.book_append_sheet(wb, utils.json_to_sheet(data), 'Stall Print Report');
    writeFile(wb, `Stall_Print_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
            <p className={`text-3xl font-black mt-1 ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
        <div className="flex flex-wrap gap-3 mb-5">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search code, name, department"
            className="flex-1 min-w-[200px] px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-900 outline-none text-sm font-bold"
          />
          <select value={company} onChange={e => setCompany(e.target.value)} className="px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-bold bg-white">
            <option value="all">All companies</option>
            {companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value as StatusFilter)} className="px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-bold bg-white">
            <option value="all">All status</option>
            <option value="printed">Printed</option>
            <option value="pending">Pending</option>
            <option value="reprinted">Reprinted</option>
          </select>
          <button onClick={load} className="px-5 py-3 bg-white border-2 border-slate-200 hover:border-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest">
            Refresh
          </button>
          <button onClick={handleExport} disabled={filtered.length === 0} className="px-5 py-3 bg-green-700 hover:bg-green-800 disabled:bg-slate-300 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
            Export Excel
          </button>
        </div>

        {error && <p className="p-4 mb-4 rounded-xl bg-red-50 text-red-700 font-bold text-sm">{error}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="py-3 pr-4">Emp Code</th>
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Company</th>
                <th className="py-3 pr-4">Department</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Print Date</th>
                <th className="py-3 pr-4 text-center">Reprints</th>
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.empCode} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-3 pr-4 font-bold text-slate-800 whitespace-nowrap">{r.empCode}</td>
                  <td className="py-3 pr-4 font-bold text-slate-700">{r.empName}</td>
                  <td className="py-3 pr-4 text-slate-500 text-xs">{r.company}</td>
                  <td className="py-3 pr-4 text-slate-500 text-xs">{r.department}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${r.isPrinted ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      {r.isPrinted ? 'Printed' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-500 text-xs whitespace-nowrap">{r.printDateTime || '—'}</td>
                  <td className="py-3 pr-4 text-center font-black text-red-600">{r.reprintCount || ''}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => onPrint(r.empCode, r.isPrinted)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white ${r.isPrinted ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-900 hover:bg-black'}`}
                    >
                      {r.isPrinted ? 'Reprint' : 'Print'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <p className="text-center text-slate-400 font-bold py-10">No employees match the filters.</p>
          )}
          {loading && <p className="text-center text-slate-400 font-bold py-10">Loading...</p>}
        </div>
      </div>
    </div>
  );
};
