'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Input,
  Select,
  Alert,
  Badge,
} from '@/components/ui';
import {
  Award,
  CheckCircle2,
  Plus,
  Layers,
  ArrowLeft,
  Sliders,
  AlertCircle,
  Check,
  FileText,
  Target,
} from 'lucide-react';
import { createScholarshipType } from '@/services/scholarship-types.service';
import { fetchCriteriaList } from '@/services/criteria.service';
import { CriteriaDetail } from '@/types/criteria';
import { CreateScholarshipTypePayload } from '@/types/scholarship-type';

export default function CreateScholarshipTypePage() {
  const router = useRouter();

  // Basic Information State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Criteria State (ผูกเกณฑ์ที่มีในระบบ)
  const [criteriaList, setCriteriaList] = useState<CriteriaDetail[]>([]);
  const [selectedCriteriaId, setSelectedCriteriaId] = useState<number | undefined>(undefined);
  const [loadingCriteria, setLoadingCriteria] = useState(false);

  // Validation & Form Status
  const [nameError, setNameError] = useState<string | null>(null);
  const [criteriaError, setCriteriaError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdTypeName, setCreatedTypeName] = useState('');
  const [createdCriteriaName, setCreatedCriteriaName] = useState<string | null>(null);

  // Load Existing Criteria List
  const loadCriteria = useCallback(async () => {
    try {
      setLoadingCriteria(true);
      const res = await fetchCriteriaList({ limit: 100 });
      const items = res.data || [];
      setCriteriaList(items);
      if (items.length > 0 && selectedCriteriaId === undefined) {
        setSelectedCriteriaId(items[0].id);
      }
    } catch (err: unknown) {
      console.warn('Failed to load criteria list:', err);
    } finally {
      setLoadingCriteria(false);
    }
  }, [selectedCriteriaId]);

  useEffect(() => {
    void loadCriteria();
  }, [loadCriteria]);

  // Selected Existing Criteria Detail
  const selectedCriteria = useMemo(() => {
    if (!selectedCriteriaId) return null;
    return criteriaList.find((c) => c.id === selectedCriteriaId) ?? null;
  }, [criteriaList, selectedCriteriaId]);

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('กรุณาระบุชื่อประเภททุนการศึกษา');
      const el = document.getElementById('type-name');
      if (el) el.focus();
      return;
    }
    setNameError(null);
    setCriteriaError(null);
    setSubmitError(null);

    if (!selectedCriteriaId) {
      setCriteriaError('กรุณาเลือกเกณฑ์การประเมินเริ่มต้นที่ต้องการผูกกับประเภททุนนี้');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateScholarshipTypePayload = {
        name: trimmedName,
        description: description.trim() || undefined,
        defaultCriteriaId: selectedCriteriaId,
      };

      const res = await createScholarshipType(payload);
      if (res && res.data) {
        setCreatedTypeName(res.data.name);
        setCreatedCriteriaName(
          res.data.defaultCriteria?.name || selectedCriteria?.name || null,
        );
        setIsSuccess(true);
      } else {
        throw new Error('ไม่ได้รับข้อมูลตอบกลับจากการสร้างประเภททุน');
      }
    } catch (err: unknown) {
      console.error('Create scholarship type error:', err);
      const msg =
        err instanceof Error
          ? err.message
          : 'เกิดข้อผิดพลาดในการสร้างประเภททุน กรุณาลองใหม่อีกครั้ง';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setName('');
    setDescription('');
    setNameError(null);
    setCriteriaError(null);
    setSubmitError(null);
    setIsSuccess(false);
    setCreatedTypeName('');
    setCreatedCriteriaName(null);
    if (criteriaList.length > 0) {
      setSelectedCriteriaId(criteriaList[0].id);
    }
  };

  // Success View
  if (isSuccess) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-16">
        <PageHeader
          title="สร้างประเภททุนการศึกษาสำเร็จ"
          backHref="/admin/scholarship-types"
          backLabel="กลับสู่หน้ารายการประเภททุน"
        />

        <Card className="border-emerald-200/80 bg-emerald-50/40 p-8 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-xs">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-bold text-foreground">
              สร้างประเภททุน &ldquo;{createdTypeName}&rdquo; เรียบร้อยแล้ว
            </h3>
            {createdCriteriaName && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mx-auto">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  ผูกเกณฑ์การประเมินเริ่มต้น: <strong>{createdCriteriaName}</strong>
                </span>
              </div>
            )}
            <p className="text-sm text-muted-foreground max-w-md mx-auto pt-1">
              เมื่อสร้างรอบทุนและเลือกประเภททุนนี้ ระบบจะดึงเกณฑ์คะแนนนี้มาใช้งานโดยอัตโนมัติทันที
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetForm}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              สร้างประเภททุนอื่นต่อ
            </Button>
            <Button
              type="button"
              onClick={() => router.push('/admin/scholarship-types')}
              leftIcon={<Layers className="h-4 w-4" />}
            >
              ดูรายการประเภททุนทั้งหมด
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/admin/scholarship-rounds/create')}
              leftIcon={<Sliders className="h-4 w-4" />}
            >
              ไปสร้างรอบทุนการศึกษา
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-16">
      {/* Standard Header */}
      <PageHeader
        title="สร้างประเภททุนการศึกษาใหม่"
        backHref="/admin/scholarship-types"
        backLabel="กลับสู่หน้ารายการประเภททุน"
      />

      {/* Global Error Banner */}
      {submitError && (
        <Alert variant="destructive" title="ไม่สามารถสร้างประเภททุนได้">
          <p className="text-xs text-destructive/90 mt-1">{submitError}</p>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Section 1: ข้อมูลทั่วไปของประเภททุน */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>1. ข้อมูลทั่วไปของประเภททุน</CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Scholarship Type Name */}
            <div className="space-y-2">
              <label htmlFor="type-name" className="text-xs font-semibold text-foreground flex items-center gap-1">
                ชื่อประเภททุนการศึกษา <span className="text-destructive">*</span>
              </label>
              <Input
                id="type-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                placeholder="เช่น ทุนเรียนดีเด่น, ทุนช่วยเหลือนักศึกษาขาดแคลนทุนทรัพย์, ทุนกิจกรรมดีเด่น"
                error={nameError || undefined}
              />
            </div>

            {/* Description / Objectives */}
            <div className="space-y-2">
              <label htmlFor="type-desc" className="text-xs font-semibold text-foreground flex items-center gap-1">
                คำอธิบาย<span className="text-muted-foreground font-normal">(ไม่บังคับ)</span>
              </label>
              <textarea
                id="type-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="อธิบายวัตถุประสงค์ คุณสมบัติทั่วไป หรือกลุ่มเป้าหมายของทุนประเภทนี้"
                className="w-full rounded-xl border border-border bg-background/60 px-3.5 py-2.5 text-sm text-foreground transition-all duration-150 placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: ผูกเกณฑ์การประเมินเริ่มต้น (Default Evaluation Criteria) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>2. ผูกเกณฑ์การประเมินเริ่มต้น (Default Criteria)</CardTitle>
                </div>
              </div>

              {selectedCriteria && (
                <Badge variant="outline" className="text-xs font-mono font-bold bg-blue-50 text-blue-700 border-blue-200">
                  คะแนนเต็ม {selectedCriteria.targetScore} คะแนน ({selectedCriteria.subCriteria?.length || 0} หัวข้อ)
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Error Message for Criteria Section */}
            {criteriaError && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2 shadow-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{criteriaError}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="criteria-select" className="text-xs font-semibold text-foreground flex items-center gap-1">
                เลือกชุดเกณฑ์การประเมิน <span className="text-destructive">*</span>
              </label>

              {loadingCriteria ? (
                <div className="p-4 rounded-xl border border-border bg-muted/20 text-xs text-muted-foreground animate-pulse flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                  กำลังโหลดรายการเกณฑ์ในระบบ...
                </div>
              ) : criteriaList.length === 0 ? (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 text-xs text-amber-800 space-y-2">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    ยังไม่มีชุดเกณฑ์การประเมินในระบบ
                  </p>
                  <p className="text-[11px] text-amber-700">
                    กรุณาสร้างชุดเกณฑ์การประเมินในหน้าระบบจัดการเกณฑ์ก่อน จึงจะสามารถสร้างประเภททุนและผูกเกณฑ์ได้
                  </p>
                  <Link href="/admin/criteria">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      leftIcon={<Layers className="h-3.5 w-3.5" />}
                    >
                      ไปยังหน้าระบบจัดการเกณฑ์
                    </Button>
                  </Link>
                </div>
              ) : (
                <Select
                  id="criteria-select"
                  value={selectedCriteriaId || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setSelectedCriteriaId(val || undefined);
                    setCriteriaError(null);
                  }}
                >
                  {criteriaList.map((crit) => (
                    <option key={crit.id} value={crit.id}>
                      {crit.name} (เป้าหมาย {crit.targetScore} คะแนน, {crit.subCriteria?.length || 0} หัวข้อย่อย)
                    </option>
                  ))}
                </Select>
              )}
            </div>

            {/* Selected Criteria Summary Preview Card */}
            {selectedCriteria && (
              <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold text-foreground">
                      พรีวิวเกณฑ์ที่ผูก: {selectedCriteria.name}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono font-bold bg-background">
                    เป้าหมาย {selectedCriteria.targetScore} คะแนน
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] text-muted-foreground font-medium block">
                    หัวข้อเกณฑ์ย่อย ({selectedCriteria.subCriteria?.length || 0} ข้อ):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {selectedCriteria.subCriteria?.map((sub, idx) => (
                      <div
                        key={sub.id || idx}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-background/80 text-xs"
                      >
                        <span className="truncate pr-2 font-medium text-foreground" title={sub.title}>
                          {idx + 1}. {sub.title}
                        </span>
                        {sub.type === 'SCORED' ? (
                          <Badge variant="secondary" className="text-[10px] shrink-0 font-mono">
                            <Target className="h-3 w-3 mr-1 text-primary" />
                            {sub.maxScore} คะแนน
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] shrink-0 text-muted-foreground">
                            <FileText className="h-3 w-3 mr-1" />
                            ข้อความ
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          {/* Form Actions Footer */}
          <CardFooter className="flex items-center justify-between pt-4 border-t border-border/70">
            <Link href="/admin/scholarship-types">
              <Button type="button" variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                ยกเลิก
              </Button>
            </Link>

            <Button
              type="submit"
              disabled={isSubmitting || (criteriaList.length === 0 && !loadingCriteria)}
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'สร้างประเภททุนการศึกษา'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
