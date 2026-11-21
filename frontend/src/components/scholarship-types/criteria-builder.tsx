'use client';

import React, { useState } from 'react';
import {
  Plus,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Calculator,
  MessageSquare,
} from 'lucide-react';
import { NestedSubCriteriaItem } from '@/types/scholarship-type';
import { CriteriaBuilderRow } from './criteria-builder-row';

interface CriteriaBuilderProps {
  scholarshipTypeName: string;
  criteriaName: string;
  onCriteriaNameChange: (name: string) => void;
  targetScore?: number;
  onTargetScoreChange?: (score: number) => void;
  subCriteria: NestedSubCriteriaItem[];
  onSubCriteriaChange: (items: NestedSubCriteriaItem[]) => void;
  nameError?: string;
  emptyTitleIndices?: number[];
}

export function CriteriaBuilder({
  scholarshipTypeName,
  criteriaName,
  onCriteriaNameChange,
  targetScore = 100,
  onTargetScoreChange = () => {},
  subCriteria,
  onSubCriteriaChange,
  nameError,
  emptyTitleIndices,
}: CriteriaBuilderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Live Score Calculation
  const totalScore = subCriteria
    .filter((row) => row.type === 'SCORED')
    .reduce((sum, row) => sum + (Number(row.maxScore) || 0), 0);

  const isTargetScoreValid =
    Number.isInteger(targetScore) && targetScore >= 1 && targetScore <= 1000;
  const isScoreValid = isTargetScoreValid && totalScore === targetScore;
  const scoredCount = subCriteria.filter((r) => r.type === 'SCORED').length;

  // Handlers for rows
  const handleItemChange = (index: number, updatedItem: NestedSubCriteriaItem) => {
    const updated = [...subCriteria];
    updated[index] = updatedItem;
    onSubCriteriaChange(updated);
  };

  const handleAddScoredRow = () => {
    const remaining = Math.max(0, targetScore - totalScore);
    const defaultMax = remaining > 0 ? Math.min(remaining, 10) : 10;
    const newItem: NestedSubCriteriaItem = {
      title: '',
      type: 'SCORED',
      maxScore: defaultMax,
      allowComment: true,
      sortOrder: subCriteria.length + 1,
    };
    onSubCriteriaChange([...subCriteria, newItem]);
  };

  const handleAddTextRow = () => {
    const newItem: NestedSubCriteriaItem = {
      title: '',
      type: 'TEXT',
      maxScore: null,
      allowComment: false,
      sortOrder: subCriteria.length + 1,
    };
    onSubCriteriaChange([...subCriteria, newItem]);
  };

  const handleDeleteItem = (index: number) => {
    if (subCriteria.length <= 1) return;
    const filtered = subCriteria.filter((_, idx) => idx !== index);
    const reordered = filtered.map((item, idx) => ({
      ...item,
      sortOrder: idx + 1,
    }));
    onSubCriteriaChange(reordered);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'SELECT' ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select')
    ) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const items = [...subCriteria];
    const [draggedItem] = items.splice(draggedIndex, 1);
    items.splice(dropIndex, 0, draggedItem);
    const reordered = items.map((row, idx) => ({ ...row, sortOrder: idx + 1 }));
    onSubCriteriaChange(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
      {/* Left Column (8 cols on desktop) */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        {/* Card 1: Criteria General Info & Target Score */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8 space-y-2">
              <label htmlFor="criteriaName" className="block text-sm font-semibold text-foreground">
                ชื่อชุดเกณฑ์การประเมิน <span className="text-destructive">*</span>
              </label>
              <input
                id="criteriaName"
                type="text"
                required
                value={criteriaName}
                onChange={(e) => onCriteriaNameChange(e.target.value)}
                placeholder={
                  scholarshipTypeName
                    ? `เช่น เกณฑ์การประเมิน${scholarshipTypeName}`
                    : 'เช่น เกณฑ์การพิจารณาทุนเรียนดี ประจำปีการศึกษา 2569'
                }
                className={`w-full px-4 py-2.5 text-sm bg-background border rounded-xl focus:outline-none focus:ring-2 transition ${
                  nameError
                    ? 'border-destructive focus:ring-destructive/20 ring-1 ring-destructive/30'
                    : 'border-border focus:ring-primary/20 focus:border-primary'
                }`}
              />
              {nameError && (
                <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{nameError}</span>
                </p>
              )}
            </div>

            <div className="sm:col-span-4 space-y-2">
              <label htmlFor="targetScoreInput" className="block text-sm font-semibold text-foreground">
                คะแนนรวมเป้าหมาย <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  id="targetScoreInput"
                  type="number"
                  min="1"
                  max="1000"
                  required
                  value={targetScore || ''}
                  onChange={(e) => onTargetScoreChange(parseInt(e.target.value, 10) || 0)}
                  placeholder="100"
                  className="w-full px-4 py-2.5 text-sm font-mono font-bold bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition pr-14"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">
                  คะแนน
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <span>
              กำหนดคะแนนรวมเป้าหมายได้ตั้งแต่ 1 ถึง 1,000 คะแนน (ผลรวมคะแนนเต็มของเกณฑ์ย่อยแบบมีคะแนนต้องเท่ากับเป้าหมายนี้พอดี)
            </span>
          </p>
        </div>

        {/* Card 2: Sub-Criteria Items */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/70">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">รายการเกณฑ์ย่อย</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                ทั้งหมด {subCriteria.length} ข้อ (แบบคำนวณคะแนน {scoredCount} ข้อ, ข้อความ {subCriteria.length - scoredCount} ข้อ)
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleAddScoredRow}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition shadow-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                เพิ่มข้อแบบมีคะแนน
              </button>
              <button
                type="button"
                onClick={handleAddTextRow}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                เพิ่มข้อความคิดเห็น
              </button>
            </div>
          </div>

          {/* List of subcriteria rows */}
          <div className="space-y-3">
            {subCriteria.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed border-border/70 rounded-2xl bg-muted/10 flex flex-col items-center justify-center">
                <div className="p-3 rounded-2xl bg-muted/50 text-muted-foreground mb-3">
                  <Plus className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">ยังไม่มีรายการเกณฑ์ย่อย</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-sm">
                  เริ่มกำหนดเกณฑ์โดยการคลิกปุ่มด้านบนเพื่อเพิ่มหัวข้อประเมินแบบมีคะแนน หรือกล่องความคิดเห็น
                </p>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={handleAddScoredRow}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    เพิ่มข้อแบบมีคะแนน
                  </button>
                  <button
                    type="button"
                    onClick={handleAddTextRow}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    เพิ่มข้อความคิดเห็น
                  </button>
                </div>
              </div>
            ) : (
              subCriteria.map((item, idx) => (
                <CriteriaBuilderRow
                  key={idx}
                  index={idx}
                  item={item}
                  targetScore={targetScore}
                  titleError={emptyTitleIndices?.includes(idx) ? 'กรุณาระบุหัวข้อเกณฑ์การประเมินในข้อนี้ (ห้ามเว้นว่าง)' : undefined}
                  onChange={(updated) => handleItemChange(idx, updated)}
                  onDelete={() => handleDeleteItem(idx)}
                  canDelete={subCriteria.length > 1}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedIndex === idx}
                  isDragOver={dragOverIndex === idx && draggedIndex !== idx}
                />
              ))
            )}
          </div>

          {/* Bottom Action Area */}
          {subCriteria.length > 0 && (
            <div className="pt-4 border-t border-border/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/20 p-4 rounded-xl border border-dashed border-border/80">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleAddScoredRow}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition shadow-xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  เพิ่มข้อแบบมีคะแนน
                </button>
                <button
                  type="button"
                  onClick={handleAddTextRow}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  เพิ่มข้อความคิดเห็น
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Live Score Summary Card (Sticky Desktop) */}
      <div className="lg:col-span-4 sticky top-6 flex flex-col gap-4">
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              <span>สรุปคะแนนประเมิน</span>
            </h3>
            <span className="text-xs font-mono font-bold text-muted-foreground">
              {scoredCount} ข้อคะแนน
            </span>
          </div>

          {/* Score Counter Box */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-center space-y-1">
            <div className="text-xs text-muted-foreground font-medium">คะแนนรวมปัจจุบัน</div>
            <div className="text-3xl font-extrabold font-mono text-foreground tracking-tight">
              {totalScore}
              <span className="text-base font-normal text-muted-foreground ml-1.5">
                / {targetScore}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">คะแนนเต็มเป้าหมาย</div>
          </div>

          {/* Status Alert Badge */}
          <div>
            {isScoreValid ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>ผลรวมคะแนนครบ {targetScore} คะแนน (พร้อมดำเนินการ)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  {totalScore > targetScore
                    ? `คะแนนเกินกำหนดไป ${totalScore - targetScore} คะแนน`
                    : `ยังขาดอีก ${targetScore - totalScore} คะแนน`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
