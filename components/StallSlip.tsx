import React from 'react';
import * as QRCode from 'qrcode.react';
import { StallPrintSlip } from '../types.ts';
import { buildStallQrData } from '../services/stall.ts';

const QRCodeSVG = (QRCode as any).QRCodeSVG || (QRCode as any).default?.QRCodeSVG;

interface StallSlipProps {
  slip: StallPrintSlip;
  printedAt: Date;
}

const formatDateTime = (d: Date) =>
  `${d.toLocaleDateString('en-GB').replace(/\//g, '-')} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;

// 90mm x 42mm landscape label: QR on the left, details on the right.
export const StallSlip: React.FC<StallSlipProps> = ({ slip, printedAt }) => {
  return (
    <div className="w-[90mm] h-[42mm] p-[2mm] flex gap-[2mm] bg-white text-black overflow-hidden font-sans leading-tight">
      <div className="w-[38mm] h-[38mm] shrink-0 flex items-center justify-center">
        {QRCodeSVG ? (
          <QRCodeSVG value={buildStallQrData(slip)} size={144} level="M" includeMargin={false} style={{ width: '38mm', height: '38mm' }} />
        ) : (
          <p className="text-[7pt] text-red-600">QR failed to load</p>
        )}
      </div>

      <div className="flex-1 min-w-0 h-[38mm] flex flex-col">
        {slip.isReprint && (
          <div className="self-start bg-black text-white px-[1.5mm] py-[0.3mm] mb-[0.8mm]">
            <p className="text-[7pt] font-black tracking-[0.15em]">REPRINT #{slip.reprintCount}</p>
          </div>
        )}

        <p className="text-[7.5pt] font-black uppercase truncate">{slip.company}</p>
        {slip.address ? (
          <p className="text-[5.5pt] whitespace-pre-line line-clamp-2 overflow-hidden">{slip.address}</p>
        ) : (
          <p className="text-[5.5pt] italic text-red-600 print:hidden">No address set (Settings)</p>
        )}

        <div className="border-t border-dashed border-black my-[1mm]" />

        <p className="text-[9pt] font-black uppercase line-clamp-2">{slip.empName}</p>
        <p className="text-[8pt] font-bold">{slip.empCode}</p>
        <p className="text-[6.5pt] uppercase truncate">{slip.department}</p>

        <div className="mt-auto">
          <p className="text-[11pt] font-black">₹ {slip.amount}</p>
          <p className="text-[5.5pt]">
            Printed on {slip.printDay}
            {slip.isReprint && ` • Reprint ${formatDateTime(printedAt)}`}
          </p>
        </div>
      </div>
    </div>
  );
};
