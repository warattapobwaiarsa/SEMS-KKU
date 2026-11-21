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
  Sparkles,
  AlertCircle,
  Check,
  FileText,
  Target,
  MinusCircle,
  HelpCircle,
} from 'lucide-react';
import { createScholarshipType } from '@/services/scholarship-types.service';
import { fetchCriteriaList } from '@/services/criteria.service';
import { CriteriaDetail } from '@/types/criteria';
import {
  CreateScholarshipTypePayload,
  NestedSubCriteriaItem,
} from '@/types/scholarship-type';
import { CriteriaBuilder } from '@/components/scholarship-types/criteria-builder';

type CriteriaMode = 'EXISTING' | 'NEW' | 'NONE';
type PresetTemplate = 'need' | 'merit' | 'activity' | 'single';

export default function CreateScholarshipTypePage() {
  const router = useRouter();

  // Basic Information State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Criteria Configuration State
  const [criteriaMode, setCriteriaMode] = useState<CriteriaMode>('EXISTING');

  // Mode 1: Existing Criteria
  const [criteriaList, setCriteriaList] = useState<CriteriaDetail[]>([]);
  const [selectedCriteriaId, setSelectedCriteriaId] = useState<number | undefined>(undefined);
  const [loadingCriteria, setLoadingCriteria] = useState(false);

  // Mode 2: New Criteria Builder
  const [customCriteriaName, setCustomCriteriaName] = useState('');
  const [customTargetScore, setCustomTargetScore] = useState<number>(100);
  const [activeTemplate, setActiveTemplate] = useState<PresetTemplate | 'custom'>('need');
  const [customSubCriteria, setCustomSubCriteria] = useState<NestedSubCriteriaItem[]>([
    { sortOrder: 1, title: 'รายได้เฉลี่ยต่อครอบครัวต่อปี', type: 'SCORED', maxScore: 40, allowComment: true },
    { sortOrder: 2, title: 'ภาระหนี้สินและความจำเป็นเร่งด่วน', type: 'SCORED', maxScore: 30, allowComment: true },
    { sortOrder: 3, title: 'ผลการเรียนเฉลี่ยและความประพฤติ', type: 'SCORED', maxScore: 30, allowComment: true },
    { sortOrder: 4, title: 'ความคิดเห็นเพิ่มเติมของคณะกรรมการ', type: 'TEXT', maxScore: null, allowComment: false },
  ]);

  // Validation & Form Status
  const [nameError, setNameError] = useState<string | null>(null);
  const [criteriaError, setCriteriaError] = useState<string | null>(null);
  const [customCriteriaNameError, setCustomCriteriaNameError] = useState<string | null>(null);
  const [emptyRowIndices, setEmptyRowIndices] = useState<number[]>([]);
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

  // Auto-suggest Criteria Name when Scholarship Type Name changes
  const handleNameChange = (val: string) => {
    setName(val);
    if (nameError) setNameError(null);

    // Auto-update custom criteria name if it wasn't manually customized or was using default prefix
    if (!customCriteriaName.trim() || customCriteriaName.startsWith('เกณฑ์มาตรฐาน ')) {
      setCustomCriteriaName(val.trim() ? `เกณฑ์มาตรฐาน ${val.trim()}` : '');
    }
  };

  // Preset Template Helper
  const applyPresetTemplate = (tpl: PresetTemplate) => {
    setActiveTemplate(tpl);
    setCriteriaError(null);
    setEmptyRowIndices([]);

    switch (tpl) {
      case 'need':
        setCustomSubCriteria([
          { sortOrder: 1, title: 'รายได้เฉลี่ยต่อครอบครัวต่อปี', type: 'SCORED', maxScore: 40, allowComment: true },
          { sortOrder: 2, title: 'ภาระหนี้สินและจำนวนพี่น้องที่กำลังศึกษา', type: 'SCORED', maxScore: 30, allowComment: true },
          { sortOrder: 3, title: 'สภาพที่พักอาศัยและความจำเป็นเร่งด่วน', type: 'SCORED', maxScore: 30, allowComment: true },
          { sortOrder: 4, title: 'ความคิดเห็นเพิ่มเติมของคณะกรรมการ', type: 'TEXT', maxScore: null, allowComment: false },
        ]);
        setCustomTargetScore(100);
        break;
      case 'merit':
        setCustomSubCriteria([
          { sortOrder: 1, title: 'ผลการเรียนเฉลี่ยสะสม (GPAX)', type: 'SCORED', maxScore: 50, allowComment: false },
          { sortOrder: 2, title: 'รางวัลหรือผลงานทางวิชาการ', type: 'SCORED', maxScore: 30, allowComment: true },
          { sortOrder: 3, title: 'การนำเสนอผลงานและปฏิภาณไหวพริบ', type: 'SCORED', maxScore: 20, allowComment: true },
          { sortOrder: 4, title: 'ข้อคิดเห็นของอาจารย์ที่ปรึกษา', type: 'TEXT', maxScore: null, allowComment: false },
        ]);
        setCustomTargetScore(100);
        break;
      case 'activity':
        setCustomSubCriteria([
          { sortOrder: 1, title: 'ประวัติการเป็นผู้นำองค์กรนักศึกษาหรือสโมสร', type: 'SCORED', maxScore: 40, allowComment: true },
          { sortOrder: 2, title: 'ชั่วโมงจิตอาสาและการบำเพ็ญประโยชน์', type: 'SCORED', maxScore: 40, allowComment: true },
          { sortOrder: 3, title: 'การสัมภาษณ์ทัศนคติและมนุษยสัมพันธ์', type: 'SCORED', maxScore: 20, allowComment: true },
          { sortOrder: 4, title: 'แฟ้มสะสมผลงาน (Portfolio) ข้อคิดเห็น', type: 'TEXT', maxScore: null, allowComment: false },
        ]);
        setCustomTargetScore(100);
        break;
      case 'single':
        setCustomSubCriteria([
          { sortOrder: 1, title: 'คะแนนการพิจารณารวมของคณะกรรมการ', type: 'SCORED', maxScore: 100, allowComment: true },
          { sortOrder: 2, title: 'ข้อคิดเห็นและข้อเสนอแนะเพิ่มเติม', type: 'TEXT', maxScore: null, allowComment: false },
        ]);
        setCustomTargetScore(100);
        break;
    }
  };

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
    setCustomCriteriaNameError(null);
    setSubmitError(null);

    // Validation for Criteria Mode
    if (criteriaMode === 'EXISTING') {
      if (!selectedCriteriaId && criteriaList.length > 0) {
        setCriteriaError('กรุณาเลือกเกณฑ์การประเมินเริ่มต้นที่ต้องการผูกกับประเภททุนนี้');
        return;
      }
    } else if (criteriaMode === 'NEW') {
      const critName = customCriteriaName.trim() || `เกณฑ์มาตรฐาน ${trimmedName}`;
      if (!critName) {
        setCustomCriteriaNameError('กรุณาระบุชื่อชุดเกณฑ์การประเมิน');
        return;
      }

      const scoredItems = customSubCriteria.filter((s) => s.type === 'SCORED');
      if (scoredItems.length === 0) {
        setCriteriaError('เกณฑ์การประเมินต้องมีเกณฑ์ย่อยแบบมีคะแนนอย่างน้อย 1 ข้อ');
        return;
      }

      const sum = scoredItems.reduce((acc, c) => acc + (Number(c.maxScore) || 0), 0);
      if (sum !== customTargetScore) {
        setCriteriaError(
          `ผลรวมคะแนนย่อย (${sum} คะแนน) ต้องเท่ากับคะแนนเป้าหมาย (${customTargetScore} คะแนน) พอดี (ปัจจุบันขาด/เกิน ${Math.abs(customTargetScore - sum)} คะแนน)`,
        );
        return;
      }

      const emptyIndices: number[] = [];
      customSubCriteria.forEach((s, idx) => {
        if (!s.title.trim()) emptyIndices.push(idx);
      });
      if (emptyIndices.length > 0) {
        setEmptyRowIndices(emptyIndices);
        setCriteriaError('กรุณากรอกชื่อเกณฑ์ย่อยให้ครบทุกข้อ (ห้ามเว้นว่าง)');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const payload: CreateScholarshipTypePayload = {
        name: trimmedName,
        description: description.trim() || undefined,
      };

      let criteriaDisplayName: string | null = null;

      if (criteriaMode === 'EXISTING' && selectedCriteriaId) {
        payload.defaultCriteriaId = selectedCriteriaId;
        const found = criteriaList.find((c) => c.id === selectedCriteriaId);
        criteriaDisplayName = found ? found.name : null;
      } else if (criteriaMode === 'NEW') {
        const finalCriteriaName = customCriteriaName.trim() || `เกณฑ์มาตรฐาน ${trimmedName}`;
        payload.criteria = {
          name: finalCriteriaName,
          targetScore: customTargetScore,
          subCriteria: customSubCriteria,
        };
        criteriaDisplayName = finalCriteriaName;
      }

      const res = await createScholarshipType(payload);
      if (res && res.data) {
        setCreatedTypeName(res.data.name);
        setCreatedCriteriaName(
          res.data.defaultCriteria?.name || criteriaDisplayName || null,
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
    setCustomCriteriaNameError(null);
    setSubmitError(null);
    setIsSuccess(false);
    setCreatedTypeName('');
    setCreatedCriteriaName(null);
    setCriteriaMode('EXISTING');
    if (criteriaList.length > 0) {
      setSelectedCriteriaId(criteriaList[0].id);
    }
    applyPresetTemplate('need');
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
            {createdCriteriaName ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mx-auto">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  ผูกเกณฑ์การประเมินเริ่มต้น: <strong>{createdCriteriaName}</strong>
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                (ประเภททุนนี้ยังไม่มีเกณฑ์เริ่มต้น โดยสามารถสร้างเกณฑ์เฉพาะรอบได้เมื่อเปิดรับสมัคร)
              </p>
            )}
            <p className="text-sm text-muted-foreground max-w-md mx-auto pt-1">
              เมื่อสร้างรอบทุนและเลือกประเภททุนนี้ ระบบจะดึงเกณฑ์คะแนนมาใช้งานโดยอัตโนมัติทันที
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
                onChange={(e) => handleNameChange(e.target.value)}
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
                  <CardTitle>2. เกณฑ์การประเมินเริ่มต้น (Default Criteria)</CardTitle>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {criteriaMode === 'EXISTING' && (
                  <Badge variant="outline" className="text-xs font-mono font-bold bg-blue-50 text-blue-700 border-blue-200">
                    เลือกจากเกณฑ์ที่มีในระบบ
                  </Badge>
                )}
                {criteriaMode === 'NEW' && (
                  <Badge variant="outline" className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                    สร้างเกณฑ์ใหม่ ({customTargetScore} คะแนน)
                  </Badge>
                )}
                {criteriaMode === 'NONE' && (
                  <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
                    ยังไม่กำหนดเกณฑ์
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Criteria Mode Selector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: Existing */}
              <label
                className={`flex flex-col justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  criteriaMode === 'EXISTING'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs'
                    : 'border-border bg-background hover:bg-muted/30'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-primary" />
                      เลือกจากเกณฑ์ที่มีในระบบ
                    </span>
                    <input
                      type="radio"
                      name="criteriaMode"
                      value="EXISTING"
                      checked={criteriaMode === 'EXISTING'}
                      onChange={() => {
                        setCriteriaMode('EXISTING');
                        setCriteriaError(null);
                      }}
                      className="text-primary focus:ring-primary"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    ผูกกับเกณฑ์มาตรฐานที่มีอยู่แล้วในระบบทันที
                  </p>
                </div>
              </label>

              {/* Option 2: New / Builder */}
              <label
                className={`flex flex-col justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  criteriaMode === 'NEW'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs'
                    : 'border-border bg-background hover:bg-muted/30'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-emerald-600" />
                      สร้างเกณฑ์ใหม่สำหรับประเภทนี้
                    </span>
                    <input
                      type="radio"
                      name="criteriaMode"
                      value="NEW"
                      checked={criteriaMode === 'NEW'}
                      onChange={() => {
                        setCriteriaMode('NEW');
                        setCriteriaError(null);
                      }}
                      className="text-primary focus:ring-primary"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    กำหนดหัวข้อเกณฑ์ย่อยและสัดส่วนคะแนนใหม่ตามต้องการ
                  </p>
                </div>
              </label>

              {/* Option 3: None */}
              <label
                className={`flex flex-col justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  criteriaMode === 'NONE'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs'
                    : 'border-border bg-background hover:bg-muted/30'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <MinusCircle className="h-4 w-4 text-muted-foreground" />
                      ยังไม่กำหนดเกณฑ์ในตอนนี้
                    </span>
                    <input
                      type="radio"
                      name="criteriaMode"
                      value="NONE"
                      checked={criteriaMode === 'NONE'}
                      onChange={() => {
                        setCriteriaMode('NONE');
                        setCriteriaError(null);
                      }}
                      className="text-primary focus:ring-primary"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    บันทึกประเภททุนไว้ก่อน แล้วกำหนดเกณฑ์เฉพาะรอบในภายหลัง
                  </p>
                </div>
              </label>
            </div>

            {/* Error Message for Criteria Section */}
            {criteriaError && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2 shadow-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{criteriaError}</span>
              </div>
            )}

            {/* Mode 1 Content: EXISTING */}
            {criteriaMode === 'EXISTING' && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label htmlFor="criteria-select" className="text-xs font-semibold text-foreground flex items-center gap-1">
                    ชุดเกณฑ์การประเมิน <span className="text-destructive">*</span>
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
                        คุณสามารถเลือกโหมด &ldquo;สร้างเกณฑ์ใหม่สำหรับประเภทนี้&rdquo; เพื่อสร้างเกณฑ์ชุดแรกได้ทันที
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setCriteriaMode('NEW')}
                        leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                      >
                        สลับไปสร้างเกณฑ์ใหม่
                      </Button>
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
                          พรีวิวเกณฑ์: {selectedCriteria.name}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs font-mono font-bold bg-background">
                        คะแนนเต็ม {selectedCriteria.targetScore} คะแนน
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
              </div>
            )}

            {/* Mode 2 Content: NEW */}
            {criteriaMode === 'NEW' && (
              <div className="space-y-5 pt-2 animate-in fade-in">
                {/* Preset Templates Quick Select Bar */}
                <div className="p-3.5 rounded-2xl border border-border/70 bg-muted/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      เลือกเทมเพลตเริ่มต้น (Preset Templates):
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      เลือกเพื่อโหลดโครงสร้างเกณฑ์มาตรฐาน KKU
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={activeTemplate === 'need' ? 'primary' : 'outline'}
                      onClick={() => applyPresetTemplate('need')}
                      className="text-xs h-8"
                    >
                      ทุนขาดแคลนทุนทรัพย์ (Need-based)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={activeTemplate === 'merit' ? 'primary' : 'outline'}
                      onClick={() => applyPresetTemplate('merit')}
                      className="text-xs h-8"
                    >
                      ทุนเรียนดีเด่น (Merit-based)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={activeTemplate === 'activity' ? 'primary' : 'outline'}
                      onClick={() => applyPresetTemplate('activity')}
                      className="text-xs h-8"
                    >
                      ทุนกิจกรรมจิตอาสา (Activity-based)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={activeTemplate === 'single' ? 'primary' : 'outline'}
                      onClick={() => applyPresetTemplate('single')}
                      className="text-xs h-8"
                    >
                      คะแนนรวมข้อเดียว (100 คะแนน)
                    </Button>
                  </div>
                </div>

                {/* Reusable Criteria Builder Component */}
                <CriteriaBuilder
                  scholarshipTypeName={name.trim() || 'ประเภททุนใหม่'}
                  criteriaName={customCriteriaName}
                  onCriteriaNameChange={(newName) => {
                    setCustomCriteriaName(newName);
                    if (customCriteriaNameError) setCustomCriteriaNameError(null);
                  }}
                  nameError={customCriteriaNameError || undefined}
                  targetScore={customTargetScore}
                  onTargetScoreChange={(score) => {
                    setCustomTargetScore(score);
                    setCriteriaError(null);
                  }}
                  subCriteria={customSubCriteria}
                  onSubCriteriaChange={(items) => {
                    setCustomSubCriteria(items);
                    setActiveTemplate('custom');
                    setCriteriaError(null);
                    setEmptyRowIndices([]);
                  }}
                  emptyTitleIndices={emptyRowIndices}
                />
              </div>
            )}

            {/* Mode 3 Content: NONE */}
            {criteriaMode === 'NONE' && (
              <div className="p-4 rounded-xl border border-border/80 bg-muted/20 text-xs text-muted-foreground space-y-1.5">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>ยังไม่กำหนดเกณฑ์แม่แบบเริ่มต้นในขณะนี้</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  ประเภททุนนี้จะไม่มีเกณฑ์แม่แบบเริ่มต้น เมื่อผู้ดูแลระบบสร้างรอบทุนการศึกษาสำหรับประเภทนี้ จะต้องเลือกโหมด &ldquo;ปรับแต่งเฉพาะรอบนี้&rdquo; เพื่อกำหนดเกณฑ์การประเมิน
                </p>
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
              disabled={isSubmitting}
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
