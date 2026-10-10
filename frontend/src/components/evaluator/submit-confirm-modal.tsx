/**
 * กล่องยืนยันก่อนส่งผลการประเมิน (ตาม wireframe v15_submit_confirm_dialog)
 * "ยืนยันส่งผลการประเมิน? ส่งแล้วจะแก้ไขไม่ได้"
 * [FR-EVL-11] [FR-EVL-13] [BR-EVL-02]
 */
'use client';

import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Send } from 'lucide-react';

interface SubmitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  applicantName: string;
  studentCode: string;
  /** คะแนนรวมสด */
  totalScore: number;
  maxTotal: number;
  /** true = กำลังส่งผล กดปุ่มซ้ำไม่ได้ (กัน double-click) */
  submitting: boolean;
}

export function SubmitConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  applicantName,
  studentCode,
  totalScore,
  maxTotal,
  submitting,
}: SubmitConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={submitting ? () => {} : onClose} size="md">
      <div className="bg-card text-foreground rounded-2xl p-6 space-y-5">
        <ModalHeader
          title="ยืนยันส่งผลการประเมิน?"
          subtitle="เมื่อส่งผลแล้วจะไม่สามารถแก้ไขหรือประเมินผู้สมัครรายนี้ซ้ำได้ โปรดตรวจสอบความถูกต้องของคะแนนอีกครั้ง"
          icon={Send}
          onClose={submitting ? undefined : onClose}
        />

        <ModalBody className="space-y-4">
          {/* สรุปก่อนส่ง — ดีไซน์สอดคล้องกับธีม SEMS-KKU */}
          <div className="border border-border/80 rounded-2xl divide-y divide-border/60 text-sm bg-muted/30 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-muted-foreground font-medium">ผู้สมัคร:</span>
              <span className="font-semibold text-foreground">
                {applicantName}{' '}
                <span className="font-mono text-xs font-normal text-muted-foreground">
                  ({studentCode})
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-muted-foreground font-medium">คะแนนรวมของคุณ:</span>
              <span className="font-bold font-mono text-base text-primary">
                {totalScore}{' '}
                <span className="text-xs font-normal text-muted-foreground">/ {maxTotal}</span>
              </span>
            </div>
          </div>

          {/* ข้อความแจ้งเตือนผลกระทบ */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            ⚠ ผลการประเมินจะถูกส่งเข้าระบบประมวลผลส่วนกลาง และสถานะของคุณจะเปลี่ยนเป็น &quot;ส่งแล้ว (Submitted)&quot; ไม่สามารถแก้ไขได้อีก
          </div>
        </ModalBody>

        <ModalFooter className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-border bg-background hover:bg-muted text-foreground transition disabled:opacity-50 btn-interactive"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed btn-interactive"
          >
            {submitting ? 'กำลังบันทึกข้อมูล...' : 'ยืนยันส่งผลการประเมิน'}
          </button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
