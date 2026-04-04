import React, { useState, useEffect, useRef } from 'react';
import { QuizQuestion, QuizSettings, QuizResult } from '../types.ts';

interface QuizContestProps {
  questions: QuizQuestion[];
  settings: QuizSettings;
  results: QuizResult[];
  onSubmit: (result: QuizResult) => void;
  onBack: () => void;
}

export const QuizContest: React.FC<QuizContestProps> = ({ questions, settings, results, onSubmit, onBack }) => {
 const filteredQuestions = questions.filter(q => q.set === settings.activeSet);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(settings.timerPerQuestion);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [candidateInfo, setCandidateInfo] = useState({ username: '', mobile: '' });
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
    if (quizStarted && !quizFinished && timeLeft > 0 && !isAnswerRevealed) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && quizStarted && !quizFinished && !isAnswerRevealed) {
      evaluateAnswer();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizStarted, quizFinished, timeLeft, isAnswerRevealed]);

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();


        
    // 1. Mobile Number Validation (10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(candidateInfo.mobile)) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    // 2. Duplicate Check (Same mobile number on the same date)
    const today = new Date().toLocaleDateString('en-GB');
    const alreadyParticipated = results.some(r => {
      const resultDate = new Date(r.date).toLocaleDateString('en-GB');
      return r.mobileNumber === candidateInfo.mobile && resultDate === today;
    });

    if (alreadyParticipated) {
      alert("This mobile number has already participated in the quiz today. Please try again tomorrow!");
      return;
    }


    if (candidateInfo.username && candidateInfo.mobile) {
      setQuizStarted(true);
      setTimeLeft(settings.timerPerQuestion);
    }
  };

  const handleAnswerSelect = (answer: 'A' | 'B' | 'C' | 'D') => {
    if (isAnswerRevealed) return; // Prevent changing answer after reveal
    setSelectedAnswer(answer);
  };

  const evaluateAnswer = () => {
    if (isAnswerRevealed) return;
    
    const isCorrect = selectedAnswer === filteredQuestions[currentQuestionIndex].correctAnswer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    setIsAnswerRevealed(true);
    return isCorrect;
  };

  const handleRevealAnswer = () => {
    if (!selectedAnswer || isAnswerRevealed) return;
    evaluateAnswer();
  };

  const handleNextQuestion = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false); 
      setTimeLeft(settings.timerPerQuestion);
    } else {
      finishQuiz();
    }
  };

 const finishQuiz = () => {
    // If answer wasn't revealed (e.g. timer ran out), evaluate it now
    let finalScore = score;
    if (!isAnswerRevealed && selectedAnswer === filteredQuestions[currentQuestionIndex].correctAnswer) {
      finalScore += 1;
    }

    setQuizFinished(true);
    const result: QuizResult = {
      username: candidateInfo.username,
      mobileNumber: candidateInfo.mobile,
      score: finalScore,
      totalQuestions: filteredQuestions.length,
      date: new Date().toISOString(),
      set: settings.activeSet,
    };
    onSubmit(result);
  };

  
  if (filteredQuestions.length === 0) {
    return (
      <div className="p-20 text-center text-slate-400 font-bold italic">
        No questions found for Set {settings.activeSet}. Please contact HR.
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="max-w-md mx-auto py-20 px-6">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100">
          <h2 className="text-3xl font-black text-slate-800 mb-6 text-center">Quiz Contest</h2>
          <p className="text-slate-500 mb-8 text-center font-medium">Enter your details to start the quiz.</p>
          <form onSubmit={handleStartQuiz} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Username / Employee ID</label>
              <input
                required
                type="text"
                value={candidateInfo.username}
                onChange={(e) => setCandidateInfo({ ...candidateInfo, username: e.target.value })}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700"
                placeholder="EMP123"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mobile Number</label>
              <input
                required
                type="tel"
                maxLength={10}
                pattern="[0-9]{10}"
                value={candidateInfo.mobile}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  if (val.length <= 10) {
                    setCandidateInfo({ ...candidateInfo, mobile: val });
                  }
                }}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700"
                placeholder="9876543210"
              />
            </div>
            <button
              type="submit"
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl active:scale-95 text-lg uppercase tracking-widest"
            >
              Start Quiz
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (quizFinished) {
    return (
      <div className="max-w-md mx-auto py-20 px-6">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 text-center">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
           <span className="text-3xl font-black text-indigo-600">{score}/{filteredQuestions.length}</span>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-3">Quiz Completed!</h2>
          <p className="text-slate-500 mb-10 font-medium leading-relaxed">Great job! Your score has been recorded. Thank you for participating.</p>
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 mb-8">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Your Score</p>
           <p className="text-4xl font-black text-indigo-600">{Math.round((score / filteredQuestions.length) * 100)}%</p>
          </div>
           <button
             onClick={onBack}
            //   username: candidateInfo.username,
            //   mobileNumber: candidateInfo.mobile,
            //   score: score,
            //   totalQuestions: filteredQuestions.length,
            //   date: new Date().toISOString(),
            //   set: settings.activeSet
            // })}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl active:scale-95 text-lg uppercase tracking-widest"
          >
            Back to Leaderboard
          </button>
        </div>
      </div>
    );
  }

 const currentQuestion = filteredQuestions[currentQuestionIndex];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#050a18] flex items-center justify-center p-4 md:p-10 font-sans overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]"></div>
      
      <div className="max-w-5xl w-full relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="text-center md:text-left">
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
              <div className="inline-block px-4 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">
                  QUESTION {currentQuestionIndex + 1} OF {filteredQuestions.length}
                </span>
              </div>
              <div className="inline-block px-4 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em]">
                  SET {settings.activeSet}
                </span>
              </div>
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter drop-shadow-lg">
              Uathayam <span className="text-indigo-500">Quiz</span> Contest
            </h3>
          </div>
          
          <div className="relative">
            <div className={`w-24 h-24 rounded-full border-[8px] flex flex-col items-center justify-center transition-all duration-300 shadow-[0_0_40px_rgba(79,70,229,0.2)] ${
              timeLeft <= 5 
                ? 'border-red-500 text-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)] animate-pulse' 
                : 'border-indigo-600 text-white'
            }`}>
              <span className="text-3xl font-black leading-none">{timeLeft}</span>
              <span className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-60">SEC</span>
            </div>
            <div className="absolute -inset-2 rounded-full border border-white/5 animate-[spin_10s_linear_infinite]"></div>
          </div>
        </div>
        
        {/* Question Area - KBC Style Hexagon */}
        <div className="relative mb-12 group">
          <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="relative">
            {/* Horizontal lines connecting to the sides */}
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent -z-10"></div>
            
            <div className="bg-[#0c1226] border-y-2 border-x-0 md:border-x-2 border-indigo-500/40 p-8 md:p-12 rounded-[2rem] md:rounded-[4rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.1)_0%,transparent_70%)]"></div>
              <h4 className="text-2xl md:text-4xl font-bold text-white text-center leading-snug tracking-tight relative z-10">
                {currentQuestion.question}
              </h4>
            </div>
          </div>
        </div>

        {/* Options Grid - 2x2 with KBC Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-12">
          {(['A', 'B', 'C', 'D'] as const).map((key) => (
            <button
              key={key}
              onClick={() => handleAnswerSelect(key)}
              disabled={isAnswerRevealed}
              className={`group relative w-full transition-all duration-300 transform active:scale-[0.97] ${
                selectedAnswer === key ? 'scale-[1.02]' : ''
              }`}
            >
              <div className={`relative flex items-center gap-4 p-5 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all duration-300 ${
                isAnswerRevealed
                  ? key === currentQuestion.correctAnswer
                    ? 'bg-green-600 border-green-400 shadow-[0_0_30px_rgba(34,197,94,0.5)]'
                    : selectedAnswer === key
                    ? 'bg-red-600 border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
                    : 'bg-[#0c1226] border-indigo-500/30 opacity-50'
                  : selectedAnswer === key
                  ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)]'
                  : 'bg-[#0c1226] border-indigo-500/30 hover:border-indigo-400 hover:bg-indigo-900/20'
              }`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg shrink-0 transition-all duration-300 ${
                  isAnswerRevealed && (key === currentQuestion.correctAnswer || selectedAnswer === key)
                    ? 'bg-white/20 text-white'
                    : selectedAnswer === key
                    ? 'bg-amber-500 text-white'
                    : 'bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white'
                }`}>
                  {key}
                </div>
                <span className={`font-bold text-lg md:text-xl tracking-wide text-left ${
                  selectedAnswer === key || (isAnswerRevealed && key === currentQuestion.correctAnswer)
                    ? 'text-white' 
                    : 'text-slate-300 group-hover:text-white'
                }`}>
                  {currentQuestion.options[key]}
                </span>
                
                {/* Decorative side triangles for hexagonal look */}
                <div className="absolute top-1/2 -left-2 w-4 h-4 bg-inherit border-l-2 border-t-2 border-inherit rotate-[-45deg] -translate-y-1/2 hidden md:block"></div>
                <div className="absolute top-1/2 -right-2 w-4 h-4 bg-inherit border-r-2 border-b-2 border-inherit rotate-[-45deg] -translate-y-1/2 hidden md:block"></div>
              </div>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6">
          {!isAnswerRevealed ? (
            <button
              onClick={handleRevealAnswer}
              disabled={selectedAnswer === null}
              className={`group relative px-12 md:px-20 py-4 md:py-5 font-black rounded-2xl transition-all duration-500 uppercase tracking-[0.3em] text-sm overflow-hidden ${
                selectedAnswer === null 
                  ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                  : 'bg-amber-600 text-white shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:bg-amber-500 hover:shadow-[0_0_60px_rgba(245,158,11,0.6)] active:scale-95'
              }`}
            >
              <span className="relative z-10">ANSWER</span>
              {selectedAnswer !== null && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
              )}
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="group relative px-12 md:px-20 py-4 md:py-5 font-black rounded-2xl transition-all duration-500 uppercase tracking-[0.3em] text-sm overflow-hidden bg-indigo-600 text-white shadow-[0_0_40px_rgba(79,70,229,0.4)] hover:bg-indigo-500 hover:shadow-[0_0_60px_rgba(79,70,229,0.6)] active:scale-95"
            >
              <span className="relative z-10">
                {currentQuestionIndex === filteredQuestions.length - 1 ? 'FINISH CONTEST' : 'NEXT QUESTION'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
            </button>
          )}
        </div>

        {/* Progress Dots */}
        <div className="mt-12 flex justify-center gap-3">
          {filteredQuestions.map((_, idx) => (
           <div 
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === currentQuestionIndex 
                  ? 'w-8 bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.8)]' 
                  : idx < currentQuestionIndex 
                  ? 'w-4 bg-green-500' 
                  : 'w-4 bg-white/10'
              }`}
            ></div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
};
