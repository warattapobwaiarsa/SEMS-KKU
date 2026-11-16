'use client';

import React, { useState, useEffect } from 'react';
import { AdminApplicantHistoryResponse } from '@/types/evaluation';
import { fetchApplicantCrossRoundHistory } from '@/services/applicants.service';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui';
import {
  Award,
  CheckCircle2,
  Clock,
  UserCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

interface ApplicantHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentCode: string | null;
}

export function ApplicantHistoryModal({
  isOpen,
  onClose,
  studentCode,
}: ApplicantHistoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AdminApplicantHistoryResponse | null>(null);
  const [expandedRoundId, setExpandedRoundId] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen || !studentCode) {
      return;
    }

    let isMounted = true;
    Promise.resolve()
      .then(() => {
        if (!isMounted) return;
        setLoading(true);
        setError(null);
        return fetchApplicantCrossRoundHistory(studentCode);
      })
      .then((data) => {
        if (!isMounted || !data) return;
        setHistory(data);
        if (data.records.length > 0) {
          setExpandedRoundId(data.records[0].roundId);
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดประวัติผู้สมัครได้');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, studentCode]);

  const handleClose = () => {
    setHistory(null);
    setError(null);
    setExpandedRoundId(null);
    onClose();
  };

  const toggleExpand = (roundId: number) => {
    setExpandedRoundId((prev) => (prev === roundId ? null : roundId));
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
      <ModalHeader
        title={
          history
            ? `ประวัติการสมัครทุน: ${history.studentName}`
            : 'ประวัติการสมัครทุนการศึกษาข้ามรอบ'
        }
        subtitle={
          history
            ? `รหัสนักศึกษา ${history.studentCode} | ${history.faculty} (${history.major})`
            : studentCode
            ? `รหัสนักศึกษา ${studentCode}`
            : undefined
        }
      />

      <ModalBody className="max-h-[70vh] overflow-y-auto space-y-4">
        {loading && (
          <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm">กำลังสืบค้นประวัติการสมัครข้ามรอบในระบบ SEMS...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && history && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 border border-border/70 rounded-xl text-xs">
              <span className="text-muted-foreground">
                จำนวนรอบทุนทั้งหมดที่พบในระบบ: <strong className="text-foreground">{history.totalRounds} รอบ</strong>
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                PDPA: ไม่แสดงเลขบัตรประชาชน/เบอร์/อีเมล
              </span>
            </div>

            {history.records.map((rec) => {
              const isExpanded = expandedRoundId === rec.roundId;
              return (
                <div
                  key={rec.roundId}
                  className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-2xs transition"
                >
                  {/* Round Header / Summary Bar */}
                  <div
                    onClick={() => toggleExpand(rec.roundId)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-muted/20 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-foreground text-sm">{rec.roundName}</h4>
                        {rec.scholarshipTypeName && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                            <Award className="h-3 w-3" />
                            {rec.scholarshipTypeName}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                          {rec.roundStatus}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-3">
                        <span>ปีการศึกษา {rec.academicYear}/{rec.semester}</span>
                        <span>•</span>
                        <span>ชั้นปีที่ {rec.studyYear} (GPA {rec.gpa.toFixed(2)})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Allocation Status Badge */}
                      {rec.allocation.awardStatus === 'AWARDED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          ได้รับทุน {rec.allocation.amount ? `(${rec.allocation.amount.toLocaleString()} บ.)` : ''}
                        </span>
                      ) : rec.allocation.awardStatus === 'NOT_AWARDED' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                          ไม่ได้รับทุน
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/80">
                          <Clock className="h-3.5 w-3.5" />
                          ยังไม่สรุปผล
                        </span>
                      )}

                      {/* Expand Button */}
                      <button
                        type="button"
                        className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail (Evaluations & Scores) */}
                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-border/60 bg-muted/10 space-y-3.5 text-xs">
                      {/* Score Overview */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3">
                        <div className="p-2.5 bg-background border border-border/70 rounded-xl">
                          <span className="text-[11px] text-muted-foreground block">คะแนนสุดท้าย (เฉลี่ย)</span>
                          <span className="text-base font-bold text-foreground font-mono">
                            {rec.finalScore !== null ? rec.finalScore.toFixed(2) : '-'}
                            {rec.totalTargetScore ? (
                              <span className="text-xs text-muted-foreground font-normal"> / {rec.totalTargetScore}</span>
                            ) : ''}
                          </span>
                        </div>

                        <div className="p-2.5 bg-background border border-border/70 rounded-xl">
                          <span className="text-[11px] text-muted-foreground block">กรรมการที่ประเมินแล้ว</span>
                          <span className="text-base font-bold text-foreground font-mono">
                            {rec.submittedEvaluationsCount} คน
                          </span>
                        </div>

                        <div className="p-2.5 bg-background border border-border/70 rounded-xl col-span-2 sm:col-span-1">
                          <span className="text-[11px] text-muted-foreground block">สถานะผลการจัดสรร</span>
                          <span className="text-xs font-semibold text-foreground">
                            {rec.allocation.status || 'ยังไม่กำหนดงบประมาณ'}
                          </span>
                        </div>
                      </div>

                      {/* Evaluator Breakdown */}
                      {rec.evaluations.length > 0 ? (
                        <div className="space-y-2 pt-1">
                          <h5 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                            <UserCheck className="h-3.5 w-3.5 text-primary" />
                            ผลการให้คะแนนและความคิดเห็นรายกรรมการ
                          </h5>
                          <div className="space-y-2">
                            {rec.evaluations.map((ev, idx) => (
                              <div
                                key={ev.evaluatorId}
                                className="p-3 bg-background border border-border/80 rounded-xl space-y-2"
                              >
                                <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                                  <span className="font-semibold text-foreground">
                                    ผู้ประเมินคนที่ {idx + 1}: {ev.evaluatorName}
                                  </span>
                                  <span className="font-mono font-bold text-primary">
                                    คะแนนรวม: {ev.totalScore ?? '-'}
                                  </span>
                                </div>

                                <div className="space-y-1.5 pl-1">
                                  {ev.items.map((it) => (
                                    <div key={it.subCriteriaId} className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-1">
                                      <span className="text-muted-foreground">
                                        • {it.subCriteriaTitle}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {it.type === 'SCORED' ? (
                                          <span className="font-mono font-semibold text-foreground">
                                            {it.score ?? '-'} / {it.maxScore}
                                          </span>
                                        ) : (
                                          <span className="text-foreground italic">
                                            {it.textValue || '-'}
                                          </span>
                                        )}
                                        {it.comment && (
                                          <span className="text-muted-foreground/80 bg-muted/60 px-1.5 py-0.5 rounded text-[10px]">
                                            &ldquo;{it.comment}&rdquo;
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic text-xs py-1">
                          ไม่มีผลการประเมินที่มีสถานะส่งผลแล้ว (Submitted) ในรอบนี้
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          onClick={handleClose}
          className="px-5 py-2 text-xs font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition cursor-pointer"
        >
          ปิดหน้าต่าง
        </button>
      </ModalFooter>
    </Modal>
  );
}
