
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
