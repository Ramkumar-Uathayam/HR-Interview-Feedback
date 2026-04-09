import React, { useState, useRef } from 'react';
import { QuizQuestion, QuizSettings, QuizResult } from '../types.ts';
import { utils, read } from 'xlsx';

interface QuizManagerProps {
  questions: QuizQuestion[];
  settings: QuizSettings;
  results: QuizResult[];
  onUpdateQuestions: (questions: QuizQuestion[]) => void | Promise<void>;
  onUpdateSettings: (settings: QuizSettings) => void | Promise<void>;
}

export const QuizManager: React.FC<QuizManagerProps> = ({ questions, settings, results, onUpdateQuestions, onUpdateSettings }) => {
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      
      const allNewQuestions: QuizQuestion[] = [];
      
      // Iterate through all sheets in the workbook
      workbook.SheetNames.forEach((sheetName, sheetIndex) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = utils.sheet_to_json(worksheet) as any[];
        
        // Determine the set name (A, B, C...) based on sheet index or name
        // User said: Sheet1 A, Sheet2 B...
        const setName = String.fromCharCode(65 + sheetIndex); // 65 is 'A'

        const sheetQuestions: QuizQuestion[] = jsonData.map((row, index) => {
          const options = {
            A: String(row.A || row.a || '').trim(),
            B: String(row.B || row.b || '').trim(),
            C: String(row.C || row.c || '').trim(),
            D: String(row.D || row.d || '').trim(),
          };
          
          const rawAnswer = String(row.Answer || row.answer || row.CorrectAnswer || row.correct_answer || '').trim();
          const answerText = rawAnswer.toLowerCase();
          // let correctAnswer: 'A' | 'B' | 'C' | 'D' = 'A';
          let correctAnswer: string = 'A';
          
          const optA = options.A.toLowerCase();
          const optB = options.B.toLowerCase();
          const optC = options.C.toLowerCase();
          const optD = options.D.toLowerCase();

          if (answerText === optA && optA !== '') correctAnswer = 'A';
          else if (answerText === optB && optB !== '') correctAnswer = 'B';
          else if (answerText === optC && optC !== '') correctAnswer = 'C';
          else if (answerText === optD && optD !== '') correctAnswer = 'D';
          else if (optA !== '' && (answerText.startsWith(optA) || optA.startsWith(answerText))) correctAnswer = 'A';
          else if (optB !== '' && (answerText.startsWith(optB) || optB.startsWith(answerText))) correctAnswer = 'B';
          else if (optC !== '' && (answerText.startsWith(optC) || optC.startsWith(answerText))) correctAnswer = 'C';
          else if (optD !== '' && (answerText.startsWith(optD) || optD.startsWith(answerText))) correctAnswer = 'D';
          else {
           const upperAnswer = rawAnswer.toUpperCase();
            if (['A', 'B', 'C', 'D'].includes(upperAnswer)) {
              correctAnswer = upperAnswer;
            } else {
              correctAnswer = rawAnswer; // Store the actual word for non-MCQ
            }
          }


           // Detect Question Type
          let type: any = 'MULTIPLE_CHOICE';
          const rowType = String(row.Type || row.type || '').toUpperCase();
          const imageUrl = row.Image || row.ImageUrl || row.image || row.image_url;
          const memoryWordsRaw = row.Words || row.words || row.MemoryWords;

          if (rowType === 'MEMORY' || rowType === 'MEMORY_TEST' || memoryWordsRaw) {
            type = 'MEMORY_TEST';
          } else if (rowType === 'PICTURE' || rowType === 'PICTURE_CHOICE' || imageUrl) {
            type = 'PICTURE_CHOICE';
          } else if (rowType === 'JUMBLED' || rowType === 'JUMBLED_WORD') {
            type = 'JUMBLED_WORD';
          }

          let memoryWords: string[] | undefined = undefined;
          if (type === 'MEMORY_TEST' && memoryWordsRaw) {
            memoryWords = String(memoryWordsRaw).split(',').map(w => w.trim()).filter(w => w !== '');
          }

          return {
            id: `q-${Date.now()}-${sheetIndex}-${index}`,
            set: setName,
            type,
            question: String(row.Question || row.question || '').trim(),
            imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
            memoryWords,
            options,
            correctAnswer,
            isActive: true,
            sortOrder: index,
            sourceSheet: sheetName,
          };
        });
        
        allNewQuestions.push(...sheetQuestions);
      });

      const nextEnabledSets = Array.from(new Set(allNewQuestions.map(question => question.set))).sort();
      await onUpdateQuestions(allNewQuestions);
      await onUpdateSettings({
        ...settings,
        activeSet: nextEnabledSets[0] || 'A',
        enabledSets: nextEnabledSets
      });
      alert(`Successfully imported ${allNewQuestions.length} questions across ${workbook.SheetNames.length} sets!`);
    } catch (err) {
      console.error(err);
      alert('Failed to import Excel file. Please check the format.');
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTimerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({ ...settings, timerPerQuestion: parseInt(e.target.value) || 10 });
  };

  const handleSetActiveSet = (setName: string) => {
    onUpdateSettings({ ...settings, activeSet: setName });
  };

  const handleToggleSetEnabled = (setName: string) => {
    const enabledSets = settings.enabledSets.includes(setName)
      ? settings.enabledSets.filter(set => set !== setName)
      : [...settings.enabledSets, setName].sort();

    const fallbackSet = enabledSets[0] || settings.activeSet;
    onUpdateSettings({
      ...settings,
      activeSet: enabledSets.includes(settings.activeSet) ? settings.activeSet : fallbackSet,
      enabledSets
    });
  };

  const toggleQuizActive = () => {
    onUpdateSettings({ ...settings, isActive: !settings.isActive });
  };

  const [editingId, setEditingId] = useState<string | null>(null);

  const handleUpdateQuestion = (id: string, updates: Partial<QuizQuestion>) => {
    const updatedQuestions = questions.map(q => q.id === id ? { ...q, ...updates } : q);
    onUpdateQuestions(updatedQuestions);
    setEditingId(null);
  };

  const handleDeleteQuestion = (id: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      onUpdateQuestions(questions.filter(q => q.id !== id));
    }
  };

  const availableSets = Array.from(new Set(questions.map(q => q.set))).sort();
  const filteredQuestions = questions.filter(q => q.set === settings.activeSet);
  const activeQuestionCount = filteredQuestions.filter(question => question.isActive !== false).length;

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Quiz Management</h1>
          <p className="text-slate-500">Configure quiz questions and monitor results</p>
        </div>
        <div className="flex gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleExcelImport}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importLoading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md disabled:opacity-50"
          >
            {importLoading ? 'Importing...' : 'Import Questions (Excel)'}
          </button>
          <button
            onClick={toggleQuizActive}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-md ${
              settings.isActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {settings.isActive ? 'Deactivate Quiz' : 'Activate Quiz'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Active Question Set</label>
          <select 
            value={settings.activeSet}
            onChange={(e) => handleSetActiveSet(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition-all font-bold text-slate-700"
          >
            {availableSets.length > 0 ? (
              availableSets.map(set => <option key={set} value={set}>Set {set}</option>)
            ) : (
              <option value="A">Set A (Default)</option>
            )}
          </select>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 md:col-span-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Enabled Sets For Contest</label>
          <div className="flex flex-wrap gap-3">
            {availableSets.length === 0 ? (
              <span className="text-sm text-slate-400 italic">Import questions to enable sets.</span>
            ) : (
              availableSets.map(setName => {
                const enabled = settings.enabledSets.includes(setName);
                return (
                  <button
                    key={setName}
                    onClick={() => handleToggleSetEnabled(setName)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      enabled
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {enabled ? `Set ${setName} Enabled` : `Set ${setName} Disabled`}
                  </button>
                );
              })
            )}
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Timer Settings</label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={settings.timerPerQuestion}
              onChange={handleTimerChange}
              className="w-24 px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition-all font-bold text-slate-700"
            />
            <span className="text-slate-500 font-bold">Sec/Q</span>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Questions In Set</label>
          <h2 className="text-4xl font-black text-slate-800">{filteredQuestions.length}</h2>
          <p className="text-xs font-bold text-slate-400 mt-2">{activeQuestionCount} active for contest</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Participants</label>
          <h2 className="text-4xl font-black text-indigo-600">{results.length}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col max-h-[600px]">
          <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800">Question List (Set {settings.activeSet})</h3>
            <button 
              onClick={() => onUpdateQuestions([])}
              className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-600"
            >
              Clear All
            </button>
          </div>
          <div className="overflow-y-auto p-6 space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-10 text-slate-400 font-medium italic">No questions in Set {settings.activeSet}.</div>
            ) : (
              filteredQuestions.map((q, i) => (
                <div key={q.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group relative">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Q{i + 1}</span>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                        q.type === 'MEMORY_TEST' ? 'bg-amber-100 text-amber-700' :
                        q.type === 'PICTURE_CHOICE' ? 'bg-purple-100 text-purple-700' :
                        q.type === 'JUMBLED_WORD' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {q.type?.replace('_', ' ')}
                      </span>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                        q.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {q.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingId === q.id ? (
                        q.type === 'MULTIPLE_CHOICE' ? (
                          <select 
                            value={q.correctAnswer}
                            onChange={(e) => handleUpdateQuestion(q.id, { correctAnswer: e.target.value })}
                            className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-white border border-green-200 px-2 py-1 rounded-lg outline-none"
                          >
                            {['A', 'B', 'C', 'D'].map(opt => <option key={opt} value={opt}>Correct: {opt}</option>)}
                          </select>
                        ) : (
                          <input 
                            type="text"
                            value={q.correctAnswer}
                            onChange={(e) => handleUpdateQuestion(q.id, { correctAnswer: e.target.value })}
                            placeholder="Correct Answer"
                            className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-white border border-green-200 px-2 py-1 rounded-lg outline-none w-32"
                          />
                        )
                      ) : (
                        <span className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-2 py-1 rounded-lg">Correct: {q.correctAnswer}</span>
                      )}
                      <button 
                        onClick={() => handleUpdateQuestion(q.id, { isActive: q.isActive === false })}
                        className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                          q.isActive !== false
                            ? 'text-amber-700 bg-amber-50'
                            : 'text-green-700 bg-green-50'
                        }`}
                      >
                        {q.isActive !== false ? 'Disable' : 'Enable'}
                      </button>
                      <button 
                        onClick={() => setEditingId(editingId === q.id ? null : q.id)}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                      </button>
                      <button 
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                  {editingId === q.id ? (
                    <textarea
                      value={q.question}
                      onChange={(e) => handleUpdateQuestion(q.id, { question: e.target.value })}
                      className="w-full font-bold text-slate-800 mb-4 bg-white border border-indigo-100 p-2 rounded-xl outline-none focus:border-indigo-500"
                      rows={2}
                    />
                  ) : (
                    <p className="font-bold text-slate-800 mb-4">{q.question}</p>
                  )}
                  {q.type === 'PICTURE_CHOICE' && q.imageUrl && (
                    <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 min-h-32">
                      <img src={q.imageUrl} alt="Preview" className="w-full max-h-72 object-contain bg-white" referrerPolicy="no-referrer" />
                    </div>
                  )}

                  {q.type === 'MEMORY_TEST' && q.memoryWords && (
                    <div className="mb-4 flex flex-wrap gap-1">
                      {q.memoryWords.map((w, idx) => (
                        <span key={idx} className="text-[9px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-600 font-bold">{w}</span>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(['A', 'B', 'C', 'D'] as const).map(key => (
                      <div key={key} className={`p-2 rounded-lg border transition-all ${q.correctAnswer === key ? 'bg-green-50 border-green-100 text-green-700' : 'text-slate-500 border-transparent'}`}>
                        <span className="font-black text-slate-800 mr-1">{key}:</span> {q.options[key]}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col max-h-[600px]">
          <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50">
            <h3 className="text-xl font-bold text-slate-800">Quiz Results</h3>
          </div>
          <div className="overflow-y-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">User/Emp ID</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Score</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-8 py-10 text-center text-slate-400 font-medium italic">No results yet.</td>
                  </tr>
                ) : (
                  results.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-all">
                      <td className="px-8 py-6">
                        <div className="font-bold text-slate-800">{r.username}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{r.mobileNumber}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-black ${r.score / r.totalQuestions >= 0.7 ? 'text-green-600' : 'text-amber-600'}`}>
                            {r.score}/{r.totalQuestions}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">({Math.round((r.score / r.totalQuestions) * 100)}%)</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-slate-500 text-xs">{r.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
