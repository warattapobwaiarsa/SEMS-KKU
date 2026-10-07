'use client';

import React, { useState, useEffect } from 'react';
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
  MessageSquare
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

  useEffect(() => {
    if (!criteriaId) return;
    const load = async () => {
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
    };
    load();
  }, [criteriaId]);

  const totalScore = subCriteria
    .filter((row) => row.type === 'SCORED')
    .reduce((sum, row) => sum + (Number(row.maxScore) || 0), 0);

  const isLocked = criteria?.isLocked || false;
  const isScoreValid = totalScore === 100;
  const scoredCount = subCriteria.filter((r) => r.type === 'SCORED').length;
  const hasAtLeastOneScored = scoredCount > 0;
  const isFormValid = name.trim().length > 0 && isScoreValid && hasAtLeastOneScored && !isLocked;

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

  const handleUpdateRow = (tempId: string, updates: Partial<SubCriteriaRow>) => {
    if (isLocked) return;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-4">
        <Link
          href="/admin/evaluation-criteria"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับสู่หน้ารายการเกณฑ์การประเมิน
        </Link>
        <div className="flex items-center gap-2">
          {isLocked ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
              <Lock className="h-3.5 w-3.5" />
              เกณฑ์ถูกล็อก (ใช้งานในรอบทุน Open/Closed แล้ว)
            </span>
          ) : isScoreValid ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              สถานะ: พร้อมบันทึก (100 คะแนน)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-300">
              <AlertCircle className="h-3.5 w-3.5" />
              สถานะ: ขาด/เกิน {Math.abs(100 - totalScore)} คะแนน
            </span>
          )}
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {isLocked ? 'รายละเอียดเกณฑ์การประเมิน' : 'แก้ไขเกณฑ์การประเมิน'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          รหัสอ้างอิง: CRT-{criteriaId.toString().padStart(4, '0')}
        </p>
      </div>

      {isLocked && (
        <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm text-slate-800 flex items-start gap-3">
          <Lock className="h-5 w-5 shrink-0 mt-0.5 text-slate-600" />
          <div>
            <h4 className="font-semibold text-slate-900">เกณฑ์นี้ถูกล็อกการแก้ไขตามกฎ BR-CRT-09</h4>
            <p className="mt-0.5 text-slate-600">
              เนื่องจากชุดเกณฑ์นี้ถูกนำไปใช้ในรอบทุนที่เปิดรับประเมิน (Open) หรือปิดรอบแล้ว (Closed) เพื่อรักษาความถูกต้องของข้อมูลประเมิน หากต้องการเปลี่ยนแปลงเกณฑ์ ให้สร้างชุดเกณฑ์ใหม่
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold">เกิดข้อผิดพลาด</h4>
            <p className="mt-0.5">{errorMessage}</p>
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
              {subCriteria.map((row) => (
                <div
                  key={row.tempId}
                  className={`border rounded-xl p-4 transition ${
                    row.type === 'SCORED' ? 'bg-background border-border' : 'bg-muted/20 border-border/70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!isLocked && (
                      <div className="mt-2 text-muted-foreground cursor-grab">
                        <GripVertical className="h-4 w-4" />
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
                              className="w-20 px-2 py-1.5 text-right font-mono font-semibold text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-muted disabled:text-muted-foreground transition"
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
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 sticky top-20 flex flex-col gap-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-5">
            <h3 className="text-base font-semibold text-foreground border-b border-border pb-3">
              ผลรวมคะแนนเกณฑ์
            </h3>

            <div
              className={`rounded-xl p-5 text-center border transition ${
                isScoreValid
                  ? 'bg-emerald-50/60 border-emerald-300 text-emerald-800'
                  : 'bg-rose-50/60 border-rose-300 text-rose-800'
              }`}
            >
              <div className="text-xs font-medium uppercase tracking-wider mb-1">คะแนนรวม</div>
              <div className="text-5xl font-extrabold font-mono tracking-tight">
                {totalScore}
                <span className="text-lg font-normal ml-1">/ 100</span>
              </div>
            </div>

            {/* Rounds Using This Criteria */}
            {criteria?.usedByRounds && criteria.usedByRounds.length > 0 && (
              <div className="space-y-2 text-xs border-t border-border pt-3">
                <div className="font-semibold text-foreground">รอบทุนที่นำเกณฑ์ไปใช้:</div>
                <div className="flex flex-col gap-1.5">
                  {criteria.usedByRounds.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border text-xs"
                    >
                      <span className="font-medium">{r.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-background border font-mono">
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isLocked && (
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={!isFormValid || saving}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
