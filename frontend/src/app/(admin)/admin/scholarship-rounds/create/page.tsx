'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createRound } from '@/services/rounds.service';
import { fetchCriteriaList } from '@/services/criteria.service';
import { CriteriaDetail } from '@/types/criteria';
import { 
  ArrowLeft, 
  Save, 
  AlertCircle, 
  Layers
} from 'lucide-react';

export default function CreateScholarshipRoundPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [academicYear, setAcademicYear] = useState<number>(2569);
  const [semester, setSemester] = useState<number>(1);
  const [criteriaId, setCriteriaId] = useState<number | undefined>(undefined);
  const [criteriaList, setCriteriaList] = useState<CriteriaDetail[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadCriteria = async () => {
      try {
        const res = await fetchCriteriaList({ limit: 100 });
        setCriteriaList(res.data);
      } catch (err: unknown) {
        console.warn('Failed to load criteria list for selection:', err);
      }
    };
    void loadCriteria();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;

    try {
      setSaving(true);
      setErrorMessage(null);

      const payload = {
        name: name.trim(),
        academicYear: Number(academicYear),
        semester: Number(semester),
        criteriaId: criteriaId ? Number(criteriaId) : undefined,
      };

      const res = await createRound(payload);
      router.push(`/admin/scholarship-rounds/${res.data.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างรอบทุน';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-16">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between border-b border-border/70 pb-4">
        <Link
          href="/admin/scholarship-rounds"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition hover:-translate-x-0.5"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับสู่หน้ารายการรอบทุนการศึกษา
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
          สร้างรอบทุนการศึกษาใหม่
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          กำหนดชื่อรอบทุน ปีการศึกษา ภาคเรียน และเลือกผูกชุดเกณฑ์การประเมิน (สถานะเริ่มต้น: ร่าง DRAFT)
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-3 shadow-xs">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-destructive" />
          <div>
            <h4 className="font-semibold">ไม่สามารถสร้างรอบทุนได้</h4>
            <p className="mt-0.5 text-xs text-destructive/90">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Field 1: Name */}
        <div className="space-y-1.5">
          <label htmlFor="roundName" className="block text-sm font-semibold text-foreground">
            ชื่อรอบทุนการศึกษา <span className="text-destructive">*</span>
          </label>
          <input
            id="roundName"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น ทุนการศึกษาเพื่อการพัฒนาศักยภาพนักศึกษา ประจำภาคเรียนที่ 1/2569"
            className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </div>

        {/* Field 2 & 3: Year and Semester */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="academicYear" className="block text-sm font-semibold text-foreground">
              ปีการศึกษา (พ.ศ.) <span className="text-destructive">*</span>
            </label>
            <input
              id="academicYear"
              type="number"
              min={2550}
              max={2700}
              required
              value={academicYear}
              onChange={(e) => setAcademicYear(parseInt(e.target.value) || 2569)}
              className="w-full px-4 py-2.5 text-sm font-mono bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="semester" className="block text-sm font-semibold text-foreground">
              ภาคการศึกษา <span className="text-destructive">*</span>
            </label>
            <select
              id="semester"
              value={semester}
              onChange={(e) => setSemester(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition cursor-pointer"
            >
              <option value={1}>ภาคเรียนที่ 1</option>
              <option value={2}>ภาคเรียนที่ 2</option>
            </select>
          </div>
        </div>

        {/* Field 4: Criteria Selection */}
        <div className="space-y-1.5 pt-2 border-t border-border/60">
          <label htmlFor="criteriaSelect" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-primary" />
            เชื่อมโยงชุดเกณฑ์การประเมิน (ผูกภายหลังได้)
          </label>
          <select
            id="criteriaSelect"
            value={criteriaId ?? ''}
            onChange={(e) => setCriteriaId(e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition cursor-pointer"
          >
            <option value="">-- ยังไม่ระบุเกณฑ์การประเมิน (เลือกภายหลัง) --</option>
            {criteriaList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.totalScore} คะแนน, {c.subCriteria.length} เกณฑ์ย่อย)
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-border/60">
          <Link
            href="/admin/scholarship-rounds"
            className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {saving ? 'กำลังสร้างรอบทุน...' : 'สร้างรอบทุนการศึกษา'}
          </button>
        </div>
      </form>
    </div>
  );
}
