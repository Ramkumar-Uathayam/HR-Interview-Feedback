import React, { useEffect, useState } from 'react';
import { StallCompanyAddress } from '../types.ts';
import {
  deleteStallAddress,
  fetchStallAddresses,
  fetchStallSettings,
  saveStallAddress,
  saveStallSettings
} from '../services/stall.ts';

export const StallSettings: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [savedAmount, setSavedAmount] = useState('');
  const [companies, setCompanies] = useState<StallCompanyAddress[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newCompany, setNewCompany] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [settings, addresses] = await Promise.all([fetchStallSettings(), fetchStallAddresses()]);
      setAmount(settings.amount);
      setSavedAmount(settings.amount);
      setCompanies(addresses);
      setDrafts(Object.fromEntries(addresses.map(a => [a.company, a.address])));
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const run = async (key: string, action: () => Promise<unknown>, successText: string) => {
    setSavingKey(key);
    setMessage(null);
    try {
      await action();
      setMessage({ ok: true, text: successText });
      await load();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Save failed' });
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveAmount = () =>
    run('amount', async () => {
      const result = await saveStallSettings(amount);
      setAmount(result.amount);
    }, 'Amount saved. New prints will use it; reprints keep their original amount.');

  const handleAddCompany = () => {
    const name = newCompany.replace(/\s+/g, ' ').trim();
    if (!name || companies.some(c => c.company === name)) return;
    setCompanies(prev => [...prev, { company: name, address: '', employeeCount: 0 }]);
    setDrafts(prev => ({ ...prev, [name]: '' }));
    setNewCompany('');
  };

  if (loading && companies.length === 0) {
    return <p className="text-slate-400 font-bold py-10 text-center">Loading settings...</p>;
  }

  return (
    <div className="space-y-8">
      {message && (
        <div className={`p-4 rounded-2xl border font-bold text-sm ${message.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
        <h2 className="text-xl font-black text-slate-800">Coupon Amount</h2>
        <p className="text-sm text-slate-500 font-medium mt-1 mb-5">Printed on the slip and included in the QR code.</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-2xl font-black text-slate-400">₹</span>
          <input
            value={amount}
            onChange={e => setAmount(e.target.value)}
            inputMode="decimal"
            className="w-48 px-5 py-3 rounded-2xl border-2 border-slate-200 focus:border-slate-900 outline-none text-lg font-bold"
          />
          <button
            onClick={handleSaveAmount}
            disabled={savingKey !== null || amount === savedAmount}
            className="px-6 py-3 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-black rounded-2xl uppercase tracking-widest text-xs"
          >
            {savingKey === 'amount' ? 'Saving...' : 'Save Amount'}
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
        <h2 className="text-xl font-black text-slate-800">Company Addresses</h2>
        <p className="text-sm text-slate-500 font-medium mt-1 mb-6">
          The address printed below the company name. Companies from the imported list appear automatically; the name must match the Excel exactly.
        </p>

        <div className="space-y-5">
          {companies.map(c => {
            const draft = drafts[c.company] ?? '';
            const changed = draft.trim() !== c.address;
            return (
              <div key={c.company} className="p-5 rounded-2xl border border-slate-100 bg-slate-50">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <p className="font-black text-slate-800">{c.company}</p>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{c.employeeCount} employees</span>
                  {!c.address && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-1 rounded-lg">Address not set</span>
                  )}
                </div>
                <textarea
                  value={draft}
                  onChange={e => setDrafts(prev => ({ ...prev, [c.company]: e.target.value }))}
                  rows={3}
                  placeholder={'Door No, Street\nArea, City - PIN\nPhone'}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-900 outline-none text-sm font-medium bg-white"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => run(c.company, () => saveStallAddress(c.company, draft), `Address saved for ${c.company}`)}
                    disabled={savingKey !== null || !draft.trim() || !changed}
                    className="px-5 py-2 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-black rounded-xl uppercase tracking-widest text-[10px]"
                  >
                    {savingKey === c.company ? 'Saving...' : 'Save'}
                  </button>
                  {c.address && (
                    <button
                      onClick={() => run(c.company, () => deleteStallAddress(c.company), `Address removed for ${c.company}`)}
                      disabled={savingKey !== null}
                      className="px-5 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-black rounded-xl uppercase tracking-widest text-[10px]"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          <input
            value={newCompany}
            onChange={e => setNewCompany(e.target.value)}
            placeholder="Add company (e.g. B AND R TEXTILE - UNIT II)"
            className="flex-1 min-w-0 px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-900 outline-none text-sm font-bold uppercase"
          />
          <button
            onClick={handleAddCompany}
            disabled={!newCompany.trim()}
            className="px-5 py-3 bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-50 disabled:opacity-40 font-black rounded-xl uppercase tracking-widest text-[10px]"
          >
            Add Company
          </button>
        </div>
      </div>
    </div>
  );
};
