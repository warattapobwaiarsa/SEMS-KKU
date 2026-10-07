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
  MessageSquare
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
      title: 'ความเห็นเพิ่มเติมของคณะกรรมการสัมภาษณ์',
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
    // Re-assign sortOrder
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
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-16">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-4">
        <Link
          href="/admin/evaluation-criteria"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับสู่หน้ารายการเกณฑ์การประเมิน
        </Link>
        <div className="flex items-center gap-2">
          {isScoreValid ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              สถานะ: คะแนนครบ 100 คะแนน (พร้อมบันทึก)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-300">
              <AlertCircle className="h-3.5 w-3.5" />
              สถานะ: ขาด/เกิน {Math.abs(100 - totalScore)} คะแนน (ต้องได้ 100 พอดี)
            </span>
          )}
        </div>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          สร้างเกณฑ์การประเมินใหม่
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          กำหนดชุดเกณฑ์การประเมิน สัดส่วนคะแนน และหัวข้อความคิดเห็นสำหรับคณะกรรมการ (BR-CRT-01 ถึง BR-CRT-06)
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold">ไม่สามารถบันทึกเกณฑ์ได้</h4>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Builder Form + Live Score Sticky Card */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Builder (8 Cols) */}
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
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น เกณฑ์ทุนการศึกษาทั่วไป ประจำปีการศึกษา 2569"
                className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                ชื่อเกณฑ์ต้องไม่ซ้ำกับชุดเกณฑ์ที่มีอยู่ในระบบ (BR-CRT-01)
              </p>
            </div>
          </div>

          {/* Card 2: Sub-Criteria List */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-semibold text-foreground">รายการเกณฑ์ย่อย</h3>
                <p className="text-xs text-muted-foreground">
                  ทั้งหมด {subCriteria.length} รายการ (แบบมีคะแนน {scoredCount} ข้อ)
                </p>
              </div>
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
            </div>

            {/* Sub-Criteria Rows */}
            <div className="space-y-3">
              {subCriteria.map((row) => (
                <div
                  key={row.tempId}
                  className={`border rounded-xl p-4 transition ${
                    row.type === 'SCORED' ? 'bg-background border-border' : 'bg-muted/20 border-border/70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-2 text-muted-foreground cursor-grab">
                      <GripVertical className="h-4 w-4" />
                    </div>

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
                            required
                            value={row.title}
                            onChange={(e) => handleUpdateRow(row.tempId, { title: e.target.value })}
                            placeholder="ระบุหัวข้อเกณฑ์ย่อย เช่น ผลการเรียน..."
                            className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                          />
                        </div>

                        {row.type === 'SCORED' && (
                          <div className="sm:col-span-4 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">คะแนนเต็ม:</span>
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
                              className="w-20 px-2 py-1.5 text-right font-mono font-semibold text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
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
                            checked={row.allowComment}
                            onChange={(e) => handleUpdateRow(row.tempId, { allowComment: e.target.checked })}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                          />
                          <label
                            htmlFor={`comment-${row.tempId}`}
                            className="text-xs text-muted-foreground cursor-pointer select-none"
                          >
                            อนุญาตให้กรรมการกรอกความคิดเห็นเพิ่มเติมในข้อนี้
                          </label>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveRow(row.tempId)}
                      disabled={subCriteria.length <= 1}
                      title="ลบเกณฑ์ย่อยนี้"
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Score Counter & Summary (4 Cols Sticky) */}
        <div className="lg:col-span-4 sticky top-20 flex flex-col gap-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-5">
            <h3 className="text-base font-semibold text-foreground border-b border-border pb-3">
              ผลรวมคะแนนเกณฑ์ (Live Summary)
            </h3>

            {/* Score Display Box */}
            <div
              className={`rounded-xl p-5 text-center border transition ${
                isScoreValid
                  ? 'bg-emerald-50/60 border-emerald-300 text-emerald-800'
                  : totalScore > 100
                  ? 'bg-rose-50/60 border-rose-300 text-rose-800'
                  : 'bg-amber-50/60 border-amber-300 text-amber-800'
              }`}
            >
              <div className="text-xs font-medium uppercase tracking-wider mb-1">
                คะแนนรวมปัจจุบัน
              </div>
              <div className="text-5xl font-extrabold font-mono tracking-tight">
                {totalScore}
                <span className="text-lg font-normal ml-1">/ 100</span>
              </div>
              <div className="mt-3 text-xs font-semibold">
                {isScoreValid ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> คะแนนครบ 100 คะแนนพอดี
                  </span>
                ) : totalScore > 100 ? (
                  <span className="inline-flex items-center gap-1 text-rose-700">
                    <AlertCircle className="h-4 w-4" /> คะแนนเกินกำหนดไป {totalScore - 100} คะแนน
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700">
                    <AlertCircle className="h-4 w-4" /> ยังขาดอีก {100 - totalScore} คะแนน
                  </span>
                )}
              </div>
            </div>

            {/* Rules Checklist */}
            <div className="space-y-2 text-xs">
              <div className="font-semibold text-foreground">เงื่อนไขการสร้างเกณฑ์ (Business Rules):</div>
              <ul className="space-y-1.5 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className={name.trim().length > 0 ? 'text-emerald-600' : 'text-zinc-400'}>●</span>
                  ระบุชื่อเกณฑ์การประเมิน
                </li>
                <li className="flex items-center gap-2">
                  <span className={hasAtLeastOneScored ? 'text-emerald-600' : 'text-zinc-400'}>●</span>
                  มีเกณฑ์แบบมีคะแนนอย่างน้อย 1 ข้อ
                </li>
                <li className="flex items-center gap-2">
                  <span className={isScoreValid ? 'text-emerald-600' : 'text-zinc-400'}>●</span>
                  ผลรวมเกณฑ์แบบมีคะแนนเท่ากับ 100 คะแนนพอดี
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={!isFormValid || saving}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                {saving ? 'กำลังบันทึก...' : 'บันทึกเกณฑ์การประเมิน'}
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
