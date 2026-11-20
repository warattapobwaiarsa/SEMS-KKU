'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ScholarshipTypeStepper,
  ScholarshipTypeWizardStep,
  CriteriaBuilder,
} from '@/components/scholarship-types';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Alert,
} from '@/components/ui';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  PlusCircle,
} from 'lucide-react';
import { createScholarshipType } from '@/services/scholarship-types.service';
import { NestedSubCriteriaItem } from '@/types/scholarship-type';

export default function CreateScholarshipTypePage() {
  const router = useRouter();

  // Wizard Step
  const [currentStep, setCurrentStep] = useState<ScholarshipTypeWizardStep>(1);

  // Step 1 Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  // Step 2 Form State (Criteria Builder)
  const [criteriaName, setCriteriaName] = useState('');
  const [subCriteria, setSubCriteria] = useState<NestedSubCriteriaItem[]>([
    {
      title: 'ผลการเรียนเฉลี่ยสะสม (GPAX)',
      type: 'SCORED',
      allowComment: true,
      sortOrder: 1,
    },
    {
      title: 'สภาพความเป็นอยู่และความจำเป็นทางการเงิน',
      type: 'SCORED',
      allowComment: true,
      sortOrder: 2,
    },
    {
      title: 'กิจกรรมบำเพ็ญประโยชน์หรือผลงานดีเด่น',
      type: 'SCORED',
      allowComment: true,
      sortOrder: 3,
    },
  ]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdTypeName, setCreatedTypeName] = useState('');
  const [createdTypeId, setCreatedTypeId] = useState<number | null>(null);

  // Step 1 Validation & Proceed
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('กรุณากรอกชื่อประเภททุน');
      return;
    }
    setNameError(null);
    if (!criteriaName.trim()) {
      setCriteriaName(`เกณฑ์สำหรับ${trimmed}`);
    }
    setCurrentStep(2);
  };

  // Step 2 Submission
  const handleSubmit = async () => {
    // Validate subCriteria
    const validSubCriteria = subCriteria.filter((item) => item.title.trim().length > 0);
    if (validSubCriteria.length === 0) {
      setSubmitError('กรุณากำหนดหัวข้อเกณฑ์ย่อยอย่างน้อย 1 ข้อ');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        criteria: {
          name: criteriaName.trim() || `เกณฑ์สำหรับ${name.trim()}`,
          subCriteria: validSubCriteria.map((item, idx) => ({
            title: item.title.trim(),
            type: item.type,
            allowComment: Boolean(item.allowComment),
            sortOrder: idx + 1,
          })),
        },
      };

      const res = await createScholarshipType(payload);
      if (res && res.data) {
        setCreatedTypeName(res.data.name);
        setCreatedTypeId(res.data.id);
        setCurrentStep(3);
      } else {
        throw new Error('ไม่ได้รับข้อมูลตอบกลับจากการสร้างประเภททุน');
      }
    } catch (err: unknown) {
      console.error('Create scholarship type error:', err);
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างประเภททุน กรุณาลองใหม่อีกครั้ง';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <PageHeader
        title="สร้างประเภททุนใหม่"
        description="กำหนดข้อมูลประเภททุนและโครงสร้างเกณฑ์การประเมินเริ่มต้นสำหรับใช้งานในรอบทุนการศึกษา"
        backHref="/admin/scholarship-types"
        backLabel="กลับสู่หน้ารายการประเภททุน"
      />

      {/* Stepper */}
      <ScholarshipTypeStepper currentStep={currentStep} />

      {/* Error alert */}
      {submitError && (
        <Alert variant="destructive">
          {submitError}
        </Alert>
      )}

      {/* Step 1: Basic Info */}
      {currentStep === 1 && (
        <form onSubmit={handleProceedToStep2} className="space-y-6">
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="p-5 pb-4 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">ข้อมูลประเภททุน</CardTitle>
                  <CardDescription>
                    ระบุชื่อประเภททุนและคำอธิบายหรือวัตถุประสงค์ของทุน
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-5">
              {/* Type Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                  <span>ชื่อประเภททุน</span>
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  id="scholarship-type-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  placeholder="เช่น ทุนเรียนดีเด่น, ทุนสนับสนุนค่าครองชีพ, ทุนกิจกรรมเด่น"
                  error={nameError || undefined}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  ชื่อนี้จะปรากฏให้เจ้าหน้าที่และกรรมการเห็นเมื่อเลือกรอบทุน
                </p>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  วัตถุประสงค์และคำอธิบายทุน (ไม่บังคับ)
                </label>
                <textarea
                  id="scholarship-type-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ระบุวัตถุประสงค์ คุณสมบัติผู้สมัครเป้าหมาย หรือเงื่อนไขสำคัญของทุนประเภทนี้..."
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background/60 p-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
            </CardContent>

            <CardFooter className="p-5 border-t border-border/60 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/scholarship-types')}
              >
                ยกเลิก
              </Button>

              <Button type="submit" className="gap-2">
                <span>ต่อไป: กำหนดเกณฑ์ประเมิน</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}

      {/* Step 2: Criteria Builder */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <CriteriaBuilder
            scholarshipTypeName={name}
            criteriaName={criteriaName}
            onCriteriaNameChange={setCriteriaName}
            subCriteria={subCriteria}
            onSubCriteriaChange={setSubCriteria}
          />

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(1)}
              disabled={isSubmitting}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>ย้อนกลับไปแก้ไขข้อมูลทุน</span>
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>กำลังบันทึกข้อมูล...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>ยืนยันและสร้างประเภททุนพร้อมเกณฑ์</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Success Screen */}
      {currentStep === 3 && (
        <Card className="border-border/80 shadow-sm text-center p-8 sm:p-12 space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center ring-8 ring-emerald-50 dark:ring-emerald-950/20">
            <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              สร้างประเภททุนสำเร็จ!
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              ประเภททุน <span className="font-semibold text-foreground">&ldquo;{createdTypeName}&rdquo;</span> พร้อมโครงสร้างเกณฑ์ประเมินเริ่มต้นจำนวน{' '}
              <span className="font-semibold text-foreground">{subCriteria.length} ข้อ</span> ถูกบันทึกเข้าสู่ระบบเรียบร้อยแล้ว
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/scholarship-types')}
              className="w-full sm:w-auto"
            >
              กลับสู่หน้ารายการประเภททุน
            </Button>

            {createdTypeId && (
              <Button
                variant="outline"
                onClick={() => router.push(`/admin/scholarship-types/${createdTypeId}`)}
                className="w-full sm:w-auto"
              >
                ดูรายละเอียดประเภททุน
              </Button>
            )}

            <Button
              variant="primary"
              onClick={() => router.push('/admin/scholarship-rounds/create')}
              className="w-full sm:w-auto gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              <span>ไปสร้างรอบทุนการศึกษาใหม่ทันที</span>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
