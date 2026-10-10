/**
 * แถวเดียวของเกณฑ์ย่อยในฟอร์มประเมิน (ฝั่งขวา)
 * - แบบ SCORED: ช่องกรอกคะแนน + "เต็ม {maxScore}" + ตรวจค่า 0 ถึง maxScore [FR-EVL-05] [BR-EVL-03]
 * - แบบ TEXT: ช่องกรอกข้อความ
 * - ช่องคอมเมนต์ แสดงเฉพาะข้อที่ allowComment = true [FR-EVL-06] [BR-EVL-04]
 */
'use client';

import React from 'react';
import type { MyEvaluationItem } from '@/types/evaluation';

// ค่าในฟอร์มของ 1 ข้อ (เก็บเป็น string เพื่อให้พิมพ์ได้อิสระว่าง) [FR-EVL-07]
export interface ScoreFormValue {
  score: string;
  comment: string;
  textValue: string;
}

// ค่าทั้งฟอร์ม: key = subCriteriaId
export type ScoreFormValues = Record<number, ScoreFormValue>;

interface ScoreInputRowProps {
  index: number;
  item: MyEvaluationItem;
  value: ScoreFormValue;
  /** ข้อผิดพลาดของคะแนนข้อนี้ (null = ไม่มีปัญหา) */
  scoreError: string | null;
  readOnly: boolean;
  onChange: (subCriteriaId: number, field: keyof ScoreFormValue, value: string) => void;
}

export function ScoreInputRow({
  index,
  item,
  value,
  scoreError,
  readOnly,
  onChange,
}: ScoreInputRowProps) {
  const sub = item.subCriteria;
  const isScored = sub.type === 'SCORED';

  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl border border-slate-200 bg-white">
      {/* หัวข้อเกณฑ์ย่อย + คะแนนเต็ม */}
      <div className="flex items-start justify-between gap-3">
        <span className="text-base font-semibold text-slate-900">
          {index}. {sub.title}
        </span>
        {isScored && sub.maxScore !== null && (
          <span className="shrink-0 text-sm text-slate-700 font-mono">เต็ม {sub.maxScore}</span>
        )}
      </div>

      {isScored ? (
        <>
          {/* ช่องกรอกคะแนน (จำนวนเต็ม 0 ถึง maxScore) */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={sub.maxScore ?? undefined}
              step={1}
              value={value.score}
              disabled={readOnly}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault();
                }
              }}
              onChange={(e) => onChange(item.subCriteriaId, 'score', e.target.value)}
              className={`w-28 h-11 px-3 text-center text-base font-mono border rounded-lg bg-white
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                disabled:cursor-not-allowed disabled:text-slate-700 disabled:bg-slate-100
                ${scoreError ? 'border-rose-500 bg-rose-50' : 'border-slate-400'}`}
              placeholder="-"
            />
            <span className="text-base text-slate-700">
              / {sub.maxScore ?? '-'} คะแนน
            </span>
          </div>

          {/* ข้อผิดพลาดของคะแนน (เช่น ค่าเกินเต็ม หรือไม่ใช่จำนวนเต็ม) */}
          {scoreError && <p className="text-sm text-rose-600">{scoreError}</p>}
        </>
      ) : (
        /* แบบ TEXT: ช่องกรอกข้อความ */
        <textarea
          value={value.textValue}
          disabled={readOnly}
          onChange={(e) => onChange(item.subCriteriaId, 'textValue', e.target.value)}
          rows={3}
          placeholder="กรอกข้อความ"
          className="w-full p-2.5 text-base border border-slate-400 rounded-lg bg-white resize-y
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:cursor-not-allowed disabled:text-slate-700 disabled:bg-slate-100"
        />
      )}

      {/* ช่องคอมเมนต์ แสดงเฉพาะข้อที่เปิดรับคอมเมนต์ */}
      {sub.allowComment && (
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-700">ความเห็นเพิ่มเติมรายข้อ:</label>
          <textarea
            value={value.comment}
            disabled={readOnly}
            onChange={(e) => onChange(item.subCriteriaId, 'comment', e.target.value)}
            rows={2}
            placeholder="ไม่บังคับ"
            className="w-full p-2.5 text-base border border-slate-400 rounded-lg bg-white resize-y
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:cursor-not-allowed disabled:text-slate-700 disabled:bg-slate-100"
          />
        </div>
      )}
    </div>
  );
}
