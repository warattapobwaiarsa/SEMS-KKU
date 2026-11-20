'use client';

import React from 'react';
import { Check, Award, Sliders, CheckCircle2 } from 'lucide-react';

export type ScholarshipTypeWizardStep = 1 | 2 | 3;

interface ScholarshipTypeStepperProps {
  currentStep: ScholarshipTypeWizardStep;
}

export function ScholarshipTypeStepper({ currentStep }: ScholarshipTypeStepperProps) {
  const steps = [
    {
      step: 1,
      title: 'ข้อมูลประเภททุน',
      description: 'ชื่อและคำอธิบายประเภททุน',
      icon: Award,
    },
    {
      step: 2,
      title: 'กำหนดเกณฑ์ประเมิน',
      description: 'หัวข้อเกณฑ์ย่อยและวิธีการให้คะแนน',
      icon: Sliders,
    },
    {
      step: 3,
      title: 'สรุปผลสำเร็จ',
      description: 'พร้อมใช้งานในรอบทุนการศึกษา',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="w-full bg-card rounded-2xl border border-border/80 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {steps.map((s, idx) => {
          const isDone = currentStep > s.step;
          const isActive = currentStep === s.step;
          const Icon = s.icon;

          return (
            <React.Fragment key={s.step}>
              <div className="flex items-center gap-3.5 flex-1 w-full sm:w-auto">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all ${
                    isDone
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isActive
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-xs'
                      : 'bg-muted text-muted-foreground border border-border/60'
                  }`}
                >
                  {isDone ? <Check className="h-5 w-5 stroke-[2.5]" /> : <Icon className="h-5 w-5" />}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      ขั้นตอนที่ {s.step}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary">
                        กำลังดำเนินการ
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-sm font-semibold truncate ${
                      isActive ? 'text-foreground' : isDone ? 'text-foreground/80' : 'text-muted-foreground'
                    }`}
                  >
                    {s.title}
                  </span>
                  <span className="text-xs text-muted-foreground hidden lg:inline truncate">
                    {s.description}
                  </span>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden sm:block w-8 sm:w-12 h-0.5 bg-border/80 shrink-0 self-center" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
