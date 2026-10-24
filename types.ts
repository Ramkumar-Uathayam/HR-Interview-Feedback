
export interface InterviewFeedback {
  id: string;
  candidateName: string;
  mobileNumber: string;
  designation: string;
  department: string;
  branch: string;
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

export type QuestionType = 'MULTIPLE_CHOICE' | 'PICTURE_CHOICE' | 'MEMORY_TEST' | 'JUMBLED_WORD';

export interface QuizQuestion {
  id: string;
  set: string; // A, B, C, etc.
  type: QuestionType;
  question: string;
  imageUrl?: string;
  memoryWords?: string[];
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: string;// 'A' | 'B' | 'C' | 'D';
  isActive: boolean;
  sortOrder?: number;
  sourceSheet?: string;
}

export interface QuizSettings {
  timerPerQuestion: number; // in seconds
  isActive: boolean;
  activeSet: string; // The currently active question set (e.g., 'A')
  enabledSets: string[];
}

export interface StallEmployee {
  empCode: string;
  empName: string;
  company: string;
  department: string;
  isPrinted: boolean;
  printDateTime: string | null; // yyyy-mm-dd hh:mi:ss
  printDay: string | null;      // dd-mm-yyyy, used in QR data
  address: string | null;
  reprintCount: number;
}

export interface StallPrintSlip extends StallEmployee {
  isReprint: boolean;
  amount: string;
}

export interface StallCompanyAddress {
  company: string;
  address: string;
  employeeCount: number;
}

export interface StallImportRow {
  empCode: string;
  empName: string;
  company: string;
  department: string;
}

export interface QuizResult {
  username: string;
  mobileNumber: string;
  score: number;
  totalQuestions: number;
  maxScore?: number;
  date: string;
  set: string;
}
