'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { SubCriteriaType, CriteriaDetail } from '@/types/criteria';
import { fetchCriteriaById, updateCriteria } from '@/services/criteria.service';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  GripVertical, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Lock, 
  MessageSquare,
  Layers,
} from 'lucide-react';

interface SubCriteriaRow {
  id?: number;
  tempId: string;
  sortOrder: number;
  title: string;
  type: SubCriteriaType;
  maxScore: number;
  allowComment: boolean;
}

export default function EditOrViewCriteriaPage() {
  const router = useRouter();
  const params = useParams();
  const criteriaId = Number(params?.id);

  const [criteria, setCriteria] = useState<CriteriaDetail | null>(null);
  const [name, setName] = useState('');
  const [subCriteria, setSubCriteria] = useState<SubCriteriaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const loadCriteria = useCallback(async () => {
    if (!criteriaId) return;
    try {
      setLoading(true);
      const res = await fetchCriteriaById(criteriaId);
      setCriteria(res.data);
      setName(res.data.name);
      setSubCriteria(
        res.data.subCriteria.map((sub, idx) => ({
          id: sub.id,
          tempId: `sub-${sub.id || idx}`,
          sortOrder: sub.sortOrder,
          title: sub.title,
          type: sub.type,
          maxScore: sub.maxScore || 0,
          allowComment: sub.allowComment || false,
        })),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลเกณฑ์ได้';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }, [criteriaId]);

  useEffect(() => {
    void loadCriteria();
  }, [loadCriteria]);

  const totalScore = subCriteria
    .filter((row) => row.type === 'SCORED')
    .reduce((sum, row) => sum + (Number(row.maxScore) || 0), 0);

  const isLocked = criteria?.isLocked || false;
  const isScoreValid = totalScore === 100;
  const scoredCount = subCriteria.filter((r) => r.type === 'SCORED').length;
  const hasAtLeastOneScored = scoredCount > 0;
  const hasAllTitles = subCriteria.length > 0 && subCriteria.every((r) => r.title.trim().length > 0);
  const hasValidMaxScores = subCriteria
    .filter((r) => r.type === 'SCORED')
    .every((r) => r.maxScore >= 1 && r.maxScore <= 100);

  const isFormValid =
    name.trim().length > 0 &&
    isScoreValid &&
    hasAtLeastOneScored &&
    hasAllTitles &&
    hasValidMaxScores &&
    !isLocked;

  const handleAddScoredRow = () => {
    if (isLocked) return;
    const newOrder = subCriteria.length + 1;
    setSubCriteria([
      ...subCriteria,
      {
        tempId: `row-${Date.now()}`,
        sortOrder: newOrder,
        title: '',
        type: 'SCORED',
        maxScore: 10,
        allowComment: false,
      },
    ]);
  };

  const handleAddTextRow = () => {
    if (isLocked) return;
    const newOrder = subCriteria.length + 1;
    setSubCriteria([
      ...subCriteria,
      {
        tempId: `row-${Date.now()}`,
        sortOrder: newOrder,
        title: '',
        type: 'TEXT',
        maxScore: 0,
        allowComment: false,
      },
    ]);
  };

  const handleRemoveRow = (tempId: string) => {
    if (isLocked || subCriteria.length <= 1) return;
    const filtered = subCriteria.filter((row) => row.tempId !== tempId);
    const reordered = filtered.map((row, idx) => ({ ...row, sortOrder: idx + 1 }));
    setSubCriteria(reordered);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isLocked) return;
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'BUTTON' ||
      target.closest('button') ||
      target.closest('input')
    ) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (isLocked) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (isLocked) return;
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
    setSubCriteria(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleUpdateRow = (tempId: string, updates: Partial<SubCriteriaRow>) => {
    if (isLocked) return;
    setSubCriteria(
      subCriteria.map((row) => (row.tempId === tempId ? { ...row, ...updates } : row)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setErrorMessage('เกณฑ์ถูกล็อกเนื่องจากถูกใช้ในรอบ Open/Closed แล้ว ห้ามแก้ไข');
      return;
    }
    if (!name.trim()) {
      setErrorMessage('กรุณาระบุชื่อชุดเกณฑ์การประเมิน');
      return;
    }
    if (!hasAllTitles) {
      setErrorMessage('กรุณาระบุชื่อหัวข้อเกณฑ์ย่อยให้ครบทุกข้อ (ห้ามเว้นว่าง)');
      return;
    }
    if (!hasAtLeastOneScored) {
      setErrorMessage('ชุดเกณฑ์ต้องมีเกณฑ์แบบคำนวณคะแนนอย่างน้อย 1 ข้อ');
      return;
    }
    if (!hasValidMaxScores) {
      setErrorMessage('คะแนนเต็มของแต่ละข้อต้องเป็นจำนวนเต็มระหว่าง 1–100 คะแนน');
      return;
    }
    if (!isScoreValid) {
      setErrorMessage(`ผลรวมคะแนนต้องเท่ากับ 100 คะแนนพอดี (ปัจจุบัน: ${totalScore} คะแนน)`);
      return;
    }
    if (saving) return;

    try {
      setSaving(true);
      setErrorMessage(null);

      const payload = {
        name: name.trim(),
        subCriteria: subCriteria.map((row) => ({
          id: row.id,
          sortOrder: row.sortOrder,
          title: row.title.trim(),
          type: row.type,
          maxScore: row.type === 'SCORED' ? Number(row.maxScore) : undefined,
          allowComment: row.type === 'SCORED' ? row.allowComment : false,
        })),
      };

      await updateCriteria(criteriaId, payload);
      router.push('/admin/evaluation-criteria');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปเดตเกณฑ์';
      setErrorMessage(msg);
      if (msg.includes('LOCKED') || msg.includes('ห้ามแก้ไข') || msg.includes('Open/Closed')) {
        void loadCriteria();
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
        <p className="mt-4 text-sm text-muted-foreground">กำลังโหลดข้อมูลชุดเกณฑ์...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-16">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <Link
          href="/admin/evaluation-criteria"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition hover:-translate-x-0.5"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับสู่หน้ารายการเกณฑ์การประเมิน
        </Link>
        <div className="flex items-center gap-2">
          {isLocked ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs">
              <Lock className="h-3.5 w-3.5 text-slate-600" />
              เกณฑ์ถูกล็อก (ใช้งานในรอบทุน Open/Closed แล้ว)
            </span>
          ) : isScoreValid ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              สถานะ: พร้อมบันทึก (100 คะแนน)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              สถานะ: ขาด/เกิน {Math.abs(100 - totalScore)} คะแนน
            </span>
          )}
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {isLocked ? 'รายละเอียดเกณฑ์การประเมิน' : 'แก้ไขเกณฑ์การประเมิน'}
        </h1>
        <p className="mt-1.5 text-sm font-medium text-slate-500">
          รหัสอ้างอิง: CRT-{criteriaId.toString().padStart(4, '0')}
        </p>
      </div>

      {isLocked && (
        <div className="rounded-2xl border border-slate-300 bg-white p-5 text-sm text-slate-800 flex items-start gap-3.5 shadow-sm">
          <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
            <Lock className="h-5 w-5 text-slate-700" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base">เกณฑ์นี้ถูกล็อกไม่สามารถแก้ไขได้</h4>
            <p className="mt-1 text-slate-600 leading-relaxed">
              เนื่องจากชุดเกณฑ์นี้ถูกนำไปใช้ในรอบทุนที่เปิดรับประเมิน (Open) หรือปิดรอบแล้ว (Closed) เพื่อรักษาความถูกต้องของข้อมูลประเมิน หากต้องการเปลี่ยนแปลงเกณฑ์ ให้สร้างชุดเกณฑ์ใหม่
            </p>
            <div className="mt-3">
              <Link
                href="/admin/evaluation-criteria/create"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                สร้างชุดเกณฑ์ใหม่
              </Link>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50/90 p-4 text-sm text-rose-900 flex items-start gap-3 shadow-xs">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <h4 className="font-bold">เกิดข้อผิดพลาด</h4>
            <p className="mt-0.5 font-medium">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Card 1: Criteria General Info */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <label htmlFor="criteriaName" className="block text-sm font-semibold text-foreground mb-1">
                ชื่อเกณฑ์การประเมิน <span className="text-destructive">*</span>
              </label>
              <input
                id="criteriaName"
                type="text"
                disabled={isLocked}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-muted disabled:text-muted-foreground transition"
              />
            </div>
          </div>

          {/* Card 2: Sub-Criteria List */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-semibold text-foreground">รายการเกณฑ์ย่อย</h3>
                <p className="text-xs text-muted-foreground">ทั้งหมด {subCriteria.length} รายการ</p>
              </div>
              {!isLocked && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddScoredRow}
                    className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    เพิ่มเกณฑ์มีคะแนน
                  </button>
                  <button
                    type="button"
                    onClick={handleAddTextRow}
                    className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    เพิ่มเกณฑ์ข้อความ
                  </button>
                </div>
              )}
            </div>

            {/* Rows */}
            <div className="space-y-3">
              {subCriteria.map((row, idx) => (
                <div
                  key={row.tempId}
                  draggable={!isLocked}
                  onDragStart={(e) => !isLocked && handleDragStart(e, idx)}
                  onDragOver={(e) => !isLocked && handleDragOver(e, idx)}
                  onDrop={(e) => !isLocked && handleDrop(e, idx)}
                  onDragEnd={!isLocked ? handleDragEnd : undefined}
                  className={`border rounded-xl p-4 transition ${
                    draggedIndex === idx
                      ? 'opacity-40 border-dashed border-primary bg-primary/5 scale-[0.99]'
                      : dragOverIndex === idx && draggedIndex !== idx
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                      : row.type === 'SCORED'
                      ? 'bg-background border-border'
                      : 'bg-muted/20 border-border/70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!isLocked && (
                      <div
                        className="mt-1 shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-grab active:cursor-grabbing transition"
                        title="กดค้างแล้วลากเพื่อสลับลำดับ"
                      >
                        <GripVertical className="h-5 w-5" aria-hidden="true" />
                      </div>
                    )}

                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-muted-foreground">
                          #{row.sortOrder}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                            row.type === 'SCORED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-zinc-100 text-zinc-700 border-zinc-300'
                          }`}
                        >
                          {row.type === 'SCORED' ? 'มีคะแนน' : 'ข้อความ'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        <div className={row.type === 'SCORED' ? 'sm:col-span-8' : 'sm:col-span-12'}>
                          <input
                            type="text"
                            disabled={isLocked}
                            required
                            value={row.title}
                            onChange={(e) => handleUpdateRow(row.tempId, { title: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-muted disabled:text-muted-foreground transition"
                          />
                        </div>

                        {row.type === 'SCORED' && (
                          <div className="sm:col-span-4 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">คะแนนเต็ม:</span>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              disabled={isLocked}
                              required
                              value={row.maxScore || ''}
                              onChange={(e) =>
                                handleUpdateRow(row.tempId, {
                                  maxScore: parseInt(e.target.value) || 0,
                                })
                              }
                              onWheel={(e) => e.currentTarget.blur()}
                              onKeyDown={(e) => {
                                if (['ArrowUp', 'ArrowDown', 'e', 'E', '+', '-'].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              className="w-20 px-2 py-1.5 text-right font-mono font-semibold text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-muted disabled:text-muted-foreground transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-xs text-muted-foreground">คะแนน</span>
                          </div>
                        )}
                      </div>

                      {row.type === 'SCORED' && (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            id={`comment-${row.tempId}`}
                            type="checkbox"
                            disabled={isLocked}
                            checked={row.allowComment}
                            onChange={(e) => handleUpdateRow(row.tempId, { allowComment: e.target.checked })}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 disabled:cursor-not-allowed"
                          />
                          <label
                            htmlFor={`comment-${row.tempId}`}
                            className="text-xs text-muted-foreground select-none"
                          >
                            อนุญาตให้กรรมการกรอกความคิดเห็นเพิ่มเติมในข้อนี้
                          </label>
                        </div>
                      )}
                    </div>

                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.tempId)}
                        disabled={subCriteria.length <= 1}
                        title="ลบเกณฑ์ย่อยนี้"
                        className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Action Area */}
            {!isLocked && subCriteria.length > 0 && (
              <div className="pt-4 border-t border-border/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/20 p-4 rounded-xl border border-dashed border-border/80">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleAddScoredRow}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    เพิ่มเกณฑ์มีคะแนน
                  </button>
                  <button
                    type="button"
                    onClick={handleAddTextRow}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl bg-muted text-foreground hover:bg-muted/80 transition cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    เพิ่มเกณฑ์ข้อความ
                  </button>
                </div>

                <span className="text-xs text-muted-foreground font-medium">
                  ทั้งหมด {subCriteria.length} ข้อ (คะแนนรวม {totalScore}/100)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 sticky top-20 flex flex-col gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3">
              ผลรวมคะแนนเกณฑ์
            </h3>

            <div
              className={`rounded-2xl p-6 text-center border transition shadow-xs ${
                isScoreValid
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-2 ring-emerald-500/20'
                  : 'bg-rose-50 border-rose-300 text-rose-900 ring-2 ring-rose-500/20'
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-wider mb-1.5 opacity-80">คะแนนรวมทั้งหมด</div>
              <div className="text-5xl font-extrabold font-mono tracking-tight">
                {totalScore}
                <span className="text-lg font-normal ml-1.5 opacity-70">/ 100</span>
              </div>
            </div>

            {/* Rounds Using This Criteria */}
            {criteria?.usedByRounds && criteria.usedByRounds.length > 0 && (
              <div className="space-y-3 text-xs border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-primary" />
                    รอบทุนที่นำเกณฑ์นี้ไปใช้
                  </span>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {criteria.usedByRounds.length} รอบ
                  </span>
                </div>
                <div className="max-h-52 overflow-y-auto pr-1 flex flex-col gap-1.5 focus:outline-none">
                  {criteria.usedByRounds.map((r) => {
                    const statusConfig = {
                      OPEN: { border: 'border-emerald-200', bg: 'bg-emerald-50/70', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'เปิดรับ' },
                      CLOSED: { border: 'border-slate-200', bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400', label: 'ปิดรับ' },
                      DRAFT: { border: 'border-amber-200', bg: 'bg-amber-50/70', text: 'text-amber-800', dot: 'bg-amber-500', label: 'ฉบับร่าง' },
                    }[r.status] || { border: 'border-slate-200', bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400', label: r.status };

                    return (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusConfig.dot}`} />
                          <span className="font-medium text-slate-800 truncate" title={r.name}>
                            {r.name}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 font-medium ${statusConfig.border} ${statusConfig.bg} ${statusConfig.text}`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!isLocked && (
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={!isFormValid || saving}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 px-5 text-sm font-bold shadow-md shadow-blue-600/25 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'กำลังบันทึกข้อมูล...' : 'บันทึกการเปลี่ยนแปลงเกณฑ์'}
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
