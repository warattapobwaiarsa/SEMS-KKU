/**
 * แผงฟอร์มคะแนน (ฝั่งขวาของหน้าประเมิน)
 * แสดงเกณฑ์ย่อยทุกข้อตามลำดับ sortOrder + คะแนนรวมสด "คะแนนรวม X / 100"
 * คะแนนรวมนับเฉพาะเกณฑ์แบบ SCORED ที่กรอกแล้ว เท่านั้น [FR-SCR-02] [BR-SCR-02]
 */
'use client';

import React from 'react';
import type { MyEvaluationItem } from '@/types/evaluation';
import { ScoreInputRow, type ScoreFormValue, type ScoreFormValues } from './score-input-row';

interface ScoreFormPanelProps {
  items: MyEvaluationItem[];
  values: ScoreFormValues;
  /** ข้อผิดพลาดคะแนนรายข้อ: key = subCriteriaId */
  scoreErrors: Record<number, string>;
  readOnly: boolean;
  /** คะแนนรวมสดที่ฝั่งหน้าจอคำนวณ (Draft ฝั่ง server ยังเป็น null) */
  totalScore: number;
  /** คะแนนเต็มรวมของข้อแบบ SCORED ทั้งหมด */
  maxTotal: number;
  onChange: (subCriteriaId: number, field: keyof ScoreFormValue, value: string) => void;
}

export function ScoreFormPanel({
  items,
  values,
  scoreErrors,
  readOnly,
  totalScore,
  maxTotal,
  onChange,
}: ScoreFormPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* หัวแผง */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
        <span className="text-base font-bold text-slate-900">
          เกณฑ์การให้คะแนน ({items.length} ข้อ)
        </span>
        {readOnly && (
          <span className="inline-flex items-center gap-1 text-sm text-slate-700">
            🔒 โหมดอ่านอย่างเดียว
          </span>
        )}
      </div>

      {/* รายการเกณฑ์ย่อยทุกข้อ */}
      {items.length === 0 ? (
        <p className="text-sm text-slate-700 p-4 border border-dashed border-slate-300 rounded-xl">
          รอบนี้ยังไม่มีเกณฑ์ย่อยสำหรับประเมิน
        </p>
      ) : (
        items.map((item, idx) => (
          <ScoreInputRow
            key={item.subCriteriaId}
            index={idx + 1}
            item={item}
            value={
              values[item.subCriteriaId] ?? { score: '', comment: '', textValue: '' }
            }
            scoreError={scoreErrors[item.subCriteriaId] ?? null}
            readOnly={readOnly}
            onChange={onChange}
          />
        ))
      )}

      {/* คะแนนรวมสด (นับเฉพาะ SCORED ที่กรอกแล้ว) [FR-SCR-02] */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white rounded-xl">
        <span className="text-base font-semibold">คะแนนรวม</span>
        <span className="text-xl font-bold font-mono">
          {totalScore} <span className="text-base font-normal text-slate-200">/ {maxTotal}</span>
        </span>
      </div>
    </div>
  );
}
