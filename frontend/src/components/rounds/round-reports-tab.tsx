'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Shield,
  Lock,
  AlertTriangle,
  Info,
  CheckCircle2,
  TableProperties,
  ArrowRight,
  Database,
  Building,
} from 'lucide-react';
import { PasswordExportModal } from '@/components/reports/password-export-modal';
import {
  exportEvaluationResultsReport,
  exportAllocationDisbursementReport,
} from '@/services/reports.service';
import { fetchAllocationSummary } from '@/services/allocation.service';

interface RoundReportsTabProps {
  roundId: number;
  roundStatus: string;
  isFinalized?: boolean;
}

export function RoundReportsTab({
  roundId,
  roundStatus,
  isFinalized: initialFinalized = false,
}: RoundReportsTabProps) {
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<
    'eval-rankings' | 'allocation-disbursement' | null
  >(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isFinalized, setIsFinalized] = useState(initialFinalized);

  const isClosed = roundStatus === 'CLOSED';

  // ตรวจสอบสถานะการจัดสรร (Finalized หรือไม่)
  React.useEffect(() => {
    if (isClosed) {
      fetchAllocationSummary(roundId)
        .then((res) => {
          if (res.data?.status === 'FINALIZED') {
            setIsFinalized(true);
          }
        })
        .catch(() => {});
    }
  }, [roundId, isClosed]);

  const handleOpenExportModal = (type: 'eval-rankings' | 'allocation-disbursement') => {
    setSelectedReportType(type);
    setPasswordModalOpen(true);
  };

  const handleExecuteExport = async (password: string) => {
    if (!roundId || !selectedReportType) return;
    setExportError(null);
    try {
      if (selectedReportType === 'eval-rankings') {
        await exportEvaluationResultsReport(roundId, password);
        setExportSuccess('ส่งออกรายงานสรุปผลการประเมินและอันดับ (.xlsx) สำเร็จ');
      } else {
        await exportAllocationDisbursementReport(roundId, password);
        setExportSuccess('ส่งออกรายงานผลการจัดสรรทุนการศึกษา (.xlsx) สำเร็จ');
      }
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งออกรายงาน');
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      {/* PDPA Security Notice */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Shield className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span>การคุ้มครองข้อมูลส่วนบุคคล (PDPA Compliant Export)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20">
              AES-Protected
            </span>
          </h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            ไฟล์รายงาน Excel (.xlsx) ทุกไฟล์ที่ส่งออกจากระบบ จะต้องกำหนดรหัสผ่านเพื่อเข้ารหัสความปลอดภัยก่อนการดาวน์โหลดเสมอ เพื่อป้องกันการรั่วไหลของข้อมูลอ่อนไหวของนักศึกษาตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล
          </p>
        </div>
      </div>

      {/* Success / Error Messages */}
      {exportSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <p>{exportSuccess}</p>
        </div>
      )}

      {exportError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <p>{exportError}</p>
        </div>
      )}

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Report 1: สรุปผลการประเมินและอันดับ */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-xs hover:border-primary/30 transition-all">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  isClosed
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}
              >
                {isClosed ? 'พร้อมส่งออก' : 'ต้องปิดรอบทุนก่อน'}
              </span>
            </div>

            <div>
              <div className="text-xs font-semibold text-primary mb-1">
                รายงานผลการประเมิน
              </div>
              <h4 className="text-base font-bold text-foreground">
                รายงานผลการประเมินและอันดับผู้สมัคร
              </h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                สรุปคะแนนการประเมินรายบุคคล รายเกณฑ์ย่อย ค่าเฉลี่ย คะแนนรวม และการจัดอันดับ พร้อมทั้งข้อมูลสถิติภาพรวมของการประเมิน
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 text-xs text-muted-foreground space-y-1.5 border border-border/50">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <TableProperties className="w-3.5 h-3.5 text-primary" />
                <span>โครงสร้างเนื้อหาในไฟล์ Excel:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground/80 pl-1">
                <li>ข้อมูลผู้สมัคร: รหัสนักศึกษา, ชื่อ-สกุล, คณะ, ชั้นปี, GPAX</li>
                <li>คะแนนรายเกณฑ์ย่อยจากกรรมการทุกคน</li>
                <li>คะแนนรวม คะแนนเฉลี่ย และลำดับที่ได้</li>
                <li>สรุปผลทางสถิติ (Max, Min, Mean, SD)</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-border mt-6 flex items-center justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              <span>เข้ารหัสด้วยรหัสผ่าน</span>
            </div>

            <button
              type="button"
              disabled={!isClosed}
              onClick={() => handleOpenExportModal('eval-rankings')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออก Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Report 2: ผลการจัดสรรและเบิกจ่ายทุน */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-xs hover:border-primary/30 transition-all">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Building className="w-6 h-6" />
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  isFinalized
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}
              >
                {isFinalized ? 'พร้อมส่งออก (Finalized)' : 'รอยืนยันผลจัดสรร'}
              </span>
            </div>

            <div>
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                รายงานการจัดสรรทุน
              </div>
              <h4 className="text-base font-bold text-foreground">
                รายงานการจัดสรรทุนและการเบิกจ่ายเงิน
              </h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                รายงานสรุปรายชื่อผู้ได้รับทุนการศึกษา จำนวนเงินที่ได้รับจัดสรร ยอดงบประมาณรวม ยอดเงินเบิกจ่าย และข้อมูลประกอบการโอนเงิน
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 text-xs text-muted-foreground space-y-1.5 border border-border/50">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>โครงสร้างเนื้อหาในไฟล์ Excel:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground/80 pl-1">
                <li>รายชื่อผู้ที่ได้รับอนุมัติทุนการศึกษา (Awarded)</li>
                <li>จำนวนเงินที่ได้รับจัดสรรรายบุคคล</li>
                <li>เลขบัตรประชาชน (เข้ารหัสความปลอดภัย), บัญชีธนาคาร</li>
                <li>สรุปเพดานงบประมาณ ยอดจัดสรรรวม และงบคงเหลือ</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-border mt-6 flex items-center justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              <span>เข้ารหัสด้วยรหัสผ่าน</span>
            </div>

            <button
              type="button"
              disabled={!isFinalized}
              onClick={() => handleOpenExportModal('allocation-disbursement')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออก Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Password Export Modal */}
      <PasswordExportModal
        isOpen={passwordModalOpen}
        onClose={() => {
          setPasswordModalOpen(false);
          setSelectedReportType(null);
        }}
        onExport={handleExecuteExport}
        reportTitle={
          selectedReportType === 'eval-rankings'
            ? 'รายงานผลการประเมินและอันดับผู้สมัคร'
            : 'รายงานการจัดสรรทุนและการเบิกจ่ายเงิน'
        }
        reportCode={
          selectedReportType === 'eval-rankings'
            ? 'RPT-EVAL-RANKINGS'
            : 'RPT-ALLOCATION-DISBURSE'
        }
      />
    </div>
  );
}
