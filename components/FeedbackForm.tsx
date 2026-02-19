
import React, { useState } from 'react';
import { QUESTIONS, DESIGNATIONS, DEPARTMENTS, BRAND_LOGO_URL } from '../constants.ts';
import { RatingInput } from './RatingInput.tsx';
import { InterviewFeedback } from '../types.ts';

interface FeedbackFormProps {
  onSubmit: (data: Omit<InterviewFeedback, 'id' | 'date'>) => void;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSubmit }) => {
  const [candidateName, setCandidateName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [address, setAddress] = useState('');
  const [ratings, setRatings] = useState<Record<string, number>>(
    QUESTIONS.reduce((acc, q) => ({ ...acc, [q.id]: 0 }), {})
  );
  const [referral, setReferral] = useState<boolean | null>(null);
  const [qualitative, setQualitative] = useState('');
  const [touchedMobile, setTouchedMobile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingChange = (id: string, val: number) => {
    setRatings(prev => ({ ...prev, [id]: val }));
  };

  const isMobileValid = /^[0-9]{10}$/.test(mobileNumber);

  const isFormValid = 
    candidateName.trim() !== '' && 
    isMobileValid && 
    designation !== '' && 
    department !== '' && 
    address.trim() !== '' && 
    (Object.values(ratings) as number[]).every(v => v > 0) && 
    referral !== null &&
    !isSubmitting;

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        candidateName,
        mobileNumber,
        designation,
        department,
        address,
        ratings: ratings as any,
        referral: referral!,
        qualitative
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="text-center mb-10">
        <div className="flex justify-center mb-6">
          <img 
            src={BRAND_LOGO_URL} 
            alt="Brand Logo" 
            className="h-20 md:h-24 object-contain drop-shadow-sm" 
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        </div>
        <h1 className="text-3xl font-bold text-slate-800">Interview Experience</h1>
        <p className="text-slate-500 text-lg mt-2">நேர்காணல் அனுபவம்</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
          <div className="p-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Candidate Name / விண்ணப்பதாரர் பெயர்</label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-all disabled:opacity-50"
              value={candidateName}
              onChange={e => setCandidateName(e.target.value)}
              placeholder="e.g. Arun Kumar"
            />
          </div>

          <div className="p-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-slate-700">Mobile Number / கைபேசி எண்</label>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isMobileValid ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {mobileNumber.length}/10
              </span>
            </div>
            <input
              type="tel"
              required
              maxLength={10}
              disabled={isSubmitting}
              onBlur={() => setTouchedMobile(true)}
              className={`w-full p-3 bg-slate-50 border rounded-lg focus:ring-2 focus:outline-none transition-all disabled:opacity-50 ${
                touchedMobile && !isMobileValid && mobileNumber.length > 0
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-slate-200 focus:ring-green-500'
              }`}
              value={mobileNumber}
              onChange={handleMobileChange}
              placeholder="10-digit mobile number"
            />
            {touchedMobile && !isMobileValid && mobileNumber.length > 0 && (
              <p className="mt-2 text-xs text-red-600 font-bold animate-shake">
                Please enter a valid 10-digit mobile number / தயவுசெய்து 10 இலக்க எண்ணை உள்ளிடவும்
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-6 border-r border-slate-100">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Designation / பதவி</label>
              <select
                required
                disabled={isSubmitting}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
                value={designation}
                onChange={e => setDesignation(e.target.value)}
              >
                <option value="">Select Designation</option>
                {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Functionality / துறை</label>
              <select
                required
                disabled={isSubmitting}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
                value={department}
                onChange={e => setDepartment(e.target.value)}
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="p-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Address / முகவரி</label>
            <textarea
              required
              rows={2}
              disabled={isSubmitting}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-all disabled:opacity-50"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Enter your current location"
            />
          </div>
        </div>

        <div className="pt-4">
          <h2 className="text-xl font-bold text-slate-800 mb-6 px-2">Detailed Evaluation / விரிவான மதிப்பீடு</h2>
          {QUESTIONS.map((q) => (
            <RatingInput
              key={q.id}
              value={ratings[q.id]}
              onChange={(val) => !isSubmitting && handleRatingChange(q.id, val)}
              labelEn={q.en}
              labelTa={q.ta}
            />
          ))}
        </div>

        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100 mb-8">
          <p className="text-lg font-semibold text-slate-800 mb-1">
            Will you refer B and B Textile as a preferred employer to your known circle?
          </p>
          <p className="text-sm text-slate-500 font-medium mb-4">
            நீங்கள் பி அண்ட் பி டெக்ஸ்டைல் நிறுவனத்தை ஒரு சிறந்த வேலை செய்யும் இடமாக உங்களுக்கு தெரிந்தவரிடம் கூறுவீர்களா?
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setReferral(true)}
              className={`flex-1 py-3 rounded-lg font-bold border-2 transition-all disabled:opacity-50 ${
                referral === true ? 'bg-green-600 border-green-700 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-green-200'
              }`}
            >
              Yes | ஆம்
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setReferral(false)}
              className={`flex-1 py-3 rounded-lg font-bold border-2 transition-all disabled:opacity-50 ${
                referral === false ? 'bg-red-600 border-red-700 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-red-200'
              }`}
            >
              No | இல்லை
            </button>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100 mb-8">
          <p className="text-lg font-semibold text-slate-800 mb-1">
            What did you like most about our interview process and Any suggestions to improve?
          </p>
          <p className="text-sm text-slate-500 font-medium mb-4">
            எங்கள் நேர்காணல் செயல்முறையில் உங்களுக்கு மிகவும் பிடித்த அம்சம் எது மற்றும் செயல்முறையை மேம்படுத்த உங்கள் பரிந்துரைகள்?
          </p>
          <textarea
            rows={4}
            disabled={isSubmitting}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-all disabled:opacity-50"
            value={qualitative}
            onChange={e => setQualitative(e.target.value)}
            placeholder="Tell us your thoughts..."
          />
        </div>

        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className={`w-full py-5 rounded-xl text-lg font-black transition-all shadow-xl uppercase tracking-widest flex items-center justify-center gap-3 ${
            isFormValid && !isSubmitting ? 'bg-green-700 hover:bg-green-800 text-white scale-100 active:scale-95' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending... / அனுப்பப்படுகிறது...
            </>
          ) : (
            'Submit Feedback / சமர்ப்பிக்கவும்'
          )}
        </button>
      </form>
    </div>
  );
};
