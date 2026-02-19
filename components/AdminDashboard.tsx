
import React, { useMemo, useState } from 'react';
import { InterviewFeedback, AIAnalysis } from '../types.ts';
import { QUESTIONS } from '../constants.ts';
import { analyzeFeedback } from '../services/gemini.ts';

interface AdminDashboardProps {
  feedbacks: InterviewFeedback[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ feedbacks }) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<InterviewFeedback | null>(null);

  const stats = useMemo(() => {
    const total = feedbacks.length;
    if (total === 0) return null;

    const averages = QUESTIONS.map(q => {
      const sum = feedbacks.reduce((acc, f) => acc + ((f.ratings as any)[q.id] || 0), 0);
      return {
        subject: q.en.substring(0, 15) + '...',
        fullSubject: q.en,
        A: (sum / total).toFixed(1)
      };
    });

    const netReferral = (feedbacks.filter(f => f.referral).length / total) * 100;

    return { averages, netReferral, total };
  }, [feedbacks]);

  const handleAIAnalysis = async () => {
    setLoading(true);
    try {
      const res = await analyzeFeedback(feedbacks);
      setAnalysis(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!stats) return <div className="p-10 text-center text-slate-500">No feedback entries yet.</div>;

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">HR Analytics Dashboard</h1>
          <p className="text-slate-500">Real-time processing of {stats.total} entries</p>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Responses</p>
          <h2 className="text-4xl font-black text-slate-800 mt-1">{stats.total}</h2>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Referral Intent</p>
          <h2 className="text-4xl font-black text-green-600 mt-1">{stats.netReferral.toFixed(0)}%</h2>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Avg Experience</p>
          <h2 className="text-4xl font-black text-blue-600 mt-1">
            {(feedbacks.reduce((acc, f) => acc + (f.ratings.q10_overall || 0), 0) / feedbacks.length).toFixed(1)}/5
          </h2>
        </div>
      </div>

      {analysis && (
        <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
             <div className="relative z-10">
               <div className="flex items-center gap-3 mb-6">
                 <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">✨</div>
                 <h3 className="text-2xl font-bold">Gemini AI Executive Review</h3>
               </div>
               <p className="text-lg text-indigo-100 mb-8 leading-relaxed max-w-4xl">{analysis.summary}</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                    <h4 className="font-bold text-green-300 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400"></span> Key Strengths
                    </h4>
                    <ul className="space-y-2 text-sm">
                      {analysis.strengths.slice(0, 3).map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                 </div>
                 <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                    <h4 className="font-bold text-amber-300 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span> Urgent Actions
                    </h4>
                    <ul className="space-y-2 text-sm">
                      {analysis.recommendations.slice(0, 3).map((r, i) => <li key={i}>• {r}</li>)}
                    </ul>
                 </div>
               </div>
             </div>
             <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
           </div>
        </div>
      )}

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Individual Entry Log</h3>
          <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">Click row for full report</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Candidate & Role</th>
                <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Date</th>
                <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Avg Rating</th>
                <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Referral</th>
                <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {feedbacks.map((f) => {
                const ratingsValues = Object.values(f.ratings) as number[];
                const avg = ratingsValues.reduce((a, b) => a + (b || 0), 0) / 10;
                return (
                  <tr 
                    key={f.id} 
                    onClick={() => setSelectedFeedback(f)}
                    className="hover:bg-slate-50 transition-all cursor-pointer group"
                  >
                    <td className="px-8 py-6">
                      <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{f.candidateName}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        {f.designation} • {f.department}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-slate-500 text-sm">{f.date}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${avg >= 4 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${(avg/5)*100}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-slate-600">{avg.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {f.referral ? 
                        <span className="text-green-600 bg-green-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Promoter</span> : 
                        <span className="text-red-500 bg-red-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Detractor</span>
                      }
                    </td>
                    <td className="px-8 py-6 text-slate-400 text-xs italic max-w-xs truncate">{f.qualitative || 'No comments'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedFeedback && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedFeedback(null)}></div>
          <div className="relative bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-2xl font-bold">{selectedFeedback.candidateName}</h3>
                <p className="text-slate-400 text-sm">{selectedFeedback.mobileNumber}</p>
              </div>
              <button onClick={() => setSelectedFeedback(null)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">✕</button>
            </div>
            
            <div className="p-8 overflow-y-auto">
              {/* Detailed Role Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Applied Level</label>
                  <p className="text-slate-800 font-black">{selectedFeedback.designation}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Applied Department</label>
                  <p className="text-slate-800 font-black">{selectedFeedback.department}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Current Address</label>
                <p className="text-slate-700 font-medium">{selectedFeedback.address}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                 {QUESTIONS.map(q => (
                   <div key={q.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 leading-tight">{q.en}</p>
                      <div className="flex items-center justify-between">
                         <span className="font-black text-xl text-slate-800">{(selectedFeedback.ratings as any)[q.id]}</span>
                         <div className="flex gap-1">
                            {[1,2,3,4,5].map(dot => (
                              <div key={dot} className={`w-1.5 h-1.5 rounded-full ${dot <= ((selectedFeedback.ratings as any)[q.id] || 0) ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                            ))}
                         </div>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 mb-6">
                <h4 className="text-indigo-800 font-bold mb-2 flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                   Qualitative Response
                </h4>
                <p className="text-slate-700 italic text-sm leading-relaxed">
                  "{selectedFeedback.qualitative || 'No descriptive comments provided.'}"
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl text-white">
                <span className="font-bold text-sm">Would refer B and B Textile?</span>
                <span className={`px-4 py-1 rounded-full font-black text-xs ${selectedFeedback.referral ? 'bg-green-500' : 'bg-red-500'}`}>
                   {selectedFeedback.referral ? 'YES (PROMOTER)' : 'NO (DETRACTOR)'}
                </span>
              </div>
            </div>
            
            <div className="p-8 pt-0 flex justify-end shrink-0">
               <button onClick={() => setSelectedFeedback(null)} className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all">Close Entry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
