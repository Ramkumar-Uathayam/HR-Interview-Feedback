import React from 'react';
import { QuizResult } from '../types.ts';
import { Trophy, Medal, Award } from 'lucide-react';

interface LiveResultsProps {
  results: QuizResult[];
  availableSets: string[];
  activeSet: string;
  onSetChange: (set: string) => void;
  onStart: () => void;
  isQuizActive: boolean;
}

export const LiveResults: React.FC<LiveResultsProps> = ({ 
  results, 
  availableSets, 
  activeSet, 
  onSetChange, 
  onStart,
  isQuizActive
}) => {
//   const filteredResults = results.filter(r => {
//     // Filter by the selected set
//     return r.set === activeSet;
//   });

//   const sortedResults = [...filteredResults].sort((a, b) => b.score - a.score).slice(0, 50);
  const sortedResults = [...results].sort((a, b) => b.score - a.score);

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">Live Leaderboard</h2>
          <p className="text-slate-500 font-medium">Real-time rankings of all participants</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-3 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex flex-col">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3 mb-1">Start as Set</span>
            <select
              value={activeSet}
              onChange={(e) => onSetChange(e.target.value)}
              className="bg-slate-50 border-none outline-none px-4 py-2 rounded-xl font-black text-indigo-600 text-sm appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
            >
              {availableSets.map(set => (
                <option key={set} value={set}>SET {set}</option>
              ))}
            </select>
          </div>
          
          {isQuizActive && (
            <button
              onClick={onStart}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg active:scale-95 uppercase tracking-widest text-xs"
            >
              Start Quiz
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Participant</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Set</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Accuracy</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedResults.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-medium italic">
                    No results recorded yet. Be the first to participate!
                  </td>
                </tr>
              ) : (
                sortedResults.map((result, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        {index === 0 && <Trophy className="w-5 h-5 text-amber-500" />}
                        {index === 1 && <Medal className="w-5 h-5 text-slate-400" />}
                        {index === 2 && <Award className="w-5 h-5 text-amber-700" />}
                        <span className={`font-black text-lg ${index < 3 ? 'text-indigo-600' : 'text-slate-400'}`}>
                          #{index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div>
                        <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{result.username}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{result.mobileNumber.replace(/.(?=.{4})/g, '*')}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-block px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        SET {result.set}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-black text-xl text-slate-700">{result.score}</span>
                      <span className="text-slate-400 font-bold text-sm ml-1">/ {result.totalQuestions}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="inline-flex items-center px-4 py-1.5 bg-indigo-50 rounded-full">
                        <span className="text-indigo-600 font-black text-sm">
                          {Math.round((result.score / result.totalQuestions) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {new Date(result.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
