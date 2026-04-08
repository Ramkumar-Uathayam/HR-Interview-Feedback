
import { InterviewFeedback } from './types.ts';

export const BRAND_LOGO_URL = "./public/image/UATHAYAM LOGO png.png";

// Centralized API configuration - Matches server.js port 3300
export const API_BASE_URL = 'https://vms.uathayam.in:4300/HRAPI/api';
  // export const API_BASE_URL = 'http://localhost:3401/api';
export const DESIGNATIONS = [
  "STAFF",
  "WORKER"
  
];

export const DEPARTMENTS = [
  "CUSTOMER CARE",
  "HR DEPARTMENT",
  "IT DEPARTMENT",
  "EDP DEPARTMENT",
  "INVENTORY",
  "DESPATCH",
  "TRANSPORT",
  "ACCOUNTS",
  "ADMINISTRATOR",
  "PICKING",
  "PACKING",
  "CHECKING",
  "ECOMMERCE",
  "LOADING",
];

export const QUESTIONS = [
  { id: 'q1_clarity', en: 'How clearly and promptly were the interview schedule and details shared with you?', ta: 'நேர்காணல் அட்டவணை மற்றும் விவரங்கள் எவ்வளவு தெளிவாகவும், தாமதமின்றி உங்களுடன் பகிரப்பட்டன?' },
  { id: 'q2_communication', en: 'Did you find it easy to communicate with the HR team before the interview?', ta: 'நேர்காணலுக்கு முன் HR குழுவுடன் தொடர்பு கொள்ள உங்களுக்கு எளிதாக இருந்ததா?' },
  { id: 'q3_expectations', en: 'How clearly were the job role and expectations explained to you?', ta: 'வேலைப் பொறுப்புகள் 및 எதிர்பார்ப்புகள் உங்களுக்கு எவ்வளவு தெளிவாக விளக்கப்பட்டன?' },
  { id: 'q4_ambience', en: 'Rate the ambience and comfortability of the place of interview?', ta: 'நேர்காணல் நடைபெற்ற இடத்தின் சூழல் மற்றும் வசதியை மதிப்பிடுங்கள்?' },
  { id: 'q5_alignment', en: 'How well did the interview questions align with the responsibilities mentioned in the job description?', ta: 'நேர்காணல் கேள்விகள், வேலை பொறுப்புகளுடன் எவ்வளவு பொருந்தியிருந்தன?' },
  { id: 'q6_professionalism', en: 'How professional was the interview panel during your interaction with relevant question?', ta: 'நீங்கள் பேசும் போது நேர்காணல் குழுவின் தொழில்முறை மற்றும் அது எவ்வாறு உங்களுக்கு தொடர்பான கேள்விகளுடன் இருந்தது?' },
  { id: 'q7_waiting_period', en: 'How reasonable was the waiting period and the overall duration of the interview?', ta: 'நேர்காணலுக்கு முன் காத்திருப்பு நேரம் மற்றும் முழு நேர்காணல் நேரம் நியாயமானதா?' },
  { id: 'q8_opportunity', en: 'Were you given enough opportunity to express your skills and achievements?', ta: 'உங்கள் திறமைகள் மற்றும் அனுபவத்தை வெளிப்படுத்த போதுமான வாய்ப்பு வழங்கப்பட்டதா?' },
  { id: 'q9_transparency', en: 'Were the next steps and selection process explained transparently?', ta: 'தேர்வு செயல்முறை மற்றும் அடுத்த கட்டங்கள் தெளிவாக விளக்கப்பட்டதா?' },
  { id: 'q10_overall', en: 'How would you rate your overall interview experience at B and B Textile?', ta: 'பி அண்ட் பி டெக்ஸ்டைல் உங்கள் மொத்த நேர்காணல் அனுபவம் எப்படி இருந்தது?' },
];
