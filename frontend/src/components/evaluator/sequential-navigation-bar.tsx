/**
 * แถบนำทางต่อเนื่องสำหรับผู้ประเมิน (Sequential Floating Navigation Bar)
 * แสดงลำดับผู้สมัคร [คนก่อนหน้า] - [คนที่ X/Y] - [คนถัดไป]
 * พร้อมรองรับ Unsaved State Guard เพื่อบันทึกข้อมูลก่อนสลับหน้า
 * [FR-EVL-01] [FR-EVL-08]
 */
'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Loader2,
  CheckCircle2,
  Clock,
  User,
  X,
} from 'lucide-react';
import type { EvaluatorApplicant } from '@/types/evaluation';
import { StatusBadge } from '@/components/ui/status-badge';

interface SequentialNavigationBarProps {
  roundId: number;
  currentApplicantId: number;
  applicants: EvaluatorApplicant[];
  onNavigate: (targetApplicantId: number) => Promise<boolean>;
  isSaving?: boolean;
}

export function SequentialNavigationBar({
  currentApplicantId,
  applicants,
  onNavigate,
  isSaving = false,
}: SequentialNavigationBarProps) {
  const [navigatingId, setNavigatingId] = useState<number | null>(null);
  const [listModalOpen, setListModalOpen] = useState(false);

  if (!applicants || applicants.length === 0) {
    return null;
  }

  // หา index ของผู้สมัครคนปัจจุบัน
  const currentIndex = applicants.findIndex((a) => a.id === currentApplicantId);
  const total = applicants.length;
  const currentApplicant = currentIndex >= 0 ? applicants[currentIndex] : null;

  const prevApplicant = currentIndex > 0 ? applicants[currentIndex - 1] : null;
  const nextApplicant =
    currentIndex >= 0 && currentIndex < total - 1 ? applicants[currentIndex + 1] : null;

  const handleNavigateClick = async (targetId: number) => {
    if (targetId === currentApplicantId || navigatingId !== null || isSaving) return;
    setNavigatingId(targetId);
    try {
      const ok = await onNavigate(targetId);
      if (!ok) {
        setNavigatingId(null);
      }
    } catch {
      setNavigatingId(null);
    }
  };

  return (
    <>
      <div className="w-full bg-card/95 backdrop-blur-md border border-border/90 rounded-2xl p-2 sm:p-2.5 shadow-sm flex items-center justify-between gap-2 select-none">
        {/* Left: Previous Applicant Button */}
        <div className="flex-1 min-w-0 flex items-center justify-start">
          {prevApplicant ? (
            <button
              type="button"
              disabled={navigatingId !== null || isSaving}
              onClick={() => handleNavigateClick(prevApplicant.id)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition disabled:opacity-50 cursor-pointer shadow-2xs group max-w-full truncate"
              title={`คนก่อนหน้า: ${prevApplicant.titlePrefix}${prevApplicant.firstName} (${prevApplicant.studentCode})`}
            >
              {navigatingId === prevApplicant.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0 transition-transform group-hover:-translate-x-0.5" />
              )}
              <span className="hidden md:inline text-muted-foreground font-normal">
                คนก่อนหน้า:
              </span>
              <span className="truncate font-semibold">
                {prevApplicant.firstName}
              </span>
              <span className="hidden xl:inline text-muted-foreground font-mono text-xs">
                ({prevApplicant.studentCode})
              </span>
            </button>
          ) : (
            <span className="text-xs text-muted-foreground/60 px-2 flex items-center gap-1 italic">
              <ChevronLeft className="w-3.5 h-3.5 opacity-40" />
              <span className="hidden sm:inline">คนแรกสุด</span>
            </span>
          )}
        </div>

        {/* Center: Current Progress & Quick Jump Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setListModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 hover:bg-muted border border-border/80 text-xs font-medium text-foreground transition cursor-pointer"
            title="คลิกเพื่อเปิดรายชื่อผู้สมัครทั้งหมดในรอบนี้"
          >
            <ListFilter className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>
              คนที่{' '}
              <strong className="text-primary font-bold font-mono">
                {currentIndex >= 0 ? currentIndex + 1 : '-'}
              </strong>{' '}
              / {total}
            </span>
          </button>
        </div>

        {/* Right: Next Applicant Button */}
        <div className="flex-1 min-w-0 flex items-center justify-end">
          {nextApplicant ? (
            <button
              type="button"
              disabled={navigatingId !== null || isSaving}
              onClick={() => handleNavigateClick(nextApplicant.id)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition disabled:opacity-50 cursor-pointer shadow-2xs group max-w-full truncate"
              title={`คนถัดไป: ${nextApplicant.titlePrefix}${nextApplicant.firstName} (${nextApplicant.studentCode})`}
            >
              <span className="hidden md:inline font-normal opacity-90">
                คนถัดไป:
              </span>
              <span className="truncate font-semibold">
                {nextApplicant.firstName}
              </span>
              <span className="hidden xl:inline opacity-80 font-mono text-xs">
                ({nextApplicant.studentCode})
              </span>
              {navigatingId === nextApplicant.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-foreground shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
              )}
            </button>
          ) : (
            <span className="text-xs text-muted-foreground/60 px-2 flex items-center gap-1 italic">
              <span className="hidden sm:inline">คนสุดท้าย</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            </span>
          )}
        </div>
      </div>

      {/* Quick Jump List Modal */}
      {listModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden animate-spring-pop">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">
                  รายชื่อผู้สมัครทั้งหมดในรอบนี้ ({total} คน)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setListModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
              {applicants.map((app, idx) => {
                const isCurrent = app.id === currentApplicantId;
                const statusVariant =
                  app.myStatus === 'SUBMITTED'
                    ? 'success'
                    : app.myStatus === 'DRAFT'
                    ? 'draft'
                    : 'neutral';
                const statusText =
                  app.myStatus === 'SUBMITTED'
                    ? 'ส่งแล้ว'
                    : app.myStatus === 'DRAFT'
                    ? 'ฉบับร่าง'
                    : 'ยังไม่ประเมิน';

                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={async () => {
                      setListModalOpen(false);
                      await handleNavigateClick(app.id);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/20'
                        : 'bg-background hover:bg-muted/70 border-border/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-center font-mono text-xs font-semibold text-muted-foreground">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-foreground truncate">
                            {app.titlePrefix}
                            {app.firstName} {app.lastName}
                          </span>
                          <span className="text-xs font-mono text-muted-foreground">
                            {app.studentCode}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {app.faculty} • ชั้นปีที่ {app.studyYear} • GPA {app.gpa.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <StatusBadge label={statusText} variant={statusVariant} />
                      {isCurrent && (
                        <span className="text-xs font-semibold text-primary">
                          กำลังตรวจ
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 border-t border-border bg-muted/40 text-right">
              <button
                type="button"
                onClick={() => setListModalOpen(false)}
                className="px-4 py-1.5 text-xs font-medium rounded-xl border border-border bg-background hover:bg-muted text-foreground transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
