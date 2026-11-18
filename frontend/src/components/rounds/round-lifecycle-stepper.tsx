/**
 * คอมโพเนนต์แสดงขั้นตอนวงจรรอบทุนการศึกษา (Round Lifecycle Stepper)
 * 4 ขั้นตอน: ร่างรอบทุน (Draft) ➔ เปิดประเมิน (Open) ➔ ปิดรอบ/สรุปผล (Closed) ➔ จัดสรรสำเร็จ (Finalized)
 * พร้อมปุ่มทางลัดตามบริบท (Contextual Action Pill)
 */
'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileEdit,
  PlayCircle,
  Archive,
  CheckCircle2,
  ArrowRight,
  Banknote,
  FileSpreadsheet,
  Layers,
  ChevronRight,
} from 'lucide-react';
import type { RoundStatus } from '@/types/criteria';

interface RoundLifecycleStepperProps {
  roundId: number;
  status: RoundStatus;
  isAllocationFinalized?: boolean;
  className?: string;
  onStepClick?: (step: number) => void;
}

export function RoundLifecycleStepper({
  roundId,
  status,
  isAllocationFinalized = false,
  className = '',
  onStepClick,
}: RoundLifecycleStepperProps) {
  // คำนวณ active step (1 to 4)
  let currentStep = 1;
  if (status === 'DRAFT') currentStep = 1;
  else if (status === 'OPEN') currentStep = 2;
  else if (status === 'CLOSED') {
    currentStep = isAllocationFinalized ? 4 : 3;
  }

  const steps = [
    {
      number: 1,
      title: 'ร่างรอบทุน (Draft)',
      description: 'กำหนดข้อมูลหลัก, ผูกเกณฑ์ 100 คะแนน และนำเข้าผู้สมัคร',
      icon: FileEdit,
      href: `/admin/scholarship-rounds/${roundId}`,
    },
    {
      number: 2,
      title: 'เปิดประเมิน (Open)',
      description: 'กรรมการเข้าประเมินและส่งคะแนนแบบ Real-time',
      icon: PlayCircle,
      href: `/admin/evaluation-results`,
    },
    {
      number: 3,
      title: 'ปิดรอบ/สรุปผล (Closed)',
      description: 'สรุปคะแนนเฉลี่ย, จัดอันดับ และตรวจสอบเกณฑ์ชี้ขาด',
      icon: Archive,
      href: `/admin/evaluation-results`,
    },
    {
      number: 4,
      title: 'จัดสรรทุน (Allocation)',
      description: 'เคาะงบประมาณ, บันทึกการจัดสรรรายคน และออกรายงาน',
      icon: isAllocationFinalized ? CheckCircle2 : Banknote,
      href: `/admin/scholarship-allocation`,
    },
  ];

  return (
    <div className={`bg-card border border-border/90 rounded-2xl p-4 sm:p-5 shadow-xs ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80 mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            วงจรชีวิตรอบทุนการศึกษา (Round Lifecycle)
          </h3>
        </div>

        {/* Contextual Action Link */}
        {currentStep === 1 && (
          <Link
            href={`/admin/scholarship-rounds/${roundId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <span>ไปหน้าจัดการรอบและผูกเกณฑ์</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
        {currentStep === 2 && (
          <Link
            href="/admin/evaluation-results"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline"
          >
            <span>ติดตามผลการประเมินสด</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
        {currentStep === 3 && (
          <Link
            href="/admin/scholarship-allocation"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <span>ไปหน้าจัดสรรงบประมาณทุน</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
        {currentStep === 4 && (
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:underline"
          >
            <span>ไปศูนย์ออกรายงาน (PDPA)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Stepper Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
        {steps.map((st) => {
          const Icon = st.icon;
          const isCompleted = currentStep > st.number;
          const isCurrent = currentStep === st.number;
          const isUpcoming = currentStep < st.number;

          return (
            <div
              key={st.number}
              onClick={() => onStepClick?.(st.number)}
              className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                onStepClick ? 'cursor-pointer hover:border-primary/60 hover:shadow-sm' : ''
              } ${
                isCurrent
                  ? 'bg-primary/5 border-primary ring-1 ring-primary/20 shadow-2xs'
                  : isCompleted
                  ? 'bg-muted/40 border-border/80 text-muted-foreground'
                  : 'bg-muted/10 border-border/40 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground shadow-2xs'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? '✓' : st.number}
                </div>

                <div
                  className={`p-1 rounded-md ${
                    isCurrent
                      ? 'text-primary'
                      : isCompleted
                      ? 'text-emerald-600'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <h4
                  className={`text-xs font-bold leading-tight ${
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {st.title}
                </h4>
                <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2 leading-relaxed">
                  {st.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
