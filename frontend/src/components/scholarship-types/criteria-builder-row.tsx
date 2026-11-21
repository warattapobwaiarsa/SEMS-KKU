'use client';

import React from 'react';
import { Trash2, GripVertical, Award, FileText, MessageSquare, AlertCircle } from 'lucide-react';
import { NestedSubCriteriaItem } from '@/types/scholarship-type';

interface CriteriaBuilderRowProps {
  index: number;
  item: NestedSubCriteriaItem;
  targetScore: number;
  onChange: (updated: NestedSubCriteriaItem) => void;
  onDelete: () => void;
  canDelete: boolean;
  titleError?: string;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

export function CriteriaBuilderRow({
  index,
  item,
  targetScore,
  onChange,
  onDelete,
  canDelete,
  titleError,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
}: CriteriaBuilderRowProps) {
  const isScored = item.type === 'SCORED';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`border rounded-2xl p-4 sm:p-5 transition-all shadow-2xs ${
        isDragging
          ? 'opacity-40 border-dashed border-primary bg-primary/5 scale-[0.99]'
          : isDragOver
          ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
          : isScored
          ? 'bg-background border-border/80 hover:border-border'
          : 'bg-muted/20 border-dashed border-border/80'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <div
          className="mt-1 shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-grab active:cursor-grabbing transition"
          title="กดค้างแล้วลากเพื่อสลับลำดับ"
        >
          <GripVertical className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="flex-1 space-y-3">
          {/* Top row: Badges, Type switch & Delete */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-muted-foreground bg-muted/70 px-2.5 py-0.5 rounded-md">
                ข้อที่ {index + 1}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs inline-flex items-center gap-1 ${
                  isScored
                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                }`}
              >
                {isScored ? (
                  <>
                    <Award className="h-3 w-3" />
                    <span>คำนวณคะแนน</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-3 w-3" />
                    <span>กล่องความคิดเห็น</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={item.type}
                onChange={(e) => {
                  const newType = e.target.value as 'SCORED' | 'TEXT';
                  onChange({
                    ...item,
                    type: newType,
                    maxScore: newType === 'SCORED' ? (item.maxScore || 10) : null,
                    allowComment: newType === 'SCORED' ? Boolean(item.allowComment) : false,
                  });
                }}
                className="text-xs bg-background border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="SCORED">🎯 มีคะแนน (SCORED)</option>
                <option value="TEXT">📝 ข้อความ (TEXT)</option>
              </select>

              <button
                type="button"
                onClick={onDelete}
                disabled={!canDelete}
                title={canDelete ? 'ลบหัวข้อนี้' : 'ต้องมีเกณฑ์อย่างน้อย 1 ข้อ'}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Title & Max Score inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
            <div className={isScored ? 'sm:col-span-8' : 'sm:col-span-12'}>
              <input
                id={`subcriteria-title-${index}`}
                type="text"
                required
                value={item.title}
                onChange={(e) => onChange({ ...item, title: e.target.value })}
                placeholder="ระบุหัวข้อเกณฑ์การประเมิน เช่น ผลการเรียนเฉลี่ย (GPAX), ความจำเป็นทางการเงิน..."
                className={`w-full px-3.5 py-2 text-sm bg-background border rounded-xl focus:outline-none focus:ring-2 transition ${
                  titleError
                    ? 'border-destructive focus:ring-destructive/20 ring-1 ring-destructive/30'
                    : 'border-border focus:ring-primary/20 focus:border-primary'
                }`}
              />
              {titleError && (
                <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{titleError}</span>
                </p>
              )}
            </div>

            {isScored && (
              <div className="sm:col-span-4 flex items-center justify-between sm:justify-start gap-2 bg-muted/30 sm:bg-transparent p-2 sm:p-0 rounded-xl">
                <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                  คะแนนเต็ม:
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max={targetScore || 1000}
                    required
                    value={item.maxScore ?? ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onChange({
                        ...item,
                        maxScore: isNaN(val) ? 0 : val,
                      });
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    onKeyDown={(e) => {
                      if (['ArrowUp', 'ArrowDown', 'e', 'E', '+', '-'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className="w-20 px-2.5 py-1.5 text-right font-mono font-bold text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-xs text-muted-foreground font-medium">คะแนน</span>
                </div>
              </div>
            )}
          </div>

          {/* Comment Allowance Checkbox */}
          {isScored && (
            <div className="flex items-center gap-2.5 pt-1">
              <input
                id={`comment-${index}`}
                type="checkbox"
                checked={Boolean(item.allowComment)}
                onChange={(e) => onChange({ ...item, allowComment: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
              />
              <label
                htmlFor={`comment-${index}`}
                className="text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors inline-flex items-center gap-1.5"
              >
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <span>เปิดให้กรรมการบันทึกความคิดเห็นหรือคำแนะนำเพิ่มเติมในหัวข้อนี้</span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
