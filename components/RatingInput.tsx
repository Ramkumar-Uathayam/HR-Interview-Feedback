
import React from 'react';

interface RatingInputProps {
  value: number;
  onChange: (val: number) => void;
  labelEn: string;
  labelTa: string;
}

export const RatingInput: React.FC<RatingInputProps> = ({ value, onChange, labelEn, labelTa }) => {
  return (
    <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
      <div className="mb-4">
        <p className="text-lg font-semibold text-slate-800">{labelEn}</p>
        <p className="text-sm text-slate-500 font-medium mt-1">{labelTa}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={`w-12 h-12 rounded-full font-bold transition-all duration-200 border-2 ${
              value === num
                ? 'bg-green-600 border-green-700 text-white scale-110 shadow-lg'
                : 'bg-white border-slate-200 text-slate-400 hover:border-green-300 hover:text-green-600'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
};
