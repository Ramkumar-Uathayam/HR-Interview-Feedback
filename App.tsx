
import React, { useState, useEffect } from 'react';
import { FeedbackForm } from './components/FeedbackForm.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { LoginForm } from './components/LoginForm.tsx';
import { QRDisplay } from './components/QRDisplay.tsx';
import { QuizContest } from './components/QuizContest.tsx';
import { QuizManager } from './components/QuizManager.tsx';
import { LiveResults } from './components/LiveResults.tsx';
import { InterviewFeedback, QuizQuestion, QuizSettings, QuizResult } from './types.ts';
import { BRAND_LOGO_URL, API_BASE_URL } from './constants.ts';

type View = 'candidate' | 'admin' | 'qr' | 'login' | 'quiz' | 'quiz-admin';

// Robust UUID generator that works in insecure contexts (HTTP)
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback if call fails for any reason
    }
  }
  
  // RFC4122 compliant fallback for non-secure contexts (like local network HTTP)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const App: React.FC = () => {
  const [view, setView] = useState<View>('candidate');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [feedbacks, setFeedbacks] = useState<InterviewFeedback[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const defaultQuizSettings: QuizSettings = { timerPerQuestion: 15, isActive: false, activeSet: 'A', enabledSets: [] };
  
  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizSettings, setQuizSettings] = useState<QuizSettings>(defaultQuizSettings);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [quizMode, setQuizMode] = useState<'leaderboard' | 'contest'>('leaderboard');
  const [selectedSet, setSelectedSet] = useState('A');

  const availableSets = Array.from(
    new Set(
      quizQuestions
        .filter(q => q.isActive !== false && (quizSettings.enabledSets.length === 0 || quizSettings.enabledSets.includes(q.set)))
        .map(q => q.set)
    )
  ).sort();

 

  const fetchQuizResults = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/quiz/results`);
      if (response.ok) {
        const data = await response.json();
        setQuizResults(data);
        localStorage.setItem('Uathayam_quiz_results', JSON.stringify(data));
      }
    } catch (e) {
      console.warn("Could not fetch quiz results from server", e);
    }
  };

  const fetchQuizQuestions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/quiz/questions`);
      if (!response.ok) {
        throw new Error('Failed to load quiz questions');
      }

      const data = await response.json();
      setQuizQuestions(data);
      localStorage.setItem('ramraj_quiz_questions', JSON.stringify(data));
    } catch (e) {
      console.warn("Could not fetch quiz questions from server, using local cache", e);
      const savedQuestions = localStorage.getItem('ramraj_quiz_questions');
      if (savedQuestions) {
        setQuizQuestions(JSON.parse(savedQuestions));
      }
    }
  };

  const fetchQuizSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/quiz/settings`);
      if (!response.ok) {
        throw new Error('Failed to load quiz settings');
      }

      const data = await response.json();
      const mergedSettings = { ...defaultQuizSettings, ...data, enabledSets: data.enabledSets || [] };
      setQuizSettings(mergedSettings);
      localStorage.setItem('ramraj_quiz_settings', JSON.stringify(mergedSettings));
      setSelectedSet(mergedSettings.activeSet || 'A');
    } catch (e) {
      console.warn("Could not fetch quiz settings from server, using local cache", e);
      const savedSettings = localStorage.getItem('ramraj_quiz_settings');
      if (savedSettings) {
        const parsedSettings = { ...defaultQuizSettings, ...JSON.parse(savedSettings) };
        setQuizSettings(parsedSettings);
        setSelectedSet(parsedSettings.activeSet || 'A');
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/feedback`);
        if (response.ok) {
          const data = await response.json();
          setFeedbacks(data);
          localStorage.setItem('ramraj_feedback_v3', JSON.stringify(data));
        } else {
          throw new Error('Server unreachable');
        }
      } catch (e) {
        console.warn("Could not fetch from server, using local cache", e);
        const saved = localStorage.getItem('ramraj_feedback_v3');
        if (saved) {
          try {
            setFeedbacks(JSON.parse(saved));
          } catch (parseErr) {
            setFeedbacks([]);
          }
        } else {
          setFeedbacks([]);
        }
      }
    };

    // Load Quiz Data from LocalStorage (for demo/persistence)
    const savedQuestions = localStorage.getItem('ramraj_quiz_questions');
    const savedSettings = localStorage.getItem('ramraj_quiz_settings');
    const savedResults = localStorage.getItem('ramraj_quiz_results');
    
    if (savedQuestions) setQuizQuestions(JSON.parse(savedQuestions));
    if (savedSettings) setQuizSettings({ ...defaultQuizSettings, ...JSON.parse(savedSettings) });
    if (savedResults) setQuizResults(JSON.parse(savedResults));

    fetchData();
    fetchQuizQuestions();
    fetchQuizSettings();
    fetchQuizResults();
  }, []);

  useEffect(() => {
    if (view === 'quiz' && !quizSettings.isActive) {
      setView('candidate');
    }
  }, [quizSettings.isActive, view]);

  useEffect(() => {
    if (availableSets.length > 0 && !availableSets.includes(selectedSet)) {
      setSelectedSet(availableSets[0]);
    }
  }, [availableSets, selectedSet]);


  useEffect(() => {
    if ((view === 'admin' || view === 'quiz-admin') && !isLoggedIn) {
      setView('login');
    }
  }, [view, isLoggedIn]);

  const handleFormSubmit = async (data: Omit<InterviewFeedback, 'id' | 'date'>) => {
    // Generate a collision-proof ID using the robust helper
    const newEntry: InterviewFeedback = {
      ...data,
      id: generateUUID(),
      date: new Date().toLocaleDateString('en-GB')
    };

    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.details || 'Failed to save feedback');
      }
      
      // Update local state on success
      const updatedList = [newEntry, ...feedbacks];
      setFeedbacks(updatedList);
      localStorage.setItem('ramraj_feedback_v3', JSON.stringify(updatedList));
      setSubmitted(true);
    } catch (e) {
      console.error("Critical: Failed to sync with server", e);
      alert(`Submission Error: ${e instanceof Error ? e.message : 'Unknown error'}. Please check your connection and try again.`);
    }
  };

  const handleQuizSubmit = async (result: QuizResult) => {
    try {
      const response = await fetch(`${API_BASE_URL}/quiz/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });

      if (response.ok) {
        fetchQuizResults();
      } else {
        throw new Error('Failed to save quiz result to server');
      }
    } catch (e) {
      console.error("Quiz Sync Error:", e);
      // Fallback to local state if server fails
      const updatedResults = [result, ...quizResults];
      setQuizResults(updatedResults);
      localStorage.setItem('ramraj_quiz_results', JSON.stringify(updatedResults));
    }
  };

  const updateQuizQuestions = async (questions: QuizQuestion[]) => {
    setQuizQuestions(questions);
    localStorage.setItem('ramraj_quiz_questions', JSON.stringify(questions));

    try {
      const response = await fetch(`${API_BASE_URL}/quiz/questions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions })
      });

      if (response.status === 404) {
        console.warn('Quiz question API is not available on the current backend. Keeping localStorage as fallback.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to save quiz questions');
      }
    } catch (e) {
      console.error('Quiz question sync error:', e);
    }
  };

  const updateQuizSettings = async (settings: QuizSettings) => {
    setQuizSettings(settings);
    localStorage.setItem('ramraj_quiz_settings', JSON.stringify(settings));

    try {
      const response = await fetch(`${API_BASE_URL}/quiz/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.status === 404) {
        console.warn('Quiz settings API is not available on the current backend. Keeping localStorage as fallback.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to save quiz settings');
      }
    } catch (e) {
      console.error('Quiz settings sync error:', e);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setView('candidate');
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-2xl text-center border border-slate-100 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-3">Feedback Received!</h1>
          <p className="text-slate-500 mb-10 font-medium leading-relaxed">Thank you for sharing your experience. Your input helps us build a better workplace.</p>
          <button
            onClick={() => setSubmitted(false)}
            className="w-full py-5 bg-green-700 hover:bg-green-800 text-white font-black rounded-2xl transition-all shadow-xl active:scale-95 text-lg uppercase tracking-widest"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100">
      <nav className="bg-white/90 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-[60] h-20 flex items-center print:hidden">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => setView('candidate')} className="hover:opacity-80 transition-opacity">
              <img 
                src={BRAND_LOGO_URL} 
                alt="Logo" 
                className="h-10 md:h-11 object-contain" 
              />
            </button>
            <div className="hidden lg:flex gap-1 p-1 bg-slate-100 rounded-2xl">
              <button
                onClick={() => setView('candidate')}
                className={`px-6 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${
                  view === 'candidate' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Feedback
              </button>
              {quizSettings.isActive && (
                <button
                  onClick={() => setView('quiz')}
                  className={`px-6 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${
                    view === 'quiz' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Quiz Contest
                </button>
              )} 
              <button
                onClick={() => setView('qr')}
                className={`px-6 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${
                  view === 'qr' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                QR Code
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex gap-1 p-1 bg-slate-100 rounded-2xl mr-4">
                  <button
                    onClick={() => setView('admin')}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                      view === 'admin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Analytics
                  </button>
                  <button
                    onClick={() => setView('quiz-admin')}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                      view === 'quiz-admin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Quiz Manager
                  </button>
                </div>
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-xs font-black text-slate-800">HR ADMIN</span>
                  <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Secure Session</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setView('login')}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                HR Login
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="min-h-[calc(100vh-80px)]">
         {view === 'candidate' && <FeedbackForm onSubmit={handleFormSubmit} />}
        {view === 'quiz' && (
          quizMode === 'contest' ? (
            <QuizContest 
              questions={quizQuestions} 
              settings={{ ...quizSettings, activeSet: selectedSet }} 
              results={quizResults}
              onSubmit={(result) => {
                handleQuizSubmit(result);
              }} 
              onBack={() => {
                setQuizMode('leaderboard');
                fetchQuizResults(); // Refresh results when going back
              }}
            />
          ) : (
            <LiveResults 
              results={quizResults.filter(result => availableSets.length === 0 || availableSets.includes(result.set))}
              availableSets={availableSets.length > 0 ? availableSets : ['A']}
              activeSet={selectedSet}
              onSetChange={setSelectedSet}
              onStart={() => setQuizMode('contest')}
              isQuizActive={quizSettings.isActive}
            />
          )
        )}
        {view === 'qr' && <QRDisplay />}
        {view === 'login' && <LoginForm onLogin={() => { setIsLoggedIn(true); setView('admin'); }} />}
        {view === 'admin' && isLoggedIn && <AdminDashboard feedbacks={feedbacks} />}
        {view === 'quiz-admin' && isLoggedIn && (
          <QuizManager 
            questions={quizQuestions} 
            settings={quizSettings} 
            results={quizResults}
            onUpdateQuestions={updateQuizQuestions}
            onUpdateSettings={updateQuizSettings}
          />
        )}
      </main>

      <footer className="py-16 text-center border-t border-slate-100 bg-white print:hidden">
        <div className="flex justify-center mb-6">
           <div className="h-px w-24 bg-slate-200"></div>
        </div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] px-4">
          B and B Textile • Erode • Process Intelligence v2.5.0
        </p>
      </footer>
    </div>
  );
};

export default App;
