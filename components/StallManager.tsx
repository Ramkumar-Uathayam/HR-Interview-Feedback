import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { StallPrintSlip } from '../types.ts';
import { StallApiError, normalizeEmpCode, printStallEmployee } from '../services/stall.ts';
import { StallSlip } from './StallSlip.tsx';
import { StallReport } from './StallReport.tsx';
import { StallImport } from './StallImport.tsx';
import { StallSettings } from './StallSettings.tsx';

type StallTab = 'print' | 'report' | 'import' | 'settings';

type Notice =
  | { kind: 'success' | 'error'; text: string }
  | { kind: 'already-printed'; text: string; empCode: string };

const TABS: { id: StallTab; label: string }[] = [
  { id: 'print', label: 'Print' },
  { id: 'report', label: 'Report' },
  { id: 'import', label: 'Import' },
  { id: 'settings', label: 'Settings' }
];

// Prints exactly one 90mm x 42mm label. The label is portalled to <body> and every other
// body child is removed from layout, so the rest of the page can't spill onto extra labels.
const PRINT_CSS = `
#stall-print-root { display: none; }
@media print {
  @page { size: 90mm 42mm; margin: 0; }
  html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
  body > *:not(#stall-print-root) { display: none !important; }
  #stall-print-root { display: block; }
  #stall-print-root, #stall-print-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

export const StallManager: React.FC = () => {
  const [tab, setTab] = useState<StallTab>('print');
  const [empCode, setEmpCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [slip, setSlip] = useState<{ data: StallPrintSlip; printedAt: Date; seq: number } | null>(null);
  const [autoPrint, setAutoPrint] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!slip || !autoPrint) return;
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, [slip?.seq]);

  useEffect(() => {
    if (tab === 'print') inputRef.current?.focus();
  }, [tab]);

  const printEmployee = async (rawCode: string, reprint: boolean) => {
    const code = normalizeEmpCode(rawCode);
    if (!code) return;

    setBusy(true);
    setNotice(null);
    try {
      const data = await printStallEmployee(code, reprint);
      setSlip(prev => ({ data, printedAt: new Date(), seq: (prev?.seq ?? 0) + 1 }));
      setNotice({
        kind: 'success',
        text: reprint ? `Reprint ready for ${data.empName} (${data.empCode})` : `Printed ${data.empName} (${data.empCode})`
      });
      setEmpCode('');
      setRefreshKey(k => k + 1);
    } catch (e) {
      if (e instanceof StallApiError && e.status === 404) {
        setNotice({ kind: 'error', text: `Employee ${code} not found in the current list.` });
      } else if (e instanceof StallApiError && e.body?.error === 'ALREADY_PRINTED') {
        const emp = e.body.employee;
        setNotice({
          kind: 'already-printed',
          empCode: emp.empCode,
          text: `${emp.empName} (${emp.empCode}) was already printed on ${emp.printDateTime}.` +
            (emp.reprintCount ? ` Reprinted ${emp.reprintCount} time(s).` : '')
        });
      } else if (e instanceof StallApiError && e.body?.error === 'NOT_PRINTED_YET') {
        setNotice({ kind: 'error', text: `${code} has not been printed yet. Use Print instead of Reprint.` });
      } else {
        setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Print failed' });
      }
    } finally {
      setBusy(false);
      setTab('print');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    printEmployee(empCode, false);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <style>{PRINT_CSS}</style>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Stall QR Printing</h1>
          <p className="text-slate-500 font-medium mt-1">Print employee stall coupons, track reprints and manage company addresses.</p>
        </div>
        <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-2xl self-start">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${
                tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'print' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 self-start">
            <form onSubmit={handleSubmit}>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Employee ID</label>
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  value={empCode}
                  onChange={e => setEmpCode(e.target.value)}
                  placeholder="E25-02217 or E2502217"
                  autoFocus
                  className="flex-1 px-5 py-4 rounded-2xl border-2 border-slate-200 focus:border-slate-900 outline-none text-lg font-bold uppercase"
                />
                <button
                  type="submit"
                  disabled={busy || !empCode.trim()}
                  className="px-8 py-4 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-black rounded-2xl uppercase tracking-widest text-sm transition-all active:scale-95"
                >
                  {busy ? '...' : 'Print'}
                </button>
              </div>
              <label className="flex items-center gap-2 mt-4 text-sm font-bold text-slate-600 cursor-pointer select-none">
                <input type="checkbox" checked={autoPrint} onChange={e => setAutoPrint(e.target.checked)} className="w-4 h-4" />
                Open print dialog automatically
              </label>
            </form>

            {notice && (
              <div
                className={`mt-6 p-4 rounded-2xl border font-bold text-sm ${
                  notice.kind === 'success' ? 'bg-green-50 border-green-200 text-green-800'
                    : notice.kind === 'already-printed' ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                <p>{notice.text}</p>
                {notice.kind === 'already-printed' && (
                  <button
                    onClick={() => printEmployee(notice.empCode, true)}
                    disabled={busy}
                    className="mt-3 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-widest"
                  >
                    Reprint (marked as REPRINT)
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col items-center">
            {slip ? (
              <>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Label preview · 90 × 42 mm</p>
                <div className="outline outline-1 outline-slate-300 shadow-lg">
                  <StallSlip slip={slip.data} printedAt={slip.printedAt} />
                </div>
                {createPortal(
                  <div id="stall-print-root">
                    <StallSlip slip={slip.data} printedAt={slip.printedAt} />
                  </div>,
                  document.body
                )}
                <button
                  onClick={() => window.print()}
                  className="mt-6 px-8 py-3 bg-slate-900 hover:bg-black text-white font-black rounded-2xl uppercase tracking-widest text-xs"
                >
                  Open Print Dialog
                </button>
              </>
            ) : (
              <p className="text-slate-400 font-bold py-20">Slip preview appears here after printing.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'report' && <StallReport refreshKey={refreshKey} onPrint={printEmployee} />}
      {tab === 'import' && <StallImport onImported={() => setRefreshKey(k => k + 1)} />}
      {tab === 'settings' && <StallSettings />}
    </div>
  );
};
