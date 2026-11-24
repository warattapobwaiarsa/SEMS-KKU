'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Alert } from '@/components/ui';
import { deleteScholarshipType } from '@/services/scholarship-types.service';
import { ApiError } from '@/lib/api-client';

interface DeleteScholarshipTypeModalProps {
  isOpen: boolean;
  typeId: number;
  typeName: string;
  roundsCount?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteScholarshipTypeModal({
  isOpen,
  typeId,
  typeName,
  roundsCount = 0,
  onClose,
  onSuccess,
}: DeleteScholarshipTypeModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = confirmText.trim().toUpperCase() === 'DELETE';

  const handleDelete = async () => {
    if (!isConfirmed || deleting) return;
    try {
      setDeleting(true);
      setError(null);
      await deleteScholarshipType(typeId);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.statusCode === 404) {
        setError('ไม่พบข้อมูลประเภททุนนี้ หรือถูกลบไปแล้ว');
      } else if (err instanceof ApiError && err.statusCode === 409) {
        setError(err.message || 'ไม่สามารถลบประเภททุนที่ผูกกับรอบที่เปิดรับประเมินหรือปิดรอบไปแล้วได้');
      } else {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบประเภททุน');
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
        title="ยืนยันการลบประเภททุน"
        subtitle="สามารถลบได้เฉพาะประเภททุนที่ไม่มีรอบ หรือมีเฉพาะรอบแบบร่างเท่านั้น"
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
                ระบบจะลบประเภททุนนี้ออกจากระบบอย่างถาวร
                {roundsCount > 0 && (
                  <span className="font-semibold text-rose-600 dark:text-rose-300">
                    {' '}และจะทำการยกเลิกการผูกประเภททุนนี้ออกจากรอบทุนแบบร่างจำนวน {roundsCount} รอบ
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Target Type Info Card */}
          <div className="p-3.5 bg-muted/40 border border-border rounded-xl space-y-1.5 text-xs">
            <div className="text-muted-foreground">ประเภททุนที่จะลบ:</div>
            <div className="font-bold text-sm text-foreground">{typeName}</div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>รหัสประเภททุน <span className="font-mono font-medium">#{typeId}</span></span>
              {roundsCount > 0 && (
                <>
                  <span>•</span>
                  <span>รอบแบบร่างที่ผูกไว้ <span className="font-mono font-medium">{roundsCount}</span> รอบ</span>
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
              <span>ยืนยันการลบประเภททุน</span>
            </>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
