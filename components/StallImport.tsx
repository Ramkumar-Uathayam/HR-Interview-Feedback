import React, { useEffect, useRef, useState } from 'react';
import { read, utils, writeFile } from 'xlsx';
import { StallImportRow } from '../types.ts';
import { STALL_CODE_PATTERN, fetchStallAddresses, fetchStallEmployees, importStallEmployees, normalizeEmpCode } from '../services/stall.ts';

interface StallImportProps {
  onImported: () => void;
}

// Excel headers are matched loosely: "Emp Code", "EMPCODE", "Employee ID" all map to empCode.
const HEADER_MAP: Record<string, keyof StallImportRow> = {
  empcode: 'empCode', employeecode: 'empCode', empid: 'empCode', employeeid: 'empCode', code: 'empCode',
  empname: 'empName', employeename: 'empName', name: 'empName',
  company: 'company', companyname: 'company', unit: 'company',
  department: 'department', dept: 'department', departmentname: 'department'
};

const clean = (v: unknown) => String(v ?? '').replace(/\s+/g, ' ').trim();

interface ParsedFile {
  fileName: string;
  rows: StallImportRow[];
  errors: string[];
  companies: { name: string; count: number; hasAddress: boolean }[];
}

export const StallImport: React.FC<StallImportProps> = ({ onImported }) => {
  const [current, setCurrent] = useState<{ total: number; printed: number } | null>(null);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadCurrent = async () => {
    try {
      const rows = await fetchStallEmployees();
      setCurrent({ total: rows.length, printed: rows.filter(r => r.isPrinted).length });
    } catch {
      setCurrent(null);
    }
  };

  useEffect(() => { loadCurrent(); }, []);

  const handleTemplate = () => {
    const ws = utils.aoa_to_sheet([
      ['EmpCode', 'EmpName', 'Company', 'Department'],
      ['E25-02217', 'GEETHA Y', 'B AND B TEXTILE - UNIT I', 'READYMADE']
    ]);
    ws['!cols'] = [{ wch: 12 }, { wch: 28 }, { wch: 30 }, { wch: 20 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Employees');
    writeFile(wb, 'Stall_Employee_Template.xlsx');
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);
    setConfirming(false);

    try {
      const workbook = read(await file.arrayBuffer());
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw = utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false });

      const rows: StallImportRow[] = [];
      const errors: string[] = [];
      const seen = new Map<string, number>();

      raw.forEach((record, index) => {
        const row: StallImportRow = { empCode: '', empName: '', company: '', department: '' };
        Object.entries(record).forEach(([header, value]) => {
          const key = HEADER_MAP[header.toLowerCase().replace(/[^a-z]/g, '')];
          if (key) row[key] = clean(value);
        });
        row.empCode = normalizeEmpCode(row.empCode);

        if (!row.empCode && !row.empName && !row.company && !row.department) return; // blank line
        const excelRow = index + 2; // header is row 1
        const missing = (Object.keys(row) as (keyof StallImportRow)[]).filter(k => !row[k]);
        if (missing.length > 0) {
          errors.push(`Row ${excelRow}: missing ${missing.join(', ')}`);
        } else if (!STALL_CODE_PATTERN.test(row.empCode)) {
          errors.push(`Row ${excelRow}: invalid EmpCode "${row.empCode}"`);
        } else if (seen.has(row.empCode)) {
          errors.push(`Row ${excelRow}: duplicate EmpCode ${row.empCode} (also row ${seen.get(row.empCode)})`);
        } else {
          seen.set(row.empCode, excelRow);
        }
        rows.push(row);
      });

      if (rows.length === 0) {
        errors.push('No data rows found. Expected columns: EmpCode, EmpName, Company, Department.');
      }

      let addressed = new Set<string>();
      try {
        addressed = new Set((await fetchStallAddresses()).filter(a => a.address).map(a => a.company));
      } catch {
        // address check is advisory only
      }
      const counts = new Map<string, number>();
      rows.forEach(r => r.company && counts.set(r.company, (counts.get(r.company) || 0) + 1));

      setParsed({
        fileName: file.name,
        rows,
        errors,
        companies: Array.from(counts.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([name, count]) => ({ name, count, hasAddress: addressed.has(name) }))
      });
    } catch (err) {
      setParsed(null);
      setMessage({ ok: false, text: 'Could not read the Excel file. Please check the format.' });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (!parsed) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await importStallEmployees(parsed.rows);
      setMessage({ ok: true, text: `Import complete: ${result.deleted} old rows deleted, ${result.imported} new rows imported. All employees are now pending print.` });
      setParsed(null);
      setConfirming(false);
      await loadCurrent();
      onImported();
    } catch (e) {
      setMessage({ ok: false, text: `Import failed, old data is unchanged. ${e instanceof Error ? e.message : ''}` });
    } finally {
      setBusy(false);
    }
  };

  const canImport = parsed && parsed.errors.length === 0 && parsed.rows.length > 0;

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-2xl border font-bold text-sm ${message.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
        <h2 className="text-xl font-black text-slate-800">Replace Employee List</h2>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Upload an Excel file with columns <b>EmpCode, EmpName, Company, Department</b>. Importing deletes the current list and resets everyone to pending.
        </p>
        {current && (
          <p className="text-sm font-bold text-slate-700 mt-4">
            Current list: {current.total} employees ({current.printed} printed, {current.total - current.printed} pending)
          </p>
        )}
        <div className="flex flex-wrap gap-3 mt-6">
          <label className="px-6 py-3 bg-slate-900 hover:bg-black text-white font-black rounded-2xl uppercase tracking-widest text-xs cursor-pointer">
            Choose Excel File
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
          </label>
          <button onClick={handleTemplate} className="px-6 py-3 bg-white border-2 border-slate-200 hover:border-slate-900 font-black rounded-2xl uppercase tracking-widest text-xs">
            Download Template
          </button>
        </div>
      </div>

      {parsed && (
        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-800">{parsed.fileName}</h3>
            <p className="text-sm font-bold text-slate-500">{parsed.rows.length} rows found</p>
          </div>

          {parsed.errors.length > 0 && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
              <p className="font-black text-red-700 text-sm mb-2">{parsed.errors.length} problem(s) — fix the Excel and upload again:</p>
              <ul className="text-xs font-bold text-red-700 space-y-1 max-h-48 overflow-y-auto">
                {parsed.errors.slice(0, 100).map(err => <li key={err}>{err}</li>)}
              </ul>
            </div>
          )}

          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Companies</p>
            <div className="flex flex-wrap gap-2">
              {parsed.companies.map(c => (
                <span key={c.name} className={`px-3 py-2 rounded-xl text-xs font-bold border ${c.hasAddress ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                  {c.name} · {c.count}{!c.hasAddress && ' · no address yet'}
                </span>
              ))}
            </div>
            {parsed.companies.some(c => !c.hasAddress) && (
              <p className="text-xs font-bold text-amber-700 mt-2">Set the missing addresses in Settings before printing.</p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="py-2 pr-4">EmpCode</th><th className="py-2 pr-4">EmpName</th><th className="py-2 pr-4">Company</th><th className="py-2">Department</th>
                </tr>
              </thead>
              <tbody>
                {parsed.rows.slice(0, 10).map((r, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-2 pr-4 font-bold">{r.empCode}</td><td className="py-2 pr-4">{r.empName}</td><td className="py-2 pr-4 text-xs">{r.company}</td><td className="py-2 text-xs">{r.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.rows.length > 10 && <p className="text-xs text-slate-400 font-bold mt-2">Showing first 10 of {parsed.rows.length}</p>}
          </div>

          {canImport && !confirming && (
            <button onClick={() => setConfirming(true)} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl uppercase tracking-widest text-xs">
              Delete Old Data &amp; Import {parsed.rows.length} Rows
            </button>
          )}

          {canImport && confirming && (
            <div className="p-5 rounded-2xl bg-red-50 border border-red-200">
              <p className="font-black text-red-700 text-sm">
                This deletes all {current?.total ?? 'existing'} current employees
                {current ? ` (${current.printed} already printed)` : ''} and imports {parsed.rows.length} new rows. Everyone becomes pending again.
              </p>
              <div className="flex gap-3 mt-4">
                <button onClick={handleImport} disabled={busy} className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-black rounded-2xl uppercase tracking-widest text-xs">
                  {busy ? 'Importing...' : 'Yes, Replace Data'}
                </button>
                <button onClick={() => setConfirming(false)} disabled={busy} className="px-6 py-3 bg-white border-2 border-slate-200 font-black rounded-2xl uppercase tracking-widest text-xs">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
