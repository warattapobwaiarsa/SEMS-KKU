'use client';

import React, { useState } from 'react';
import { LogOut, AlertCircle, ShieldAlert } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '@/components/ui';
import type { UserProfile, UserRole } from '@/types/navigation';

export interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  user?: UserProfile;
  role?: UserRole;
}

export function LogoutModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  role = 'admin',
}: LogoutModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm();
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  const roleLabel = role === 'evaluator' ? 'กรรมการผู้ประเมิน (Evaluator)' : 'ผู้ดูแลระบบ (Admin)';
  const roleBadgeClass =
    role === 'evaluator'
      ? 'border-blue-200 bg-blue-50 text-blue-700'
      : 'border-slate-200 bg-slate-100 text-slate-700';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader
        title="ยืนยันการออกจากระบบ"
        subtitle="ระบบบริหารจัดการการประเมินทุนการศึกษา (SEMS-KKU)"
        icon={LogOut}
      />

      <ModalBody className="space-y-3.5 text-xs">
        <p className="text-muted-foreground leading-relaxed">
          คุณต้องการออกจากระบบใช่หรือไม่? Session การทำงานปัจจุบันของคุณจะสิ้นสุดลง
          และระบบจะนำคุณกลับสู่หน้าเข้าสู่ระบบหลัก
        </p>

        {/* User Profile Context Box */}
        <div className="p-3 bg-muted/40 rounded-xl border border-border/70 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">ผู้ใช้งาน:</span>
            <span className="font-semibold text-foreground truncate max-w-[200px]">
              {user?.name || 'ผู้ใช้งาน'}
            </span>
          </div>

          {user?.email && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">อีเมล:</span>
              <span className="font-mono text-muted-foreground truncate max-w-[200px]">
                {user.email}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">บทบาทในระบบ:</span>
            <span className={`inline-block px-1.5 py-0.5 text-xs font-semibold rounded border ${roleBadgeClass}`}>
              {roleLabel}
            </span>
          </div>

          {user?.department && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">สังกัด / หน่วยงาน:</span>
              <span className="text-foreground truncate max-w-[200px]">
                {user.department}
              </span>
            </div>
          )}
        </div>

        {/* Informative Warning Note */}
        <div className="flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <span>
            หากมีข้อมูลการประเมินหรือแบบร่างที่ยังไม่ได้กดบันทึก ข้อมูลอาจสูญหายได้ โปรดตรวจสอบก่อนออกจากระบบ
          </span>
        </div>
      </ModalBody>

      <ModalFooter className="flex items-center justify-end gap-2.5 pt-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onClose}
          disabled={isSubmitting}
        >
          ยกเลิก
        </Button>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleConfirm}
          isLoading={isSubmitting}
          leftIcon={<LogOut className="w-3.5 h-3.5" />}
        >
          ออกจากระบบ
        </Button>
      </ModalFooter>
    </Modal>
  );
}
