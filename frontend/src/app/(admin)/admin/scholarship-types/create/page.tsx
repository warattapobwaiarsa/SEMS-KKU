'use client';

import React, { useState } from 'react';
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
  Alert,
} from '@/components/ui';
import {
  Award,
  CheckCircle2,
  Plus,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { createScholarshipType } from '@/services/scholarship-types.service';

export default function CreateScholarshipTypePage() {
  const router = useRouter();

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Form Status State
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdTypeName, setCreatedTypeName] = useState('');

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('กรุณาระบุชื่อประเภททุน');
      return;
    }
    setNameError(null);
    setSubmitError(null);

    try {
      setIsSubmitting(true);
      const payload = {
        name: trimmedName,
        description: description.trim() || undefined,
      };

      const res = await createScholarshipType(payload);
      if (res && res.data) {
        setCreatedTypeName(res.data.name);
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
    setSubmitError(null);
    setIsSuccess(false);
    setCreatedTypeName('');
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

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">
              สร้างประเภททุน &ldquo;{createdTypeName}&rdquo; เรียบร้อยแล้ว
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              ประเภททุนนี้พร้อมสำหรับนำไปใช้สร้างรอบการเปิดรับสมัครทุนการศึกษาในระบบแล้ว
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
        {/* Section 1: Basic Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>ข้อมูลทั่วไปของประเภททุน</CardTitle>
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
