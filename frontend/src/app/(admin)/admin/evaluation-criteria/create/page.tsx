'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SubCriteriaType } from '@/types/criteria';
import { createCriteria } from '@/services/criteria.service';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  GripVertical, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  MessageSquare,
  Calculator,
  ShieldCheck
} from 'lucide-react';

interface SubCriteriaRow {
  tempId: string;
  sortOrder: number;
  title: string;
  type: SubCriteriaType;
  maxScore: number;
  allowComment: boolean;
}

export default function CreateCriteriaPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [subCriteria, setSubCriteria] = useState<SubCriteriaRow[]>([
    {
      tempId: 'row-1',
      sortOrder: 1,
      title: 'ผลการเรียนเฉลี่ยสะสม (GPAX)',
      type: 'SCORED',
      maxScore: 30,
      allowComment: false,
    },
    {
      tempId: 'row-2',
      sortOrder: 2,
      title: 'ความจำเป็นทางการเงินและรายได้ครอบครัว',
      type: 'SCORED',
      maxScore: 40,
      allowComment: true,
    },
    {
      tempId: 'row-3',
      sortOrder: 3,
      title: 'การมีส่วนร่วมในกิจกรรมและจิตอาสา',
      type: 'SCORED',
      maxScore: 30,
      allowComment: true,
    },
    {
      tempId: 'row-4',
      sortOrder: 4,
      title: 'ข้อคิดเห็นและข้อเสนอแนะเพิ่มเติมของคณะกรรมการ',
      type: 'TEXT',
      maxScore: 0,
      allowComment: false,
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live score calculation
  const totalScore = subCriteria
    .filter((row) => row.type === 'SCORED')
    .reduce((sum, row) => sum + (Number(row.maxScore) || 0), 0);

  const isScoreValid = totalScore === 100;
  const scoredCount = subCriteria.filter((r) => r.type === 'SCORED').length;
  const hasAtLeastOneScored = scoredCount > 0;
  const isFormValid = name.trim().length > 0 && isScoreValid && hasAtLeastOneScored;

  const handleAddScoredRow = () => {
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
    if (subCriteria.length <= 1) return;
    const filtered = subCriteria.filter((row) => row.tempId !== tempId);
    const reordered = filtered.map((row, idx) => ({ ...row, sortOrder: idx + 1 }));
    setSubCriteria(reordered);
  };

  const handleUpdateRow = (tempId: string, updates: Partial<SubCriteriaRow>) => {
    setSubCriteria(
      subCriteria.map((row) => (row.tempId === tempId ? { ...row, ...updates } : row)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || saving) return;

    try {
      setSaving(true);
      setErrorMessage(null);

      const payload = {
        name: name.trim(),
        subCriteria: subCriteria.map((row) => ({
          sortOrder: row.sortOrder,
          title: row.title.trim(),
          type: row.type,
          maxScore: row.type === 'SCORED' ? Number(row.maxScore) : undefined,
          allowComment: row.type === 'SCORED' ? row.allowComment : false,
        })),
      };

      await createCriteria(payload);
      router.push('/admin/evaluation-criteria');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกเกณฑ์';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-24 md:pb-16">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/70 pb-4">
        <Link
          href="/admin/evaluation-criteria"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition hover:translate-x-[-2px]"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับสู่หน้ารายการเกณฑ์การประเมิน
        </Link>
        <div>
          {isScoreValid ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ผลรวมคะแนนครบ 100 คะแนน (พร้อมบันทึก)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              {totalScore > 100
                ? `คะแนนเกินกำหนดไป ${totalScore - 100} คะแนน`
                : `ยังขาดอีก ${100 - totalScore} คะแนน`}
            </span>
          )}
        </div>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
          สร้างเกณฑ์การประเมินทุนใหม่
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          กำหนดหัวข้อเกณฑ์ย่อย สัดส่วนคะแนน และหัวข้อความคิดเห็นสำหรับคณะกรรมการผู้ประเมิน
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-3 shadow-xs">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-destructive" />
          <div>
            <h4 className="font-semibold">ไม่สามารถบันทึกข้อมูลได้</h4>
            <p className="mt-0.5 text-xs text-destructive/90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Form Builder (Left) + Live Score Card (Right) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols on lg) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Card 1: General Info */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
            <label htmlFor="criteriaName" className="block text-sm font-semibold text-foreground">
              ชื่อชุดเกณฑ์การประเมิน <span className="text-destructive">*</span>
            </label>
            <input
              id="criteriaName"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น เกณฑ์การพิจารณาทุนเรียนดีและขาดแคลนทุนทรัพย์ ประจำปี 2569"
              className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              ชื่อชุดเกณฑ์ต้องไม่ซ้ำกับชุดเกณฑ์ที่มีอยู่ในระบบ
            </p>
          </div>

          {/* Card 2: Sub-Criteria Items */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/70">
              <div>
                <h3 className="text-base font-semibold text-foreground">รายการเกณฑ์ย่อย</h3>
                <p className="text-xs text-muted-foreground">
                  ทั้งหมด {subCriteria.length} ข้อ (แบบคำนวณคะแนน {scoredCount} ข้อ)
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

            {/* List Rows */}
            <div className="space-y-3">
              {subCriteria.map((row) => (
                <div
                  key={row.tempId}
                  className={`border rounded-2xl p-4 sm:p-5 transition-all shadow-2xs ${
                    row.type === 'SCORED'
                      ? 'bg-background border-border/80 hover:border-border'
                      : 'bg-muted/20 border-dashed border-border/80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-2 text-muted-foreground/60 cursor-grab hover:text-foreground hidden sm:block">
                      <GripVertical className="h-4 w-4" />
                    </div>

                    <div className="flex-1 space-y-3">
                      {/* Badge / Index */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-muted-foreground bg-muted/70 px-2 py-0.5 rounded-md">
                            ข้อที่ {row.sortOrder}
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs ${
                              row.type === 'SCORED'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                            }`}
                          >
                            {row.type === 'SCORED' ? 'คำนวณคะแนน' : 'กล่องความคิดเห็น'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.tempId)}
                          disabled={subCriteria.length <= 1}
                          title="ลบหัวข้อนี้"
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Title & Max Score inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        <div className={row.type === 'SCORED' ? 'sm:col-span-8' : 'sm:col-span-12'}>
                          <input
                            type="text"
                            required
                            value={row.title}
                            onChange={(e) => handleUpdateRow(row.tempId, { title: e.target.value })}
                            placeholder="ระบุหัวข้อเกณฑ์การประเมิน เช่น ความประพฤติและจิตอาสา..."
                            className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                          />
                        </div>

                        {row.type === 'SCORED' && (
                          <div className="sm:col-span-4 flex items-center justify-between sm:justify-start gap-2 bg-muted/30 sm:bg-transparent p-2 sm:p-0 rounded-xl">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">คะแนนเต็ม:</span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                required
                                value={row.maxScore || ''}
                                onChange={(e) =>
                                  handleUpdateRow(row.tempId, {
                                    maxScore: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-20 px-2.5 py-1.5 text-right font-mono font-bold text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                              />
                              <span className="text-xs text-muted-foreground font-medium">คะแนน</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Comment Allowance Checkbox */}
                      {row.type === 'SCORED' && (
                        <div className="flex items-center gap-2.5 pt-1">
                          <input
                            id={`comment-${row.tempId}`}
                            type="checkbox"
                            checked={row.allowComment}
                            onChange={(e) => handleUpdateRow(row.tempId, { allowComment: e.target.checked })}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                          />
                          <label
                            htmlFor={`comment-${row.tempId}`}
                            className="text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                          >
                            เปิดให้กรรมการบันทึกความคิดเห็นหรือคำแนะนำเพิ่มเติมในหัวข้อนี้
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Score Counter (Sticky Desktop / Bottom Floating Bar Mobile) */}
        <div className="lg:col-span-4 sticky top-20 flex flex-col gap-4">
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                คะแนนรวมทั้งหมด
              </h3>
              <span className="text-xs font-mono text-muted-foreground">เป้าหมาย 100</span>
            </div>

            {/* Score Highlight Box */}
            <div
              className={`rounded-2xl p-6 text-center border transition-all duration-300 ${
                isScoreValid
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 shadow-sm ring-4 ring-emerald-500/10'
                  : totalScore > 100
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-800'
                  : 'bg-amber-500/10 border-amber-500/40 text-amber-800'
              }`}
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                ผลรวมคะแนนปัจจุบัน
              </div>
              <div className="text-5xl font-black font-mono tracking-tight transition-transform duration-200">
                {totalScore}
                <span className="text-base font-normal text-muted-foreground ml-1.5">/ 100</span>
              </div>
              <div className="mt-3.5 text-xs font-semibold">
                {isScoreValid ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> ผลรวมครบ 100 คะแนนพอดี
                  </span>
                ) : totalScore > 100 ? (
                  <span className="inline-flex items-center gap-1.5 text-rose-700">
                    <AlertCircle className="h-4 w-4 text-rose-600" /> คะแนนเกิน 100 ไป {totalScore - 100} คะแนน
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-amber-700">
                    <AlertCircle className="h-4 w-4 text-amber-600" /> ยังขาดอีก {100 - totalScore} คะแนน
                  </span>
                )}
              </div>
            </div>

            {/* Quality Checklist */}
            <div className="space-y-2 text-xs bg-muted/30 p-3.5 rounded-xl border border-border/60">
              <div className="font-semibold text-foreground">เงื่อนไขความสมบูรณ์ของชุดเกณฑ์:</div>
              <ul className="space-y-1.5 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className={name.trim().length > 0 ? 'text-emerald-600 font-bold' : 'text-zinc-400'}>✓</span>
                  ระบุชื่อชุดเกณฑ์การประเมิน
                </li>
                <li className="flex items-center gap-2">
                  <span className={hasAtLeastOneScored ? 'text-emerald-600 font-bold' : 'text-zinc-400'}>✓</span>
                  มีเกณฑ์คำนวณคะแนนอย่างน้อย 1 ข้อ
                </li>
                <li className="flex items-center gap-2">
                  <span className={isScoreValid ? 'text-emerald-600 font-bold' : 'text-zinc-400'}>✓</span>
                  ผลรวมคะแนนเท่ากับ 100 คะแนนพอดี
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="submit"
                disabled={!isFormValid || saving}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                {saving ? 'กำลังบันทึกข้อมูล...' : 'บันทึกเกณฑ์การประเมิน'}
              </button>
              <Link
                href="/admin/evaluation-criteria"
                className="w-full text-center py-2 text-xs text-muted-foreground hover:text-foreground transition"
              >
                ยกเลิกและย้อนกลับ
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
