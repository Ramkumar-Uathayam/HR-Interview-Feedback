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
  const MEMORY_DISPLAY_SECONDS = 25;
  const filteredQuestions = questions.filter(
    q => q.set === settings.activeSet && q.isActive !== false && (settings.enabledSets.length === 0 || settings.enabledSets.includes(q.set))
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [isEvaluated, setIsEvaluated] = useState(false);

  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(settings.timerPerQuestion);
  const [memorizeTimeLeft, setMemorizeTimeLeft] = useState(0);
  const [isMemorizing, setIsMemorizing] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [candidateInfo, setCandidateInfo] = useState({ username: '', mobile: '' });
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [selectedAnswerTimeLeft, setSelectedAnswerTimeLeft] = useState<number | null>(null);
  const [lastAwardedPoints, setLastAwardedPoints] = useState<number>(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastWarningSecondRef = useRef<number | null>(null);

  const currentQuestion = filteredQuestions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / filteredQuestions.length) * 100;
  const regularPointsPerQuestion = 1;
  const maxPossibleScore = filteredQuestions.reduce(
    (total, question) => total + (question.type === 'MULTIPLE_CHOICE' ? 3 : regularPointsPerQuestion),
    0
  );
  const statusMessage = isMemorizing
    ? `Memorize carefully. Answering starts in ${memorizeTimeLeft} seconds.`
    : isAnswerRevealed
    ? 'Answer revealed. Continue when you are ready.'
    : currentQuestion.type === 'MULTIPLE_CHOICE'
    ? selectedAnswer
      ? 'Answer selected. Click Show Answer when the host is ready.'
      : 'Ask the participant to choose one answer option.'
    : 'Use Show Answer when you want to reveal the correct response.';

  const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.05) => {
    if (typeof window === 'undefined') return;

    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    const context = audioContextRef.current;
    if (context.state === 'suspended') {
      context.resume().catch(() => undefined);
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gainNode.gain.setValueAtTime(volume, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  };

  const playBuzzerSound = () => {
    playTone(190, 0.18, 'sawtooth', 0.06);
    setTimeout(() => playTone(140, 0.26, 'sawtooth', 0.05), 120);
  };

  const playWarningTick = () => {
    playTone(880, 0.08, 'square', 0.025);
  };

  useEffect(() => {
   if (quizStarted && !quizFinished) {
      if (isMemorizing && memorizeTimeLeft > 0) {
        timerRef.current = setInterval(() => {
          setMemorizeTimeLeft((prev) => prev - 1);
        }, 1000);
      } else if (isMemorizing && memorizeTimeLeft === 0) {
        setIsMemorizing(false);
        setTimeLeft(settings.timerPerQuestion);
      } else if (!isMemorizing && timeLeft > 0 && !isAnswerRevealed) {
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => prev - 1);
        }, 1000);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizStarted, quizFinished, timeLeft, memorizeTimeLeft, isMemorizing, isAnswerRevealed, currentQuestionIndex, settings.timerPerQuestion]);

  useEffect(() => {
    if (quizStarted && currentQuestion?.type === 'MEMORY_TEST' && !isAnswerRevealed && currentQuestionIndex >= 0) {
      setIsMemorizing(true);
      setMemorizeTimeLeft(MEMORY_DISPLAY_SECONDS);
    }
  }, [currentQuestionIndex, quizStarted]);

  useEffect(() => {
    if (!quizStarted || quizFinished || isMemorizing || isAnswerRevealed) {
      lastWarningSecondRef.current = null;
      return;
    }

    if (timeLeft > 0 && timeLeft <= 10 && lastWarningSecondRef.current !== timeLeft) {
      lastWarningSecondRef.current = timeLeft;
      playWarningTick();
    }
  }, [quizStarted, quizFinished, isMemorizing, isAnswerRevealed, timeLeft]);


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
    setSelectedAnswerTimeLeft(timeLeft);
  };

  const getBonusPoints = () => {
    if (currentQuestion?.type !== 'MULTIPLE_CHOICE' || selectedAnswerTimeLeft === null) {
      return 0;
    }

    const elapsedSeconds = Math.max(0, settings.timerPerQuestion - selectedAnswerTimeLeft);
    if (elapsedSeconds <= 10) return 2;
    if (elapsedSeconds <= 20) return 1;
    return 0;
  };

  const evaluateAnswer = (isManualCorrect?: boolean) => {
    if (isEvaluated) return;
    
    const isCorrect = isManualCorrect !== undefined 
      ? isManualCorrect 
      : selectedAnswer === filteredQuestions[currentQuestionIndex].correctAnswer;

    if (isCorrect) {
      const awardedPoints = regularPointsPerQuestion + getBonusPoints();
      setLastAwardedPoints(awardedPoints);
      setScore((prev) => prev + awardedPoints);
    } else if (currentQuestion?.type === 'MULTIPLE_CHOICE' && selectedAnswer) {
      setLastAwardedPoints(0);
      playBuzzerSound();
    } else {
      setLastAwardedPoints(0);
    }
    setIsEvaluated(true);
    setIsAnswerRevealed(true);
    return isCorrect;
  };

  const handleRevealAnswer = () => {
    if (isAnswerRevealed) return;
    
    // For multiple choice, we need a selection
    if (currentQuestion.type === 'MULTIPLE_CHOICE') {
      if (!selectedAnswer) return;
      evaluateAnswer();
    } else {
      setIsAnswerRevealed(true);
    }
  };

  const handleManualEvaluation = (isCorrect: boolean) => {
    evaluateAnswer(isCorrect);
  };

  const handleNextQuestion = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setSelectedAnswerTimeLeft(null);
      setIsAnswerRevealed(false); 
      setIsEvaluated(false);
      setLastAwardedPoints(0);
      lastWarningSecondRef.current = null;
      setTimeLeft(settings.timerPerQuestion);
    } else {
      finishQuiz();
    }
  };

 const finishQuiz = () => {
    // If answer wasn't revealed (e.g. timer ran out), evaluate it now
    let finalScore = score;
     if (!isEvaluated && selectedAnswer === filteredQuestions[currentQuestionIndex].correctAnswer) {
      finalScore += regularPointsPerQuestion + getBonusPoints();
    }

    setFinalScore(finalScore);
    setScore(finalScore);
    setQuizFinished(true);
    const result: QuizResult = {
      username: candidateInfo.username,
      mobileNumber: candidateInfo.mobile,
      score: finalScore,
      totalQuestions: filteredQuestions.length,
      maxScore: maxPossibleScore,
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
           <span className="text-3xl font-black text-indigo-600">{finalScore}/{maxPossibleScore}</span>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-3">Quiz Completed!</h2>
          <p className="text-slate-500 mb-10 font-medium leading-relaxed">Great job! Your score has been recorded. Thank you for participating.</p>
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 mb-8">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Your Score</p>
           <p className="text-4xl font-black text-indigo-600">{Math.round((finalScore / maxPossibleScore) * 100)}%</p>
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

//  const currentQuestion = filteredQuestions[currentQuestionIndex];

  return (
    <div className="h-[calc(100vh-80px)] max-h-[calc(100vh-80px)] bg-[#050a18] flex items-center justify-center p-3 md:p-6 font-sans overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]"></div>
      
      <div className="max-w-5xl w-full h-full max-h-full relative z-10 flex flex-col justify-center overflow-hidden">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-5 md:mb-6 gap-4">
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
              isMemorizing 
                ? 'border-amber-500 text-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.4)]'
                : timeLeft <= 5 
                ? 'border-red-500 text-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)] animate-pulse' 
                : 'border-indigo-600 text-white'
            }`}>
              <span className="text-3xl font-black leading-none">{isMemorizing ? memorizeTimeLeft : timeLeft}</span>
              <span className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-60">{isMemorizing ? 'MEMORIZE' : 'SEC'}</span>
            </div>
            <div className="absolute -inset-2 rounded-full border border-white/5 animate-[spin_10s_linear_infinite]"></div>
          </div>
        </div>

        <div className="mb-4 md:mb-5 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.35em] text-white/60">
            <span>Quiz Progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden border border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-center">
            <p className="text-sm md:text-base font-bold text-white/90">{statusMessage}</p>
            {!isMemorizing && currentQuestion.type === 'MULTIPLE_CHOICE' && selectedAnswer && !isAnswerRevealed && (
              <p className="text-xs font-bold text-amber-300 uppercase tracking-[0.25em] mt-2">
                Selected Answer: {selectedAnswer} | Bonus Ready: +{getBonusPoints()}
              </p>
            )}
          </div>
        </div>
        
        {/* Question Area - KBC Style Hexagon */}
        <div className="relative mb-5 md:mb-6 group flex-1 min-h-0">
          <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="relative h-full">
            {/* Horizontal lines connecting to the sides */}
              <div className="bg-[#0c1226] border-y-2 border-x-0 md:border-x-2 border-indigo-500/40 p-5 md:p-8 rounded-[2rem] md:rounded-[4rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden h-full flex items-center">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.1)_0%,transparent_70%)]"></div>
              
              <div className="relative z-10 flex flex-col items-center gap-4 md:gap-5 w-full">
                {currentQuestion.type === 'PICTURE_CHOICE' && currentQuestion.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setExpandedImage(currentQuestion.imageUrl || null)}
                    className="w-full max-w-4xl rounded-[2rem] border-2 border-indigo-500/30 shadow-2xl bg-[#10172c] px-4 py-4 md:px-6 md:py-5"
                  >
                    <div className="w-full min-h-[16rem] md:min-h-[18rem] max-h-[38vh] flex items-center justify-center rounded-[1.5rem] bg-white/95 overflow-hidden">
                      <img 
                        src={currentQuestion.imageUrl} 
                        alt="Question" 
                        className="block w-auto max-w-full h-auto max-h-[34vh] md:max-h-[32vh] object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </button>
                )}

                {currentQuestion.type === 'JUMBLED_WORD' && (
                  <div className="px-4 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full mb-2">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">JUMBLED WORD</span>
                  </div>
                )}

                {isMemorizing ? (
                  <div className="w-full">
                    <h4 className="text-lg md:text-xl font-bold text-indigo-400 text-center mb-5 uppercase tracking-widest">Memorize these words:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {currentQuestion.memoryWords?.map((word, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 p-3 rounded-xl text-center font-black text-white text-base md:text-lg animate-in fade-in zoom-in duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                          {word}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                   <>
                    {currentQuestion.type === 'JUMBLED_WORD' && (
                      <div className="w-full flex flex-col items-center gap-4">
                        <div className="px-4 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full mb-2">
                          {/* <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">JUMBLED WORDS</span> */}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                          {currentQuestion.question.split(/[\n, ]+/).filter(w => w.trim() !== '').map((word, idx) => (
                            <div key={idx} className="bg-white/5 border border-white/10 p-3 rounded-xl text-center font-black text-white text-xl md:text-2xl tracking-[0.2em] animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                              {word.toUpperCase()}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(currentQuestion.type === 'MULTIPLE_CHOICE' || currentQuestion.type === 'PICTURE_CHOICE' || currentQuestion.type === 'MEMORY_TEST') && (
                      <h4 className="text-lg md:text-2xl font-bold text-white text-center leading-snug tracking-tight max-w-4xl">
                        {currentQuestion.question}
                      </h4>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Options Grid - 2x2 with KBC Style */}
         {currentQuestion.type === 'MULTIPLE_CHOICE' ? ( 
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-5 md:mb-6 transition-all duration-500 ${isMemorizing ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}>
         {(['A', 'B', 'C', 'D'] as const).map((key) => (
            <button
              key={key}
              onClick={() => handleAnswerSelect(key)}
              disabled={isAnswerRevealed}
              className={`group relative w-full transition-all duration-300 transform active:scale-[0.97] ${
                selectedAnswer === key ? 'scale-[1.02]' : ''
              }`}
            >
                <div className={`relative flex items-center gap-3 p-4 md:p-5 rounded-xl md:rounded-2xl border-2 transition-all duration-300 ${
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
                <span className={`font-bold text-base md:text-lg tracking-wide text-left ${
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
 ) : (
          <div className={`flex flex-col items-center gap-5 mb-5 md:mb-6 transition-all duration-500 ${isMemorizing ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}>
            {isAnswerRevealed && (
              <div className="w-full max-w-2xl bg-indigo-500/10 border border-indigo-500/30 rounded-3xl p-6 text-center animate-in zoom-in duration-500">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">Correct Answer</p>
                <h5 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                  {currentQuestion.type === 'MEMORY_TEST' 
                    ? currentQuestion.memoryWords?.join(', ') 
                    : currentQuestion.correctAnswer}
                </h5>
              </div>
            )}
            
            {!isAnswerRevealed ? (
              <button
                onClick={handleRevealAnswer}
                className="group relative px-12 md:px-20 py-4 md:py-5 font-black rounded-2xl transition-all duration-500 uppercase tracking-[0.3em] text-sm overflow-hidden bg-amber-600 text-white shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:bg-amber-500 hover:shadow-[0_0_60px_rgba(245,158,11,0.6)] active:scale-95"
              >
                <span className="relative z-10">SHOW ANSWER</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
              </button>
            ) : (
              <div className="flex gap-6 w-full max-w-md">
                <button
                 onClick={() => handleManualEvaluation(true)}
                  disabled={isEvaluated}
                  className={`flex-1 py-5 font-black rounded-2xl transition-all uppercase tracking-widest text-sm ${
                    isEvaluated 
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50' 
                      : 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_40px_rgba(34,197,94,0.3)] hover:shadow-[0_0_60px_rgba(34,197,94,0.5)] active:scale-95'
                  }`}
                >
                  CORRECT
                </button>
                <button
                  onClick={() => handleManualEvaluation(false)}
                   disabled={isEvaluated}
                  className={`flex-1 py-5 font-black rounded-2xl transition-all uppercase tracking-widest text-sm ${
                    isEvaluated 
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50' 
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.3)] hover:shadow-[0_0_60px_rgba(239,68,68,0.5)] active:scale-95'
                  }`}
                >
                  WRONG
                </button>
              </div>
            )}
          </div>
        )}

        {isAnswerRevealed && lastAwardedPoints > 0 && (
          <div className="mb-4 flex justify-center">
            <div className="px-6 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 font-black uppercase tracking-[0.25em] text-xs">
              Points Awarded: +{lastAwardedPoints}
            </div>
          </div>
        )}

        {/* Action Buttons (Only for Multiple Choice) */}
        {currentQuestion.type === 'MULTIPLE_CHOICE' && (
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
              <span className="relative z-10">SHOW ANSWER</span>
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
         )}

        {/* Next Button for Binary Choice (Only after evaluation) */}
        {currentQuestion.type !== 'MULTIPLE_CHOICE' && isAnswerRevealed && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleNextQuestion}
              className="group relative px-12 md:px-20 py-4 md:py-5 font-black rounded-2xl transition-all duration-500 uppercase tracking-[0.3em] text-sm overflow-hidden bg-indigo-600 text-white shadow-[0_0_40px_rgba(79,70,229,0.4)] hover:bg-indigo-500 hover:shadow-[0_0_60px_rgba(79,70,229,0.6)] active:scale-95"
            >
              <span className="relative z-10">
                {currentQuestionIndex === filteredQuestions.length - 1 ? 'FINISH CONTEST' : 'NEXT QUESTION'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
            </button>
          </div>
        )}

        {/* Progress Dots */}
        <div className="mt-4 md:mt-5 flex justify-center gap-3">
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

      {expandedImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 p-4 md:p-10 flex items-center justify-center" onClick={() => setExpandedImage(null)}>
          <div className="w-full max-w-6xl max-h-full">
            <img
              src={expandedImage}
              alt="Expanded question"
              className="w-full max-h-[90vh] object-contain rounded-3xl bg-white"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
