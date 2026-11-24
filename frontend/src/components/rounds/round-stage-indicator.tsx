'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface RoundStageIndicatorProps {
  status: string;
}

export function RoundStageIndicator({ status }: RoundStageIndicatorProps) {
  const isDraft = status === 'DRAFT';
  const isOpen = status === 'OPEN';
  const isClosed = status === 'CLOSED';

  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[120px]">
      {/* 3-Step Dots Track (Stage 1-2-3) */}
      <div 
        className="flex items-center justify-center gap-1" 
        aria-label={`ขั้นตอน: ${isDraft ? '1/3' : isOpen ? '2/3' : '3/3'}`}
      >
        {/* Step 1: Draft */}
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors ${
            isDraft
              ? 'bg-amber-100 text-amber-800 border-2 border-amber-500 shadow-2xs'
              : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
          }`}
          title="สเตป 1: ร่างรอบทุน"
        >
          {isDraft ? '1' : <Check className="w-3 h-3 stroke-[2.5]" />}
        </span>

        {/* Connector Line 1-2 */}
        <span
          className={`w-3.5 h-0.5 rounded-full ${
            !isDraft ? 'bg-emerald-400' : 'bg-slate-200'
          }`}
        />

        {/* Step 2: Open */}
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors ${
            isOpen
              ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-500 ring-2 ring-emerald-500/20 shadow-2xs'
              : isClosed
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
              : 'bg-slate-100 text-slate-400 border border-slate-200'
          }`}
          title="สเตป 2: เปิดรับประเมิน"
        >
          {isClosed ? <Check className="w-3 h-3 stroke-[2.5]" /> : '2'}
        </span>

        {/* Connector Line 2-3 */}
        <span
          className={`w-3.5 h-0.5 rounded-full ${
            isClosed ? 'bg-slate-500' : 'bg-slate-200'
          }`}
        />

        {/* Step 3: Closed */}
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors ${
            isClosed
              ? 'bg-slate-700 text-white border-2 border-slate-800 shadow-2xs'
              : 'bg-slate-100 text-slate-400 border border-slate-200'
          }`}
          title="สเตป 3: ปิดรอบการประเมิน"
        >
          3
        </span>
      </div>

      {/* Single Clear Status Label */}
      <span
        className={`text-xs font-semibold px-2.5 py-0.5 rounded-md min-w-[96px] text-center ${
          isOpen
            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
            : isClosed
            ? 'text-slate-700 bg-slate-100 border border-slate-200'
            : 'text-amber-800 bg-amber-50 border border-amber-200'
        }`}
      >
        {isOpen ? 'เปิดรับประเมิน' : isClosed ? 'ปิดรอบแล้ว' : 'แบบร่าง'}
      </span>
    </div>
  );
}
