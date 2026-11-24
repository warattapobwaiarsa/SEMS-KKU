/**
 * กล่องยืนยันก่อนส่งผลการประเมิน (Pre-submission Verification Checkpoint)
 * - แสดงสรุปคะแนนแยกตามเกณฑ์ทุกข้อ (Criteria Breakdown)
 * - แจ้งเตือนด้วยโทนสีแดงเด่นชัดเฉพาะช่องที่ยังไม่ได้กรอกข้อมูล (Red Alert)
 * - ป้องกันการส่งผลหากยังมีช่องที่ไม่ได้กรอก
 * - รองรับปุ่ม Jump-to-Edit เพื่อกระโดดไปกรอกข้อที่ยังว่าง
 * [FR-EVL-11] [FR-EVL-13] [BR-EVL-02]
 */
'use client';

import React, { useMemo } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Send, AlertTriangle, CheckCircle2, ArrowRight, Edit3 } from 'lucide-react';
import type { MyEvaluationItem } from '@/types/evaluation';
import type { ScoreFormValues } from './score-input-row';

export interface SubmitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  applicantName: string;
  studentCode: string;
  faculty?: string;
  /** คะแนนรวมสด */
  totalScore: number;
  maxTotal: number;
  /** true = กำลังส่งผล กดปุ่มซ้ำไม่ได้ (กัน double-click) */
  submitting: boolean;
  /** รายการเกณฑ์ย่อยทั้งหมด */
  items: MyEvaluationItem[];
  /** ค่าที่กรอกในฟอร์ม */
  values: ScoreFormValues;
  /** ฟังก์ชันเมื่อคลิกเพื่อเลื่อนไปยังเกณฑ์ข้อย่อย */
  onJumpToCriteria?: (subCriteriaId: number) => void;
}

