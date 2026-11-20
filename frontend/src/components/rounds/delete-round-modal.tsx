'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui';
import { deleteRound } from '@/services/rounds.service';
import { ApiError } from '@/lib/api-client';

interface DeleteRoundModalProps {
  isOpen: boolean;
  roundId: number;
  roundName: string;
  academicYear: number;
  semester: number;
  applicantCount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteRoundModal({
  isOpen,
  roundId,
  roundName,
  academicYear,
  semester,
  applicantCount,
  onClose,
  onSuccess,
}: DeleteRoundModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = confirmText.trim().toUpperCase() === 'DELETE';

  const handleDelete = async () => {
    if (!isConfirmed || deleting) return;
    try {
      setDeleting(true);
      setError(null);
      await deleteRound(roundId);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.statusCode === 404) {
        setError('ไม่พบบริการลบรอบทุนบนเซิร์ฟเวอร์ หรือไม่พบข้อมูลรอบทุนนี้ กรุณารีสตาร์ต Backend หรือรีเฟรชหน้าจอ');
      } else {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบรอบทุน');
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
        title="ยืนยันการลบรอบทุนการศึกษา"
        subtitle="ดำเนินการได้เฉพาะรอบที่มีสถานะแบบร่าง (Draft) เท่านั้น"
        icon={Trash2}
        onClose={handleClose}
      />
      <ModalBody>
        <div className="space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Danger Warning Box */}
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 text-rose-700 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed space-y-1">
              <p className="font-bold text-sm">การดำเนินการนี้ไม่สามารถย้อนกลับได้!</p>
              <p>
                ระบบจะลบรอบทุนนี้ออกจากฐานข้อมูลอย่างถาวร
                {applicantCount > 0 && (
                  <span className="font-semibold text-rose-600 dark:text-rose-300">
                    {' '}รวมถึงข้อมูลผู้สมัครจำนวน {applicantCount} คน และข้อมูลประกอบทั้งหมดที่นำเข้าไว้
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Target Round Info Card */}
          <div className="p-3.5 bg-muted/40 border border-border rounded-xl space-y-1.5 text-xs">
            <div className="text-muted-foreground">รอบทุนที่จะลบ:</div>
            <div className="font-bold text-sm text-foreground">{roundName}</div>
            <div className="flex items-center gap-2 text-muted-foreground font-mono">
              <span>ปีการศึกษา {academicYear}/{semester}</span>
              <span>•</span>
              <span>รหัสรอบ #{roundId}</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-sans font-medium">สถานะ: ร่าง (Draft)</span>
            </div>
          </div>

          {/* Confirmation Input Guard */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-medium text-foreground">
              พิมพ์คำว่า <strong className="font-mono text-rose-600 dark:text-rose-400">DELETE</strong> เพื่อยืนยันการลบ:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="พิมพ์ DELETE ที่นี่"
              disabled={deleting}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition disabled:opacity-50"
            />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          onClick={handleClose}
          disabled={deleting}
          className="px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition cursor-pointer"
        >
          ยกเลิก
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={!isConfirmed || deleting}
          className="px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
        >
          {deleting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              กำลังลบรอบทุน...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              ยืนยันลบรอบทุน
            </>
          )}
        </button>
      </ModalFooter>
    </Modal>
  );
}
