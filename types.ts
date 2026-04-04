
export interface InterviewFeedback {
  id: string;
  candidateName: string;
  mobileNumber: string;
  designation: string;
  department: string;
  address: string;
  date: string;
  ratings: {
    q1_clarity: number;
    q2_communication: number;
    q3_expectations: number;
    q4_ambience: number;
    q5_alignment: number;
    q6_professionalism: number;
    q7_waiting_period: number;
    q8_opportunity: number;
    q9_transparency: number;
    q10_overall: number;
  };
  referral: boolean;
  qualitative: string;
}

export interface AIAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  sentimentScore: number;
}

export interface QuizQuestion {
  id: string;
  set: string; // A, B, C, etc.
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export interface QuizSettings {
  timerPerQuestion: number; // in seconds
  isActive: boolean;
  activeSet: string; // The currently active question set (e.g., 'A')
}

export interface QuizResult {
  username: string;
  mobileNumber: string;
  score: number;
  totalQuestions: number;
  date: string;
  set: string;
}