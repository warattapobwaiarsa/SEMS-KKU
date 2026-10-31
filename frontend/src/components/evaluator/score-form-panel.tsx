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
  totalScore?: number;
  maxTotal?: number;
  onChange: (subCriteriaId: number, field: keyof ScoreFormValue, value: string) => void;
}

export function ScoreFormPanel({
  items,
  values,
  scoreErrors,
  readOnly,
  onChange,
}: ScoreFormPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* รายการเกณฑ์ย่อยทุกข้อ */}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground p-8 text-center border border-dashed border-border rounded-2xl">
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
    </div>
  );
}
