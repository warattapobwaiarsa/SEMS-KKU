/**
 * ศูนย์กลางการส่งออกรายงาน (PDPA-Compliant Report Export Hub)
 * Route: /admin/reports
 * สอดคล้องกับ Scope 1.3.2.11, 1.3.2.12 และ Wireframes p1 - p9
 */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Download,
  Shield,
  Lock,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle2,
  TableProperties,
  ArrowRight,
  Database,
  Building,
} from 'lucide-react';
import { PageHeader, StatusBadge, Select } from '@/components/ui';
import { fetchRoundsList } from '@/services/rounds.service';
import type { ScholarshipRoundListItem } from '@/types/rounds';
import { PasswordExportModal } from '@/components/reports/password-export-modal';
import {
  exportEvaluationResultsReport,
  exportAllocationDisbursementReport,
} from '@/services/reports.service';

export default function ReportsPage() {
  const [rounds, setRounds] = useState<ScholarshipRoundListItem[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Modal State
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<
    'eval-rankings' | 'allocation-disbursement' | null
  >(null);

  // Selected Round
  const selectedRound = useMemo(
    () => rounds.find((r) => r.id === selectedRoundId) ?? null,
    [rounds, selectedRoundId],
  );

  useEffect(() => {
    let isMounted = true;
    setLoadingRounds(true);
    fetchRoundsList({ limit: 50 })
      .then((res) => {
        if (!isMounted) return;
        const list = res.data || [];
        setRounds(list);
        if (list.length > 0) {
          // Default to first closed round or first round
          const closed = list.find((r) => r.status === 'CLOSED');
          setSelectedRoundId(closed ? closed.id : list[0].id);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดรอบทุนได้');
      })
      .finally(() => {
        if (isMounted) setLoadingRounds(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const isDraft = selectedRound?.status === 'DRAFT';
  const isOpen = selectedRound?.status === 'OPEN';
  const isClosed = selectedRound?.status === 'CLOSED';

  const handleOpenExportModal = (type: 'eval-rankings' | 'allocation-disbursement') => {
    setSelectedReportType(type);
    setPasswordModalOpen(true);
  };

  const handleExecuteExport = async (password: string) => {
    if (!selectedRoundId || !selectedReportType) return;
    if (selectedReportType === 'eval-rankings') {
      await exportEvaluationResultsReport(selectedRoundId, password);
      setExportSuccess('ส่งออกรายงานสรุปผลการประเมินและอันดับ (.xlsx) สำเร็จ');
    } else {
      await exportAllocationDisbursementReport(selectedRoundId, password);
      setExportSuccess('ส่งออกรายงานผลการจัดสรรทุนการศึกษา (.xlsx) สำเร็จ');
    }
    setTimeout(() => setExportSuccess(null), 4000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* ส่วนหัวหน้าจอ */}
      <PageHeader
        title="รายงานและส่งออกข้อมูล"
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/scholarship-allocation"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-border bg-background hover:bg-muted text-foreground transition"
            >
              <span>การจัดสรรทุน</span>
            </Link>
            <Link
              href="/admin/evaluation-results"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-border bg-background hover:bg-muted text-foreground transition"
            >
              <span>ผลการประเมินและอันดับ</span>
            </Link>
          </div>
        }
      />

      {/* แถบเลือกรอบทุน Context */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <label htmlFor="round-report-select" className="text-xs font-bold text-foreground block">
              เลือกรอบทุนการศึกษาสำหรับออกรายงาน:
            </label>
            <span className="text-xs text-muted-foreground">
              (รายงานสรุปจะอ้างอิงข้อมูลคะแนนและการจัดสรรเฉพาะรอบทุนที่เลือก)
            </span>
          </div>
        </div>

        <div className="min-w-[320px]">
          <Select
            id="round-report-select"
            value={selectedRoundId ? String(selectedRoundId) : ''}
            onChange={(e) => setSelectedRoundId(Number(e.target.value))}
            disabled={loadingRounds}
          >
            {rounds.map((r) => (
              <option key={r.id} value={String(r.id)}>
                {r.name} ({r.academicYear}/{r.semester}) [{r.status}]
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* แบนเนอร์แจ้งสถานะ */}
      {exportSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2 Main Report Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: รายงานสรุปผลการประเมินและอันดับ */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <TableProperties className="w-5 h-5 text-primary" />
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  REPORT_01 / PUBLIC_ACADEMIC
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isDraft
                    ? 'bg-slate-100 text-slate-600 border border-slate-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {isDraft ? 'ยังไม่พร้อมส่งออก (สถานะร่าง)' : 'พร้อมส่งออก'}
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground">
                รายงานสรุปผลการประเมินและอันดับ
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                รายงานผลคะแนนเฉลี่ยของผู้สมัครทุกคน พร้อมการจัดอันดับและคะแนนแยกรายเกณฑ์การประเมิน สำหรับรายงานต่อคณะกรรมการ
              </p>
            </div>

            {/* รายการฟิลด์ข้อมูล */}
            <div className="bg-muted/40 border border-border/70 rounded-xl p-3.5 text-xs space-y-1.5">
              <span className="font-semibold text-foreground block">
                ข้อมูลในไฟล์ Excel:
              </span>
              <ul className="text-muted-foreground space-y-1 text-xs list-disc list-inside">
                <li>อันดับ (Rank) และคะแนนเฉลี่ยรวม</li>
                <li>รหัสนักศึกษา, ชื่อ-นามสกุล, คณะ, สาขาวิชา, ชั้นปี, เกรดเฉลี่ย (GPA)</li>
                <li>คะแนนแยกรายเกณฑ์ย่อย และเกณฑ์ชี้ขาด (Tie-Breaker)</li>
                <li>จำนวนผู้ประเมินที่ส่งคะแนนแล้วของแต่ละผู้สมัคร</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">
              <span>รูปแบบ: XLSX (เข้ารหัสผ่าน)</span>
            </div>
            <button
              type="button"
              disabled={isDraft}
              onClick={() => handleOpenExportModal('eval-rankings')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออกรายงาน (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Card 2: รายงานผลการจัดสรรทุนการศึกษา */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-600" />
                <span className="font-mono text-xs font-semibold text-amber-700">
                  REPORT_02 / CONFIDENTIAL (PDPA)
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  !isClosed
                    ? 'bg-slate-100 text-slate-600 border border-slate-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {!isClosed ? 'ต้องปิดรอบทุนก่อน' : 'พร้อมส่งออก'}
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground">
                รายงานผลการจัดสรรทุนการศึกษา
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                รายงานผลการจัดสรรและยอดเงินทุนรายคน รวมเลขประจำตัวประชาชน 13 หลัก สำหรับงานเบิกจ่ายงบประมาณและการโอนเงินทุน
              </p>
            </div>

            {/* กล่องเตือน PDPA */}
            <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-3.5 space-y-1 text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>ไฟล์นี้มีข้อมูลส่วนบุคคลอ่อนไหว (เลขบัตรประชาชน)</span>
              </div>
              <p className="text-xs text-amber-800/90 leading-relaxed">
                ข้อมูลอยู่ภายใต้การคุ้มครองตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) ใช้เฉพาะงานโอนเงินทุนของกองคลังเท่านั้น และระบบจะบันทึก Audit Log การส่งออกทุกครั้ง
              </p>
            </div>

            {/* รายการฟิลด์ข้อมูล */}
            <div className="bg-muted/40 border border-border/70 rounded-xl p-3.5 text-xs space-y-1.5">
              <span className="font-semibold text-foreground block">
                ข้อมูลในไฟล์ Excel:
              </span>
              <ul className="text-muted-foreground space-y-1 text-xs list-disc list-inside">
                <li>เลขประจำตัวประชาชน 13 หลักของผู้ได้รับทุน (สำหรับ PromptPay)</li>
                <li>รหัสนักศึกษา, ชื่อ-นามสกุล, คณะ, เบอร์โทรศัพท์, อีเมล</li>
                <li>จำนวนเงินทุนที่ได้รับอนุมัติ (บาท) และประเภททุน</li>
                <li>ยอดงบประมาณรวมและสรุปการจัดสรรของรอบทุน</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">
              <span>ความปลอดภัย: บังคับเข้ารหัสผ่าน</span>
            </div>
            <button
              type="button"
              disabled={!isClosed}
              onClick={() => handleOpenExportModal('allocation-disbursement')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออกรายงานเบิกจ่าย (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      {/* แถบ Compliance Footer Information */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-primary shrink-0" />
          <span>
            คอลัมน์และรูปแบบรายงานได้รับการกำหนดตามมาตรฐานระบบ (ISO/IEC 29110) และทุกประวัติการส่งออกถูกบันทึกใน Audit Log
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
          <span>RETENTION: 6 YEARS (PDPA)</span>
        </div>
      </div>

      {/* Password Export Modal */}
      <PasswordExportModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onExport={handleExecuteExport}
        reportTitle={
          selectedReportType === 'eval-rankings'
            ? 'รายงานสรุปผลการประเมินและอันดับ'
            : 'รายงานผลการจัดสรรทุนการศึกษา'
        }
        reportCode={
          selectedReportType === 'eval-rankings'
            ? 'REPORT_01 (EVAL_RANKINGS)'
            : 'REPORT_02 (ALLOCATION_DISBURSEMENT)'
        }
      />
    </div>
  );
}
