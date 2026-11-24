'use client';

import React from 'react';
import { Check, Unlock, Lock } from 'lucide-react';

export interface CriteriaStageIndicatorProps {
  isLocked: boolean;
}

export function CriteriaStageIndicator({ isLocked }: CriteriaStageIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[120px]">
      {/* 2-Step Indicator Track */}
      <div 
        className="flex items-center justify-center gap-1"
        aria-label={`สถานะ: ${isLocked ? 'ล็อก (เปิดประเมินแล้ว)' : 'แก้ไขได้'}`}
      >
        {/* Step 1: แก้ไขได้ */}
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors ${
            !isLocked
              ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-500 ring-2 ring-emerald-500/20 shadow-2xs'
              : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
          }`}
          title="สเตป 1: แก้ไขและตั้งค่าเกณฑ์ได้"
        >
          {isLocked ? <Check className="w-3 h-3 stroke-[2.5]" /> : <Unlock className="w-2.5 h-2.5 stroke-[2.5]" />}
        </span>

        {/* Connector Line 1-2 */}
        <span
          className={`w-4 h-0.5 rounded-full transition-colors ${
            isLocked ? 'bg-slate-500' : 'bg-slate-200 dark:bg-slate-700'
          }`}
        />

        {/* Step 2: ล็อก */}
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors ${
            isLocked
              ? 'bg-slate-700 text-white border-2 border-slate-800 shadow-2xs'
              : 'bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800 dark:border-slate-700'
          }`}
          title="สเตป 2: ล็อกเนื่องจากเปิดประเมินแล้ว"
        >
          <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
        </span>
      </div>

      {/* Status Label Pill */}
      <span
        className={`text-xs font-semibold px-2.5 py-0.5 rounded-md min-w-[96px] text-center border transition-colors ${
          isLocked
            ? 'text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800/80 dark:border-slate-700'
            : 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800/60'
        }`}
      >
        {isLocked ? 'ล็อกแล้ว' : 'แก้ไขได้'}
      </span>
    </div>
  );
}