export function SubmitConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  applicantName,
  studentCode,
  faculty,
  totalScore,
  maxTotal,
  submitting,
  items,
  values,
  onJumpToCriteria,
}: SubmitConfirmModalProps) {
  // ตรวจสอบเฉพาะช่องที่ยังไม่ได้กรอกข้อมูลใดๆ เข้าไปเลย
  const unfilledItems = useMemo(() => {
    return items.filter((item) => {
      const val = values[item.subCriteriaId];
      if (!val) return true;
      if (item.subCriteria.type === 'SCORED') {
        return val.score.trim() === '';
      }
      return val.textValue.trim() === '';
    });
  }, [items, values]);

  // ตรวจสอบข้อที่มีคะแนนไม่ถูกต้อง (เช่น ค่าเกินเต็ม หรือติดลบ หรือไม่ใช่จำนวนเต็ม)
  const invalidItems = useMemo(() => {
    return items.filter((item) => {
      if (item.subCriteria.type !== 'SCORED') return false;
      const val = values[item.subCriteriaId];
      if (!val || val.score.trim() === '') return false;
      const num = Number(val.score);
      const max = item.subCriteria.maxScore;
      return !Number.isInteger(num) || num < 0 || (max !== null && max !== undefined && num > max);
    });
  }, [items, values]);

  const hasUnfilled = unfilledItems.length > 0;
  const hasInvalid = invalidItems.length > 0;

  const handleJump = (subCriteriaId: number) => {
    onClose();
    if (onJumpToCriteria) {
      // หน่วงเวลาเล็กน้อยเพื่อให้ modal ปิดสนิทก่อนเลื่อน
      setTimeout(() => {
        onJumpToCriteria(subCriteriaId);
      }, 150);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={submitting ? () => {} : onClose} size="lg">
      <div className="bg-card text-foreground rounded-2xl p-6 space-y-5 max-h-[90vh] flex flex-col">
        <ModalHeader
          title="ตรวจสอบคะแนนก่อนส่งผลการประเมิน"
          subtitle="โปรดตรวจสอบความถูกต้องของคะแนนทุกข้อ เมื่อส่งแล้วจะไม่สามารถแก้ไขได้อีก"
          icon={Send}
          onClose={submitting ? undefined : onClose}
        />

        <ModalBody className="space-y-4 overflow-y-auto pr-1 flex-1 custom-scrollbar">
          {/* ข้อมูลสรุปผู้สมัครและคะแนนรวม */}
          <div className="bg-muted/40 border border-border/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-base text-foreground">{applicantName}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
                  {studentCode}
                </span>
                {faculty && (
                  <span className="text-xs text-muted-foreground">คณะ{faculty}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ตรวจครบแล้ว {items.length - unfilledItems.length} จากทั้งหมด {items.length} เกณฑ์
              </p>
            </div>

            <div className="sm:text-right shrink-0 bg-background/80 sm:bg-transparent px-3 py-2 sm:p-0 rounded-xl border sm:border-0 border-border/60">
              <span className="text-xs font-medium text-muted-foreground block">คะแนนรวมสุทธิ</span>
              <span className="font-mono font-extrabold text-2xl text-primary">
                {totalScore}{' '}
                <span className="text-xs font-normal text-muted-foreground">/ {maxTotal}</span>
              </span>
            </div>
          </div>

          {/* กล่องเตือนสีแดงเด่นชัดเฉพาะช่องที่ยังไม่ได้กรอก (Red Alert Banner) */}
          {hasUnfilled ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border-2 border-red-400 dark:border-red-700 rounded-2xl space-y-2.5 text-red-800 dark:text-red-200 shadow-sm animate-spring-pop">
              <div className="flex items-center gap-2 font-bold text-sm text-red-700 dark:text-red-300">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span>
                  พบเกณฑ์ที่ยังไม่ได้กรอกคะแนน {unfilledItems.length} ข้อ (กรุณากรอกให้ครบก่อนส่งผล)
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {unfilledItems.map((item) => (
                  <button
                    key={item.subCriteriaId}
                    type="button"
                    onClick={() => handleJump(item.subCriteriaId)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-xs transition cursor-pointer"
                  >
                    <span>{item.subCriteria.title}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          ) : hasInvalid ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border-2 border-red-400 dark:border-red-700 rounded-2xl space-y-2.5 text-red-800 dark:text-red-200 shadow-sm animate-spring-pop">
              <div className="flex items-center gap-2 font-bold text-sm text-red-700 dark:text-red-300">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span>
                  พบคะแนนไม่ถูกต้องหรือเกินเกณฑ์ย่อย {invalidItems.length} ข้อ (กรุณาแก้ไขก่อนส่งผล)
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {invalidItems.map((item) => (
                  <button
                    key={item.subCriteriaId}
                    type="button"
                    onClick={() => handleJump(item.subCriteriaId)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-xs transition cursor-pointer"
                  >
                    <span>{item.subCriteria.title}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 font-medium">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>กรอกคะแนนครบถ้วนทุกข้อแล้ว พร้อมสำหรับการส่งผลการประเมิน</span>
            </div>
          )}

          {/* ตารางแสดงผลสรุปแยกตามเกณฑ์ทุกข้อ (Criteria Breakdown) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              รายการคะแนนแยกตามเกณฑ์
            </h4>
            <div className="border border-border/80 rounded-2xl divide-y divide-border/60 overflow-hidden bg-card text-sm">
              {items.map((item, idx) => {
                const sub = item.subCriteria;
                const val = values[item.subCriteriaId];
                const isScored = sub.type === 'SCORED';
                const isUnfilled = isScored
                  ? !val || val.score.trim() === ''
                  : !val || val.textValue.trim() === '';
                const scoreNum = isScored && !isUnfilled ? Number(val.score) : 0;
                const max = sub.maxScore ?? 1;
                const pct = isScored && !isUnfilled ? Math.min(100, Math.max(0, (scoreNum / max) * 100)) : 0;

                return (
                  <div
                    key={item.subCriteriaId}
                    className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isUnfilled
                        ? 'border-l-4 border-l-red-500 bg-red-50/70 dark:bg-red-950/30'
                        : 'hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-xs sm:text-sm">
                          {idx + 1}. {sub.title}
                        </span>
                        {isUnfilled && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-md bg-red-600 text-white shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            ยังไม่ได้กรอก
                          </span>
                        )}
                      </div>

                      {/* รายละเอียดคะแนนหรือข้อความ */}
                      {isScored ? (
                        <div className="space-y-1 max-w-md">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>สัดส่วน:</span>
                            <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isUnfilled ? 'bg-red-300' : 'bg-primary'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs font-medium">{pct.toFixed(0)}%</span>
                          </div>
                          {val?.comment?.trim() && (
                            <p className="text-xs text-muted-foreground/90 italic truncate">
                              &ldquo;{val.comment.trim()}&rdquo;
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground truncate">
                          {val?.textValue?.trim() ? `ข้อความ: "${val.textValue.trim()}"` : 'ไม่มีข้อความ'}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        {isScored ? (
                          <span
                            className={`font-mono text-sm sm:text-base font-bold ${
                              isUnfilled ? 'text-red-600 font-extrabold' : 'text-foreground'
                            }`}
                          >
                            {isUnfilled ? '-' : val.score}
                            <span className="text-xs font-normal text-muted-foreground">
                              {sub.maxScore ? ` / ${sub.maxScore}` : ' คะแนน'}
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium">เกณฑ์ข้อความ</span>
                        )}
                      </div>

                      {/* ปุ่มไปแก้ไขข้อนี้ */}
                      <button
                        type="button"
                        onClick={() => handleJump(item.subCriteriaId)}
                        title="คลิกเพื่อแก้ไขข้อนี้"
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                          isUnfilled
                            ? 'border border-red-300 bg-red-100/90 text-red-800 hover:bg-red-200'
                            : 'border border-border bg-background hover:bg-muted text-foreground'
                        }`}
                      >
                        <Edit3 className="w-3 h-3 text-muted-foreground" />
                        <span className="hidden sm:inline">แก้ไข</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* แจ้งเตือนกระบวนการเมื่อส่งผล โทนสีแดงส้มเตือนความสำคัญ */}
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-300/80 dark:border-rose-800/80 rounded-xl text-xs text-rose-800 dark:text-rose-300 leading-relaxed font-medium">
            🔒 <strong>ข้อควรระวัง:</strong> เมื่อยืนยันส่งผลแล้ว ข้อมูลจะถูกบันทึกถาวรเข้าสู่ระบบกลางทันที ไม่สามารถแก้ไขหรือประเมินซ้ำได้ และระบบจะนำคุณกลับสู่หน้ารายชื่อผู้สมัคร
          </div>
        </ModalBody>

        <ModalFooter className="flex items-center justify-between gap-3 pt-3 border-t border-border/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-border bg-background hover:bg-muted text-foreground transition disabled:opacity-50 btn-interactive"
          >
            ยกเลิกและตรวจทานต่อ
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting || hasUnfilled || hasInvalid}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed btn-interactive"
          >
            {submitting ? 'กำลังส่งผลการประเมิน...' : 'ยืนยันส่งผลการประเมิน'}
          </button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
