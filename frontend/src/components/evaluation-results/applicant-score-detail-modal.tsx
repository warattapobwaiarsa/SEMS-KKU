'use client';

import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, User, Loader2, AlertCircle } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui';
import { fetchApplicantEvaluationResults } from '@/services/evaluation-results.service';
import type { ApplicantEvaluationResultsResponse } from '@/types/evaluation-results';

interface ApplicantScoreDetailModalProps {
  applicantId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ApplicantScoreDetailModal({
  applicantId,
  isOpen,
  onClose,
}: ApplicantScoreDetailModalProps) {
  const [data, setData] = useState<ApplicantEvaluationResultsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    if (!isOpen || !applicantId) {
      setData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchApplicantEvaluationResults(applicantId)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setActiveTab(0);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [applicantId, isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalHeader
        title="รายละเอียดผลคะแนนการประเมิน"
        subtitle={
          data
            ? `${data.applicant.titlePrefix}${data.applicant.firstName} ${data.applicant.lastName} (${data.applicant.studentCode}) - ${data.applicant.major}`
            : 'กำลังโหลดข้อมูลผู้สมัคร...'
        }
        icon={Award}
        iconClassName="text-primary"
        onClose={onClose}
      />

      <ModalBody className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm">กำลังโหลดรายละเอียดคะแนน...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {data && !loading && (
          <>
            {/* Overview Score Capsule */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4.5 rounded-2xl bg-muted/30 border border-border/80">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  คะแนนเฉลี่ยรวม (Final Score)
                </span>
                <span className="text-2xl font-bold font-mono text-foreground mt-0.5">
                  {data.finalScore.display}{' '}
                  <span className="text-xs font-normal text-muted-foreground font-sans">คะแนน</span>
                </span>
                <span className="text-[11px] text-muted-foreground mt-1">
                  คำนวณแบบน้ำหนักเท่ากัน (Equal Weight)
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  จำนวนกรรมการที่ส่งผล (Submitted)
                </span>
                <span className="text-2xl font-bold font-mono text-foreground mt-0.5">
                  {data.evaluations.length}{' '}
                  <span className="text-xs font-normal text-muted-foreground font-sans">ท่าน</span>
                </span>
                <span className="text-[11px] text-muted-foreground mt-1">
                  นับเฉพาะสถานะ SUBMITTED [BR-SCR-01]
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  ผลการเรียนสะสม (GPAX)
                </span>
                <span className="text-2xl font-bold font-mono text-foreground mt-0.5">
                  {data.applicant.gpa.toFixed(2)}
                </span>
                <span className="text-[11px] text-muted-foreground mt-1">
                  ใช้พิจารณา Tie-break ลำดับถัดไป
                </span>
              </div>
            </div>

            {/* Evaluators Section */}
            {data.evaluations.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border/80 rounded-2xl bg-muted/10">
                <p className="text-foreground font-semibold text-sm">ยังไม่มีผู้ประเมินยืนยันส่งผลคะแนนสำหรับผู้สมัครรายนี้</p>
                <p className="text-muted-foreground text-xs mt-1">
                  (คะแนนในสถานะ Draft จะไม่ถูกนำมาแสดงในส่วนนี้ตามกฎ BR-SCR-01)
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span>ผลคะแนนแยกตามรายชื่อกรรมการที่ส่งผล ({data.evaluations.length} ท่าน)</span>
                </h4>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-border/70 pb-2 overflow-x-auto">
                  {data.evaluations.map((ev, idx) => (
                    <button
                      key={ev.evaluatorId}
                      type="button"
                      onClick={() => setActiveTab(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                        activeTab === idx
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{ev.evaluatorName}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                          activeTab === idx
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : 'bg-background text-foreground border border-border/70'
                        }`}
                      >
                        {ev.totalScore ?? 0} คะแนน
                      </span>
                    </button>
                  ))}
                </div>

                {/* Selected Evaluator Content */}
                {data.evaluations[activeTab] && (
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border/60">
                      <div>
                        <span className="font-semibold text-foreground">ผู้ประเมิน: </span>
                        {data.evaluations[activeTab].evaluatorName} ({data.evaluations[activeTab].evaluatorEmail})
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">วันที่ส่งผล: </span>
                        {data.evaluations[activeTab].submittedAt
                          ? new Date(data.evaluations[activeTab].submittedAt!).toLocaleString('th-TH')
                          : '-'}
                      </div>
                    </div>

                    <div className="border border-border/80 rounded-2xl overflow-hidden shadow-2xs bg-card">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground uppercase font-semibold">
                          <tr>
                            <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                            <th className="py-2.5 px-3">เกณฑ์การพิจารณา</th>
                            <th className="py-2.5 px-3 w-28 text-center">คะแนนเต็ม</th>
                            <th className="py-2.5 px-3 w-28 text-center">คะแนนที่ได้</th>
                            <th className="py-2.5 px-3">ความคิดเห็น / ข้อความ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 text-foreground">
                          {data.evaluations[activeTab].items.map((item, itemIdx) => (
                            <tr key={item.subCriteriaId} className="hover:bg-muted/20 transition-colors">
                              <td className="py-2.5 px-3 text-center text-muted-foreground font-mono">{itemIdx + 1}</td>
                              <td className="py-2.5 px-3 font-semibold text-foreground">
                                {item.title}
                                {item.type === 'TEXT' && (
                                  <span className="ml-2 px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-normal">
                                    ไม่มีคะแนน
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center text-muted-foreground font-mono">
                                {item.maxScore !== null ? item.maxScore : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold font-mono text-foreground">
                                {item.score !== null ? (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                    {item.score}
                                  </span>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-foreground">
                                {item.comment && (
                                  <div className="text-xs text-foreground/90">
                                    <span className="text-[11px] font-semibold text-muted-foreground">ความเห็น: </span>
                                    {item.comment}
                                  </div>
                                )}
                                {item.textValue && (
                                  <div className="text-xs text-foreground/90 mt-0.5">
                                    <span className="text-[11px] font-semibold text-muted-foreground">ข้อความ: </span>
                                    {item.textValue}
                                  </div>
                                )}
                                {!item.comment && !item.textValue && (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted/30 border-t border-border/80 font-semibold text-foreground">
                          <tr>
                            <td colSpan={3} className="py-3 px-3 text-right">
                              คะแนนรวมที่กรรมการท่านนี้ให้:
                            </td>
                            <td className="py-3 px-3 text-center text-sm font-bold text-primary font-mono">
                              {data.evaluations[activeTab].totalScore ?? 0}
                            </td>
                            <td className="py-3 px-3"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </ModalBody>

      <ModalFooter className="flex justify-end p-4 border-t border-border/70 bg-muted/20">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-foreground bg-background border border-border rounded-xl hover:bg-muted/70 transition-all shadow-2xs cursor-pointer"
        >
          ปิดหน้าต่าง
        </button>
      </ModalFooter>
    </Modal>
  );
}
