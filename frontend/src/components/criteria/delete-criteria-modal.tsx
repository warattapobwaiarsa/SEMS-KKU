'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Alert } from '@/components/ui';
import { deleteCriteria } from '@/services/criteria.service';
import { ApiError } from '@/lib/api-client';

interface DeleteCriteriaModalProps {
  isOpen: boolean;
  criteriaId: number;
  criteriaName: string;
  subCriteriaCount?: number;
  draftRoundsCount?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteCriteriaModal({
  isOpen,
  criteriaId,
  criteriaName,
  subCriteriaCount = 0,
  draftRoundsCount = 0,
  onClose,
  onSuccess,
}: DeleteCriteriaModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = confirmText.trim().toUpperCase() === 'DELETE';

  const handleDelete = async () => {
    if (!isConfirmed || deleting) return;
    try {
      setDeleting(true);
      setError(null);
      await deleteCriteria(criteriaId);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.statusCode === 404) {
        setError('ไม่พบข้อมูลชุดเกณฑ์นี้ หรือถูกลบไปแล้ว');
      } else if (err instanceof ApiError && err.statusCode === 409) {
        setError(err.message || 'ไม่สามารถลบเกณฑ์ที่ถูกนำไปใช้ในรอบการประเมินที่เปิดหรือปิดรอบแล้วได้');
      } else {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบชุดเกณฑ์');
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (deleting) return;
    setConfirmText('');
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" preventCloseOnBackdrop={deleting}>
      <ModalHeader
        title="ยืนยันการลบชุดเกณฑ์การประเมิน"
        subtitle="สามารถลบได้เฉพาะชุดเกณฑ์ที่ยังไม่ได้นำไปใช้ในรอบที่เปิดหรือปิดการประเมินแล้ว"
        icon={Trash2}
        onClose={handleClose}
      />
      <ModalBody>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              {error}
            </Alert>
          )}

          {/* Danger Warning Box */}
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 text-rose-700 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed space-y-1">
              <p className="font-bold text-sm">การดำเนินการนี้ไม่สามารถย้อนกลับได้!</p>
              <p>
                ระบบจะลบชุดเกณฑ์และข้อเกณฑ์ย่อยทั้งหมดออกจากระบบอย่างถาวร
                {draftRoundsCount > 0 && (
                  <span className="font-semibold text-rose-600 dark:text-rose-300">
                    {' '}และจะทำการยกเลิกการผูกชุดเกณฑ์นี้ออกจากรอบทุนแบบร่างจำนวน {draftRoundsCount} รอบ
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Target Criteria Info Card */}
          <div className="p-3.5 bg-muted/40 border border-border rounded-xl space-y-1.5 text-xs">
            <div className="text-muted-foreground">ชุดเกณฑ์ที่จะลบ:</div>
            <div className="font-bold text-sm text-foreground">{criteriaName}</div>
            <div className="flex items-center gap-2 text-muted-foreground font-mono">
              <span>รหัสชุดเกณฑ์ #{criteriaId}</span>
              {subCriteriaCount > 0 && (
                <>
                  <span>•</span>
                  <span>เกณฑ์ย่อย {subCriteriaCount} ข้อ</span>
                </>
              )}
              {draftRoundsCount > 0 && (
                <>
                  <span>•</span>
                  <span>รอบแบบร่าง {draftRoundsCount} รอบ</span>
                </>
              )}
            </div>
          </div>

          {/* Confirmation Input Guard */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-medium text-foreground">
              พิมพ์คำว่า <strong className="font-mono text-rose-600 dark:text-rose-400">DELETE</strong> เพื่อยืนยันการลบ:
            </label>
            <Input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="พิมพ์ DELETE ที่นี่"
              disabled={deleting}
              className="font-mono"
            />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={deleting}
        >
          ยกเลิก
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={!isConfirmed || deleting}
          className="gap-2"
        >
          {deleting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>กำลังลบ...</span>
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              <span>ยืนยันการลบชุดเกณฑ์</span>
            </>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
