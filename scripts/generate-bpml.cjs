const { utils, writeFile } = require('xlsx');

const HEADERS = [
  'S NO', 'Application Name', 'Functionality', 'Product/Feature - Description',
  'SN1', 'Sub Module', 'SN2', 'Functionality Type', 'Critical', 'Active',
  'Responsibility (R)', 'Accountability (A)', 'Consulted (C)', 'Informed (I)',
  'PII Data (Yes/No)', 'PHI Data (Yes/No)', 'Biz Critical Data (Yes/No)',
  'Issues/Remarks', 'Issue Date', 'Remediation', 'Resolution Date', 'Responsibility'
];

const APP = 'HR Interview Feedback & Quiz Portal';

const rows = [
  // Candidate-facing: Feedback
  [1, APP, 'Candidate Bootstrap', 'Loads app shell, brand logo, nav (Feedback / Quiz Contest / QR Code) based on quiz-active flag.', 1, 'App Shell', 1, 'Transaction', 'No', 'Yes', 'Developer', 'HR Lead', 'HR Team', 'HR Team', 'No', 'No', 'No', '—', '—', '—', '—', '—'],
  [2, APP, 'Interview Feedback Capture', 'Public form capturing candidate name, mobile number, designation, department, address, 10 rating questions (EN/TA bilingual), referral flag and free-text comments.', 1, 'Feedback Form', 1, 'Transaction', 'Yes', 'Yes', 'Developer', 'HR Lead', 'HR Team', 'Candidate', 'Yes', 'No', 'Yes', 'Mobile number validated as 10-digit only; no server-side auth on submit endpoint', '2026-08-20', 'Add rate-limiting/captcha and re-validate mobile/fields server-side', '—', 'Developer',],
  [3, APP, 'Rating Input Control', 'Reusable 1-5 star/scale rating UI used across the 10 feedback questions.', 1, 'Feedback Form', 2, 'Master', 'No', 'Yes', 'Developer', 'HR Lead', 'HR Team', '—', 'No', 'No', 'No', '—', '—', '—', '—', '—'],
  [4, APP, 'Feedback Submission Sync', 'Persists feedback to backend (MSSQL hrfeedbacks table) via POST /api/feedback; falls back to browser localStorage cache if server unreachable.', 1, 'Feedback Form', 3, 'Transaction', 'Yes', 'Yes', 'Developer', 'HR Lead', 'IT Team', 'HR Team', 'Yes', 'No', 'Yes', 'Local cache fallback stores PII (name/mobile/address) in plaintext in browser localStorage', '2026-08-20', 'Avoid caching PII client-side, or encrypt/expire cached entries', '—', 'Developer'],
  [5, APP, 'QR Code Display', 'Generates a scannable QR code (qrcode.react) linking to the feedback form for candidates to open on their own device.', 2, 'QR Code', 1, 'Transaction', 'No', 'Yes', 'Developer', 'HR Lead', 'HR Team', 'Candidate', 'No', 'No', 'No', '—', '—', '—', '—', '—'],

  // Auth
  [6, APP, 'HR Login', 'Username/password gate that unlocks Admin Dashboard and Quiz Manager views.', 3, 'Authentication', 1, 'Transaction', 'Yes', 'Yes', 'Developer', 'IT Lead', 'HR Lead', 'HR Team', 'No', 'No', 'Yes', 'Credentials are hardcoded in frontend source (LoginForm.tsx) with no hashing/session/token; client-side only gate', '2026-08-20', 'Move auth to backend with hashed credentials + session/JWT; remove hardcoded creds from source', '—', 'Developer'],

  // Admin / Analytics
  [7, APP, 'Feedback Analytics Dashboard', 'Admin view of all submitted feedback with aggregated ratings, filters and drill-down per candidate.', 4, 'Admin Dashboard', 1, 'Transaction', 'Yes', 'Yes', 'Developer', 'IT Lead', 'HR Lead', 'HR Team', 'Yes', 'No', 'Yes', 'Dashboard route guarded only by client-side isLoggedIn state, not server-verified session', '2026-08-20', 'Enforce server-side auth/session check on all /api endpoints, not just UI routing', '—', 'Developer'],
  [8, APP, 'AI Feedback Analysis', 'Sends feedback dataset to Google Gemini API to generate summary, strengths, weaknesses, recommendations and sentiment score.', 4, 'Admin Dashboard', 2, 'Transaction', 'Yes', 'Yes', 'Developer', 'IT Lead', 'HR Lead', 'HR Team', 'Yes', 'No', 'Yes', 'Candidate PII (name, mobile, address, comments) sent to third-party Gemini API in full', '2026-08-20', 'Strip/mask PII before sending to external AI service; review Gemini data-retention terms', '—', 'Developer'],
  [9, APP, 'Feedback Excel Export', 'Exports all feedback records (incl. PII) to a downloadable .xlsx file via SheetJS.', 4, 'Admin Dashboard', 3, 'Transaction', 'Yes', 'Yes', 'Developer', 'IT Lead', 'HR Lead', 'HR Team', 'Yes', 'No', 'Yes', 'Unrestricted export of PII to local file with no audit trail of who exported/when', '2026-08-20', 'Add export audit logging; consider redacting mobile numbers in export', '—', 'Developer'],

  // Quiz - candidate
  [10, APP, 'Quiz Contest', 'Timed candidate quiz supporting Multiple Choice, Picture Choice, Memory Test and Jumbled Word question types, scored per active question set.', 5, 'Quiz Contest', 1, 'Transaction', 'No', 'Yes', 'Developer', 'HR Lead', 'HR Team', 'Candidate', 'Yes', 'No', 'No', '—', '—', '—', '—', '—'],
  [11, APP, 'Quiz Result Submission', 'Submits candidate quiz score/result to backend (hrquiz_results); falls back to local state if API call fails.', 5, 'Quiz Contest', 2, 'Transaction', 'No', 'Yes', 'Developer', 'HR Lead', 'IT Team', 'HR Team', 'Yes', 'No', 'No', '—', '—', '—', '—', '—'],
  [12, APP, 'Live Leaderboard', 'Displays ranked quiz results filtered by active/enabled question sets, with set switcher.', 6, 'Live Results', 1, 'Transaction', 'No', 'Yes', 'Developer', 'HR Lead', 'HR Team', 'Candidate', 'Yes', 'No', 'No', 'Leaderboard shows candidate name/mobile publicly with no consent gate', '2026-08-20', 'Add explicit consent/opt-out for public display of name & mobile on leaderboard', '—', 'Developer'],

  // Quiz - admin
  [13, APP, 'Quiz Question Management', 'Admin CRUD for quiz questions (create/edit/delete, question type, options, correct answer, active flag, sort order, set assignment).', 7, 'Quiz Manager', 1, 'Master', 'Yes', 'Yes', 'Developer', 'IT Lead', 'HR Lead', 'HR Team', 'No', 'No', 'Yes', '—', '—', '—', '—', '—'],
  [14, APP, 'Quiz Question Bulk Import', 'Imports question sets in bulk from an uploaded Excel workbook (one sheet per set) via SheetJS parser.', 7, 'Quiz Manager', 2, 'Master', 'No', 'Yes', 'Developer', 'IT Lead', 'HR Lead', '—', 'No', 'No', 'Yes', 'No schema/type validation shown on imported rows beyond basic mapping', '2026-08-20', 'Validate imported rows (required fields, answer format) before commit', '—', 'Developer'],
  [15, APP, 'Quiz Settings Control', 'Toggles quiz active/inactive, sets per-question timer, active question set and enabled sets list.', 7, 'Quiz Manager', 3, 'Master', 'Yes', 'Yes', 'Developer', 'IT Lead', 'HR Lead', 'HR Team', 'No', 'No', 'Yes', '—', '—', '—', '—', '—'],

  // Backend / platform
  [16, APP, 'Feedback & Quiz REST API', 'Express API (server.js) exposing /api/feedback and /api/quiz/* endpoints backed by MSSQL; auto-creates schema (hrfeedbacks, hrquiz_questions, hrquiz_settings, hrquiz_results) on boot.', 8, 'Backend API', 1, 'Transaction', 'Yes', 'Yes', 'Developer', 'IT Lead', 'IT Team', 'HR Team', 'Yes', 'No', 'Yes', 'No authentication/authorization on any API route — all endpoints (read & write) are publicly callable', '2026-08-20', 'Add API auth (session/JWT/API key) at least on write endpoints and admin-only reads', '—', 'Developer'],
  [17, APP, 'Database Connectivity', 'MSSQL connection pool (mssql driver) configured via .env (DB_USER/PASSWORD/SERVER/DATABASE); encrypt disabled, trustServerCertificate on.', 8, 'Backend API', 2, 'Master', 'Yes', 'Yes', 'Developer', 'IT Lead', 'IT Team', '—', 'No', 'No', 'Yes', 'DB traffic encryption disabled (encrypt:false) and TLS cert trust bypassed', '2026-08-20', 'Enable encrypt:true with a valid certificate for production DB connections', '—', 'IT Team'],
];

const wb = utils.book_new();
const ws = utils.aoa_to_sheet([HEADERS, ...rows]);
ws['!cols'] = [
  {wch:5},{wch:16},{wch:24},{wch:45},{wch:5},{wch:16},{wch:5},{wch:14},
  {wch:8},{wch:8},{wch:14},{wch:14},{wch:12},{wch:12},{wch:10},{wch:10},
  {wch:12},{wch:45},{wch:12},{wch:40},{wch:14},{wch:14}
];
ws['!freeze'] = { xSplit: 0, ySplit: 1 };
utils.book_append_sheet(wb, ws, 'Business Process Master List');
writeFile(wb, 'Business_Process_Master_List.xlsx');
console.log('Written: Business_Process_Master_List.xlsx');
