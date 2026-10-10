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
    <div className="bg-white text-slate-900 rounded-xl p-6">
      <ModalHeader
        title="ยืนยันส่งผลการประเมิน?"
        subtitle="เมื่อส่งผลแล้วจะไม่สามารถแก้ไขหรือประเมินผู้สมัครรายนี้ซ้ำได้ โปรดตรวจสอบความถูกต้องของคะแนนอีกครั้ง"
        icon={Send}
        onClose={submitting ? undefined : onClose}
      />

      <ModalBody>
        {/* สรุปก่อนส่ง — ทั้ง 2 แถวใช้พื้นหลังและสไตล์ตัวอักษรเดียวกัน */}
        <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 text-base bg-slate-50">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-slate-700">ผู้สมัคร:</span>
            <span className="font-semibold text-slate-900">
              {applicantName} <span className="font-mono text-sm font-normal text-slate-600">({studentCode})</span>
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-slate-700">คะแนนรวมของคุณ:</span>
            <span className="font-bold font-mono text-slate-900">
              {totalScore} <span className="text-sm font-normal text-slate-600">/ {maxTotal}</span>
            </span>
          </div>
        </div>

        {/* ข้อความแจ้งสถานะหลังส่ง */}
        <p className="text-sm text-slate-700 border border-dashed border-slate-300 rounded-xl p-3">
          ผลการประเมินจะถูกส่งเข้าระบบประมวลผลส่วนกลาง และสถานะของคุณจะเปลี่ยนเป็น &quot;ส่งแล้ว (Submitted)&quot;
        </p>
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-5 py-2.5 text-base font-medium rounded-xl border border-slate-400 bg-white text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
        >
          ยกเลิก
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className="px-5 py-2.5 text-base font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'กำลังบันทึกข้อมูล...' : 'ยืนยันส่งผล'}
        </button>
      </ModalFooter>
      </div>
    </Modal>
  );
}
