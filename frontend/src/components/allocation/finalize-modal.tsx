/**
 * หน้าต่างยืนยันจัดสรรสำเร็จ (Finalize) / เปิดกลับมาแก้ไข (Reopen)
 * [Scope 1.3.2.10]
 */
'use client';

import React, { useState } from 'react';
import { CheckCircle2, RotateCcw, AlertTriangle, X } from 'lucide-react';

interface FinalizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  mode: 'finalize' | 'reopen';
  totalBudget: number;
  allocatedAmount: number;
  remainingBudget: number;
  recipientsCount: number;
}

export function FinalizeModal({
  isOpen,
  onClose,
  onConfirm,
  mode,
  totalBudget,
  allocatedAmount,
  remainingBudget,
  recipientsCount,
}: FinalizeModalProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const isFinalize = mode === 'finalize';

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-spring-pop">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg ${
                isFinalize ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}
            >
              {isFinalize ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
            </div>
            <h3 className="font-bold text-sm text-foreground">
              {isFinalize ? 'ยืนยันผลการจัดสรรทุนสำเร็จ' : 'เปิดผลการจัดสรรกลับมาแก้ไข'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isFinalize
              ? 'กรุณาตรวจสอบยอดการจัดสรรทุนก่อนยืนยันความสมบูรณ์ เมื่อยืนยันแล้วระบบจะเปลี่ยนสถานะเป็น Finalized และล็อคข้อมูลไม่ให้แก้ไข'
              : 'คุณต้องการเปิดผลการจัดสรรรอบนี้กลับมาแก้ไขเพิ่มเติมหรือไม่? สถานะจะกลับเป็น Editing'}
          </p>

          {/* สรุปยอดเงิน */}
          <div className="bg-muted/40 border border-border rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">งบประมาณรวม:</span>
              <span className="font-mono font-bold text-foreground">
                {totalBudget.toLocaleString()} บาท
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">ยอดที่จัดสรรแล้ว:</span>
              <span className="font-mono font-bold text-primary">
                {allocatedAmount.toLocaleString()} บาท
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">งบคงเหลือสุทธิ:</span>
              <span className="font-mono font-bold text-emerald-700">
                {remainingBudget.toLocaleString()} บาท
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-1.5">
              <span className="font-medium text-foreground">จำนวนผู้ได้รับทุน:</span>
              <span className="font-mono font-bold text-primary text-sm">
                {recipientsCount} คน
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-border bg-background hover:bg-muted text-foreground transition"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirm}
              className={`px-4 py-2 text-xs font-semibold rounded-xl text-white transition shadow-2xs disabled:opacity-50 ${
                isFinalize
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {submitting
                ? 'กำลังบันทึก...'
                : isFinalize
                ? 'ยืนยันจัดสรรสำเร็จ'
                : 'ยืนยันเปิดกลับมาแก้ไข'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
