
import React from 'react';
import * as QRCode from 'qrcode.react';
import { BRAND_LOGO_URL } from '../constants.ts';

const QRCodeSVG = (QRCode as any).QRCodeSVG || (QRCode as any).default?.QRCodeSVG;

export const QRDisplay: React.FC = () => {
  const currentUrl = window.location.origin + window.location.pathname;

  const handlePrint = () => {
    window.print();
  };

  if (!QRCodeSVG) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center">
          <p className="text-red-500 font-bold">QR Component failed to load.</p>
          <p className="text-slate-500 mt-2">Please use this link directly:</p>
          <a href={currentUrl} className="text-indigo-600 underline break-all">{currentUrl}</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="print:shadow-none print:border-none bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col items-center text-center max-w-lg w-full transition-all">
        <div className="mb-8">
          <div className="flex justify-center mb-4">
             <img src={BRAND_LOGO_URL} alt="Brand Logo" className="h-16 object-contain" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">Scan for Feedback</h2>
          <p className="text-slate-500 mt-1 font-medium">பின்னூட்டம் வழங்க ஸ்கேன் செய்யவும்</p>
        </div>

        <div className="p-8 bg-white rounded-[2rem] border-4 border-slate-50 shadow-inner mb-8 group relative">
          <QRCodeSVG 
            value={currentUrl} 
            size={240} 
            level="H" 
            includeMargin={false}
          />
        </div>

        <div className="space-y-3 w-full print:hidden">
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl text-slate-700 border border-slate-100">
            <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-black text-xs">1</div>
            <p className="text-xs font-bold text-left uppercase tracking-wider">Open Camera or QR App</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl text-slate-700 border border-slate-100">
            <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-black text-xs">2</div>
            <p className="text-xs font-bold text-left uppercase tracking-wider">Point at the Code</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 w-full print:hidden">
          <button 
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 hover:bg-black text-white font-black rounded-2xl transition-all shadow-lg active:scale-95 text-sm uppercase tracking-widest"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print for Front Desk
          </button>
          
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
            Digital Feedback Portal • B and B Textile Erode
          </p>
        </div>
      </div>
    </div>
  );
};
