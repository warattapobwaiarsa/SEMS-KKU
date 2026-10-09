'use client';

import React, { useEffect, useState } from 'react';
import { 
  History, 
  Clock, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  Loader2
} from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui';
import { fetchImportHistory } from '@/services/applicants.service';
import { ImportBatchItem } from '@/types/applicants';

interface ImportHistoryModalProps {
  roundId: number;
  roundName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImportHistoryModal({
  roundId,
  roundName,
  isOpen,
  onClose,
}: ImportHistoryModalProps) {
  const [history, setHistory] = useState<ImportBatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchImportHistory(roundId)
      .then((data) => {
        if (isMounted) setHistory(data);
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดประวัตินำเข้าได้');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, roundId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
    >
      <ModalHeader
        title="ประวัติการนำเข้าข้อมูลผู้สมัคร"
        subtitle={
          <span>
            รอบทุน: <strong className="text-foreground">{roundName}</strong>
          </span>
        }
        icon={History}
        onClose={onClose}
      />

      <ModalBody>
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm font-medium">กำลังโหลดประวัติการนำเข้า...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm">
            {error}
          </div>
        ) : history.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground border border-border/60">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">ยังไม่มีประวัติการนำเข้าข้อมูล</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              เมื่อมีการนำเข้าไฟล์ Excel ในรอบทุนนี้ ประวัติและสถิติจะถูกบันทึกที่นี่
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {history.map((batch) => (
              <div
                key={batch.id}
                className="p-4.5 border border-border/80 rounded-2xl bg-card hover:border-primary/40 transition-colors shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-bold text-foreground text-sm">{batch.fileName}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                        {new Date(batch.importedAt).toLocaleString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {batch.importedBy && (
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-muted-foreground/70" />
                          {batch.importedBy.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs shrink-0 font-mono">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> ผ่าน {batch.validRows}
                    </span>
                    {batch.invalidRows > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> ไม่ผ่าน {batch.invalidRows}
                      </span>
                    )}
                  </div>
                </div>

                {batch.errorDetails && Array.isArray(batch.errorDetails) && batch.errorDetails.length > 0 && (
                  <div className="pt-2.5 border-t border-border/60">
                    <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1.5 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      รายการที่ไม่ผ่านการตรวจสอบ ({batch.errorDetails.length} รายการ):
                    </p>
                    <div className="max-h-24 overflow-y-auto space-y-1 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
                      {batch.errorDetails.slice(0, 5).map((err, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="font-mono text-muted-foreground/80 shrink-0">แถว {err.rowNumber}:</span>
                          <span className="text-rose-700 dark:text-rose-400">{err.errors?.join(', ')}</span>
                        </div>
                      ))}
                      {batch.errorDetails.length > 5 && (
                        <p className="text-muted-foreground/60 italic pt-0.5">
                          และอีก {batch.errorDetails.length - 5} รายการ...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 text-sm font-semibold text-foreground hover:bg-muted border border-border/80 rounded-xl transition cursor-pointer"
        >
          ปิด
        </button>
      </ModalFooter>
    </Modal>
  );
}
