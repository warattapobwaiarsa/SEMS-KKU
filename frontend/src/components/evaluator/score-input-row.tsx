/**
 * แถวเดียวของเกณฑ์ย่อยในฟอร์มประเมิน (ฝั่งขวา)
 * - แบบ SCORED: ช่องกรอกคะแนน + "เต็ม {maxScore}" + ตรวจค่า 0 ถึง maxScore [FR-EVL-05] [BR-EVL-03]
 * - แบบ TEXT: ช่องกรอกข้อความ
 * - ช่องคอมเมนต์ แสดงเฉพาะข้อที่ allowComment = true [FR-EVL-06] [BR-EVL-04]
 */
'use client';

import React from 'react';
import type { MyEvaluationItem } from '@/types/evaluation';
import { MessageSquare, Check } from 'lucide-react';

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
  const isFilled = isScored
    ? value.score.trim() !== '' && !scoreError
    : value.textValue.trim() !== '';

  return (
    <div
      id={`criteria-row-${item.subCriteriaId}`}
      className={`flex flex-col gap-3 p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
        scoreError
          ? 'border-destructive/80 bg-destructive/5'
          : isFilled
            ? 'border-primary/40 bg-primary/[0.02] shadow-2xs'
            : 'border-border/80 bg-card hover:border-border'
      }`}
    >
      {/* หัวข้อเกณฑ์ย่อย + คะแนนเต็ม + ป้ายบอกสถานะกรอกแล้ว */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {isFilled && (
            <span className="shrink-0 mt-0.5 w-4.5 h-4.5 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
              <Check className="w-3 h-3 stroke-[3]" />
            </span>
          )}
          <span className="text-base font-semibold text-foreground leading-snug">
            {index}. {sub.title}
          </span>
        </div>
        {isScored && sub.maxScore !== null && (
          <span className="shrink-0 text-xs sm:text-sm font-mono font-semibold px-2.5 py-0.5 rounded-lg bg-muted text-muted-foreground border border-border/50">
            เต็ม {sub.maxScore}
          </span>
        )}
      </div>

      {isScored ? (
        <div className="space-y-1.5">
          {/* ช่องกรอกคะแนน (จำนวนเต็ม 0 ถึง maxScore) */}
          <div className="flex items-center gap-2.5">
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
              className={`w-32 h-11 px-3 text-center text-base font-mono font-bold border rounded-xl bg-background
                focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition
                disabled:cursor-not-allowed disabled:text-muted-foreground disabled:bg-muted/50
                ${scoreError ? 'border-destructive bg-destructive/5 text-destructive' : 'border-border'}`}
              placeholder="-"
            />
            <span className="text-sm sm:text-base font-medium text-muted-foreground">
              / {sub.maxScore ?? '-'} คะแนน
            </span>
          </div>

          {/* ข้อผิดพลาดของคะแนน (เช่น ค่าเกินเต็ม หรือไม่ใช่จำนวนเต็ม) */}
          {scoreError && <p className="text-xs sm:text-sm text-destructive mt-1 font-medium">{scoreError}</p>}
        </div>
      ) : (
        /* แบบ TEXT: ช่องกรอกข้อความ */
        <textarea
          value={value.textValue}
          disabled={readOnly}
          onChange={(e) => onChange(item.subCriteriaId, 'textValue', e.target.value)}
          rows={3}
          placeholder="กรอกข้อความสรุปการประเมิน..."
          className="w-full p-3 text-sm sm:text-base border border-border rounded-xl bg-background resize-y
            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition
            disabled:cursor-not-allowed disabled:text-muted-foreground disabled:bg-muted/50"
        />
      )}

      {/* ช่องคอมเมนต์ แสดงเฉพาะข้อที่เปิดรับคอมเมนต์ */}
      {sub.allowComment && (
        <div className="flex flex-col gap-1.5 pt-2 border-t border-border/60">
          <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-primary" />
            ความคิดเห็นเพิ่มเติมรายข้อ (ไม่บังคับ):
          </label>
          <textarea
            value={value.comment}
            disabled={readOnly}
            onChange={(e) => onChange(item.subCriteriaId, 'comment', e.target.value)}
            rows={2}
            placeholder="ระบุข้อคิดเห็นเพื่อประกอบการพิจารณา..."
            className="w-full p-2.5 text-sm sm:text-base border border-border rounded-xl bg-background resize-y
              focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition
              disabled:cursor-not-allowed disabled:text-muted-foreground disabled:bg-muted/50"
          />
        </div>
      )}
    </div>
  );
}
