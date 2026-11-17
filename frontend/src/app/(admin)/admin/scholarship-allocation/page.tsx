/**
 * หน้าจอการจัดสรรทุนการศึกษา (Scholarship Allocation Workspace)
 * Route: /admin/scholarship-allocation
 * สอดคล้องกับ Scope 1.3.2.9, 1.3.2.10 และ Wireframes g1 - g14
 */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Banknote,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Eye,
  Lock,
  Edit2,
  RotateCcw,
  Verified,
  Info,
  Calendar,
  Save,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { PageHeader, StatusBadge, Select } from '@/components/ui';
import { fetchRoundsList } from '@/services/rounds.service';
import { fetchRoundEvaluationResults } from '@/services/evaluation-results.service';
import {
  fetchAllocationSummary,
  setRoundBudget,
  saveAllocations,
  finalizeAllocation,
  reopenAllocation,
} from '@/services/allocation.service';
import type { ScholarshipRoundListItem } from '@/types/rounds';
import type {
  AllocationSummaryData,
  AllocationApplicantItem,
} from '@/types/allocation';
import { BudgetBarometer } from '@/components/allocation/budget-barometer';
import { SetBudgetModal } from '@/components/allocation/set-budget-modal';
import { ApplicantDetailModal } from '@/components/allocation/applicant-detail-modal';
import { FinalizeModal } from '@/components/allocation/finalize-modal';
import { useDebounce } from '@/lib/use-debounce';

export default function ScholarshipAllocationPage() {
  const [rounds, setRounds] = useState<ScholarshipRoundListItem[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // ข้อมูลการจัดสรร
  const [summary, setSummary] = useState<AllocationSummaryData | null>(null);
  const [items, setItems] = useState<AllocationApplicantItem[]>([]);

  // ฟิลเตอร์และค้นหา
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AWARDED' | 'NOT_AWARDED'>('ALL');

  // Modals
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<AllocationApplicantItem | null>(null);
  const [applicantModalOpen, setApplicantModalOpen] = useState(false);
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [finalizeMode, setFinalizeMode] = useState<'finalize' | 'reopen'>('finalize');

  const [savingChanges, setSavingChanges] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // เลือกรอบทุน
  const selectedRound = useMemo(
    () => rounds.find((r) => r.id === selectedRoundId) ?? null,
    [rounds, selectedRoundId],
  );

  // โหลดรายการรอบทุนทั้งหมด
  useEffect(() => {
    let isMounted = true;
    setLoadingRounds(true);
    fetchRoundsList({ limit: 50 })
      .then((res) => {
        if (!isMounted) return;
        const list = res.data || [];
        setRounds(list);
        if (list.length > 0) {
          // ค่าเริ่มต้น: เลือกรอบที่ Closed ก่อน หรือรอบแรก
          const closedRound = list.find((r) => r.status === 'CLOSED');
          setSelectedRoundId(closedRound ? closedRound.id : list[0].id);
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

  // โหลดข้อมูลการจัดสรรของรอบที่เลือก
  const loadAllocationData = useCallback(async (roundId: number) => {
    try {
      setLoadingData(true);
      setError(null);
      setSaveSuccess(null);
      setHasUnsavedChanges(false);

      const res = await fetchAllocationSummary(roundId);
      let summaryData = res.data;

      // ถ้าในรอบทุนยังไม่มีรายการจัดสรร แต่เป็นรอบที่ปิดแล้ว ให้ดึงผลการประเมินมาตั้งต้น
      if (summaryData.allocations.length === 0) {
        try {
          const evalRes = await fetchRoundEvaluationResults(roundId, { limit: 100 });
          if (evalRes.data?.items && evalRes.data.items.length > 0) {
            const defaultAllocations: AllocationApplicantItem[] = evalRes.data.items.map(
              (app, idx) => ({
                id: app.applicantId,
                applicantId: app.applicantId,
                studentCode: app.studentCode,
                titlePrefix: app.titlePrefix || '',
                firstName: app.firstName,
                lastName: app.lastName,
                faculty: app.faculty,
                major: app.major,
                studyYear: app.studyYear,
                gpa: app.gpa,
                finalScore: app.finalScore.average,
                rank: app.rank || idx + 1,
                isAwarded: false,
                amount: 0,
                maskedCitizenId: '1-4099-xxxxx-xx-x',
                phone: '081-xxx-xxxx',
                email: `${app.studentCode.toLowerCase()}@kkumail.com`,
              }),
            );
            summaryData = {
              ...summaryData,
              allocations: defaultAllocations,
            };
          }
        } catch {
          // ignore evaluation results load error
        }
      }

      setSummary(summaryData);
      setItems(summaryData.allocations);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูลการจัดสรร');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRoundId) {
      void loadAllocationData(selectedRoundId);
    }
  }, [selectedRoundId, loadAllocationData]);

  // คำนวณยอดจัดสรรสด (Real-time Calculation Engine)
  const currentTotalBudget = summary?.totalBudget ?? 0;
  const currentAllocatedAmount = useMemo(() => {
    return items.reduce((acc, cur) => (cur.isAwarded ? acc + (cur.amount || 0) : acc), 0);
  }, [items]);
  const currentRemainingBudget = currentTotalBudget - currentAllocatedAmount;
  const currentRecipientsCount = useMemo(() => {
    return items.filter((cur) => cur.isAwarded).length;
  }, [items]);

  const isFinalized = summary?.status === 'FINALIZED';
  const isClosedRound = selectedRound?.status === 'CLOSED';
  const canEditBudget = isClosedRound && !isFinalized && currentAllocatedAmount === 0;

  // จัดการ Toggle สวิตช์การได้รับทุน
  const handleToggleAwarded = (applicantId: number) => {
    if (isFinalized) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.applicantId === applicantId) {
          const nextAwarded = !item.isAwarded;
          // ถ้าเปิดสวิตช์แต่ยังไม่มีจำนวนเงิน ให้ใส่ค่าเริ่มต้น 20,000 หรือ 0
          const nextAmount = nextAwarded ? (item.amount > 0 ? item.amount : 20000) : 0;
          return {
            ...item,
            isAwarded: nextAwarded,
            amount: nextAmount,
          };
        }
        return item;
      }),
    );
    setHasUnsavedChanges(true);
  };

  // จัดการเปลี่ยนจำนวนเงิน
  const handleAmountChange = (applicantId: number, valStr: string) => {
    if (isFinalized) return;
    const cleanNum = parseFloat(valStr.replace(/,/g, '')) || 0;
    setItems((prev) =>
      prev.map((item) => {
        if (item.applicantId === applicantId) {
          return {
            ...item,
            amount: cleanNum,
          };
        }
        return item;
      }),
    );
    setHasUnsavedChanges(true);
  };

  // บันทึกการเปลี่ยนแปลง (Save Allocations)
  const handleSaveChanges = async () => {
    if (!selectedRoundId || isFinalized) return;
    if (currentRemainingBudget < 0) {
      setError('ยอดเงินที่จัดสรรเกินเพดานงบประมาณรวม กรุณาปรับลดยอดเงินก่อนบันทึก');
      return;
    }

    setSavingChanges(true);
    setError(null);
    try {
      const payload = items.map((it) => ({
        applicantId: it.applicantId,
        isAwarded: it.isAwarded,
        amount: it.amount,
      }));
      await saveAllocations(selectedRoundId, payload);
      setSaveSuccess('บันทึกผลการจัดสรรทุนเรียบร้อยแล้ว');
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถบันทึกผลการจัดสรรได้');
    } finally {
      setSavingChanges(false);
    }
  };

  // กำหนด/แก้ไขงบประมาณรวม
  const handleSaveBudget = async (newBudget: number) => {
    if (!selectedRoundId) return;
    await setRoundBudget(selectedRoundId, newBudget);
    setSummary((prev) => (prev ? { ...prev, totalBudget: newBudget } : null));
    setSaveSuccess('บันทึกยอดงบประมาณรวมสำเร็จ');
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  // ยืนยัน Finalize หรือ Reopen
  const handleFinalizeOrReopen = async () => {
    if (!selectedRoundId) return;
    if (finalizeMode === 'finalize') {
      await finalizeAllocation(selectedRoundId);
      setSummary((prev) => (prev ? { ...prev, status: 'FINALIZED' } : null));
      setSaveSuccess('ยืนยันผลการจัดสรรทุนสำเร็จ (Finalized) ข้อมูลถูกล็อคแล้ว');
    } else {
      await reopenAllocation(selectedRoundId);
      setSummary((prev) => (prev ? { ...prev, status: 'EDITING' } : null));
      setSaveSuccess('เปิดผลการจัดสรรกลับมาแก้ไขแล้ว (Editing)');
    }
    setHasUnsavedChanges(false);
    setTimeout(() => setSaveSuccess(null), 3500);
  };

  // กรองข้อมูลในตาราง
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // ตัวกรองค้นหา
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const matchCode = item.studentCode.toLowerCase().includes(query);
        const matchName = `${item.firstName} ${item.lastName}`.toLowerCase().includes(query);
        if (!matchCode && !matchName) return false;
      }
      // ตัวกรองสถานะ
      if (statusFilter === 'AWARDED' && !item.isAwarded) return false;
      if (statusFilter === 'NOT_AWARDED' && item.isAwarded) return false;
      return true;
    });
  }, [items, debouncedSearch, statusFilter]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* ส่วนหัวหน้าจอ */}
      <PageHeader
        moduleBadge="การเงินและการจัดสรร"
        moduleBadgeIcon={Banknote}
        title="การจัดสรรทุนการศึกษา"
        description="บริหารจัดการงบประมาณรวมและบันทึกผลการจัดสรรทุนการศึกษาตามมติคณะกรรมการ"
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/evaluation-results"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-border bg-background hover:bg-muted text-foreground transition"
            >
              <span>ดูอันดับคะแนน</span>
            </Link>
            <Link
              href="/admin/reports"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>ส่งออกรายงาน</span>
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
            <label htmlFor="round-select" className="text-xs font-bold text-foreground block">
              เลือกรอบทุนการศึกษาสำหรับจัดสรร:
            </label>
            <span className="text-xs text-muted-foreground">
              (การจัดสรรทุนจะดำเนินการได้เมื่อรอบทุนเปลี่ยนเป็นสถานะ Closed แล้ว)
            </span>
          </div>
        </div>

        <div className="min-w-[320px]">
          <Select
            id="round-select"
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
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* กรณีที่ 1: รอบทุนยังเป็น Draft หรือ Open (g1_allocation_round_open_or_draft_locked) */}
      {!isClosedRound && selectedRound && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-bold text-base text-foreground">
              รอบทุนนี้ยังไม่ปิดการประเมิน
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              รอบทุน <strong>{selectedRound.name}</strong> อยู่ในสถานะ{' '}
              <span className="font-semibold text-foreground">[{selectedRound.status}]</span>{' '}
              การจัดสรรงบประมาณจะเปิดให้ดำเนินการเมื่อรอบทุนปิดรับการประเมิน (สถานะ Closed) เรียบร้อยแล้ว
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/admin/scholarship-rounds"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-2xs"
            >
              <span>ไปที่หน้ารอบทุนการศึกษา</span>
            </Link>
          </div>
        </div>
      )}

      {/* กรณีที่ 2: รอบทุน Closed แล้ว แต่ยังไม่ได้กำหนดยอดงบประมาณรวม (g2_allocation_closed_no_budget_yet) */}
      {isClosedRound && currentTotalBudget === 0 && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 mx-auto flex items-center justify-center">
            <Banknote className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-bold text-base text-foreground">
              ยังไม่ได้กำหนดยอดงบประมาณรวม
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              รอบทุนนี้ปิดการประเมินเรียบร้อยแล้ว กรุณากำหนดยอดงบประมาณรวมประจำรอบตามมติคณะกรรมการเพื่อเริ่มต้นบันทึกการจัดสรรทุน
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setIsEditingBudget(false);
                setBudgetModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer"
            >
              <Banknote className="w-4 h-4" />
              <span>กำหนดยอดงบประมาณรวม</span>
            </button>
          </div>
        </div>
      )}

      {/* กรณีที่ 3: รอบทุน Closed และมีงบประมาณพร้อมจัดสรร (g4_allocation_workspace_editing) */}
      {isClosedRound && currentTotalBudget > 0 && (
        <>
          {/* Action Row & Status Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground">สถานะรอบ:</span>
              <StatusBadge label="Closed" variant="closed" />
              <span className="text-muted-foreground">•</span>
              <span className="text-xs font-semibold text-muted-foreground">การจัดสรร:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  isFinalized
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-primary text-primary-foreground border-transparent'
                }`}
              >
                {isFinalized ? 'Finalized (จัดสรรสำเร็จ)' : 'Editing (กำลังจัดสรร)'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* ปุ่มแก้ไขงบประมาณ */}
              <button
                type="button"
                disabled={!canEditBudget}
                onClick={() => {
                  setIsEditingBudget(true);
                  setBudgetModalOpen(true);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition ${
                  canEditBudget
                    ? 'border-border bg-background hover:bg-muted text-foreground cursor-pointer'
                    : 'border-dashed border-border/70 bg-muted/30 text-muted-foreground/60 cursor-not-allowed'
                }`}
                title={
                  canEditBudget
                    ? 'แก้ไขยอดงบประมาณรวม'
                    : 'แก้ไขงบประมาณได้เฉพาะเมื่อยอดจัดสรรยังเป็น 0 บาทเท่านั้น'
                }
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>แก้ไขงบประมาณ</span>
                {!canEditBudget && <Info className="w-3 h-3 ml-0.5" />}
              </button>

              {/* ปุ่มบันทึกการจัดสรร */}
              {!isFinalized && (
                <button
                  type="button"
                  disabled={savingChanges || !hasUnsavedChanges}
                  onClick={handleSaveChanges}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-border bg-background hover:bg-muted text-foreground transition disabled:opacity-40 cursor-pointer shadow-2xs"
                >
                  {savingChanges ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  ) : (
                    <Save className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <span>บันทึกแบบร่าง</span>
                </button>
              )}

              {/* ปุ่มยืนยันจัดสรรสำเร็จ หรือเปิดกลับมาแก้ไข */}
              {isFinalized ? (
                <button
                  type="button"
                  onClick={() => {
                    setFinalizeMode('reopen');
                    setFinalizeModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 transition cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>เปิดผลกลับมาแก้ไข</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={currentRemainingBudget < 0}
                  onClick={() => {
                    setFinalizeMode('finalize');
                    setFinalizeModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                >
                  <Verified className="w-3.5 h-3.5" />
                  <span>ยืนยันจัดสรรสำเร็จ</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Budget Barometer */}
          <BudgetBarometer
            totalBudget={currentTotalBudget}
            allocatedAmount={currentAllocatedAmount}
            remainingBudget={currentRemainingBudget}
            recipientsCount={currentRecipientsCount}
          />

          {/* Filter Toolbar */}
          <div className="bg-card border border-border/80 rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหาด้วยรหัสนักศึกษา หรือชื่อ-นามสกุล..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  สถานะ:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as 'ALL' | 'AWARDED' | 'NOT_AWARDED')
                  }
                  className="px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-foreground"
                >
                  <option value="ALL">ทั้งหมด</option>
                  <option value="AWARDED">ได้รับทุน</option>
                  <option value="NOT_AWARDED">ไม่ได้รับทุน</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-muted-foreground self-end sm:self-center">
              แสดง {filteredItems.length} รายการ
            </div>
          </div>

          {/* ตารางเมทริกซ์การจัดสรรทุนรายบุคคล */}
          <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                    <th className="py-3 px-4 text-center w-16">อันดับ</th>
                    <th className="py-3 px-4 w-32">รหัสนักศึกษา</th>
                    <th className="py-3 px-4">ชื่อ-นามสกุล</th>
                    <th className="py-3 px-4">คณะ / สาขาวิชา</th>
                    <th className="py-3 px-4 text-right w-28">คะแนนรวม</th>
                    <th className="py-3 px-4 text-center w-36">สถานะการได้รับทุน</th>
                    <th className="py-3 px-4 text-right w-44">จำนวนเงิน (บาท)</th>
                    <th className="py-3 px-4 text-center w-28">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground italic">
                        ไม่พบข้อมูลผู้สมัครที่ตรงกับเงื่อนไข
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr
                        key={item.applicantId}
                        className={`transition-colors ${
                          item.isAwarded
                            ? 'bg-blue-50/30 hover:bg-blue-50/50'
                            : 'hover:bg-muted/30'
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-bold font-mono text-muted-foreground">
                          {item.rank}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-foreground">
                          {item.studentCode}
                        </td>
                        <td className="py-3 px-4 font-semibold text-foreground">
                          {item.titlePrefix}
                          {item.firstName} {item.lastName}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground truncate max-w-[200px]">
                          {item.faculty} ({item.major})
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-primary">
                          {item.finalScore.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {/* Toggle Switch */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={item.isAwarded}
                            disabled={isFinalized}
                            onClick={() => handleToggleAwarded(item.applicantId)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                              item.isAwarded ? 'bg-primary' : 'bg-muted-foreground/30'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                item.isAwarded ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <input
                            type="text"
                            disabled={!item.isAwarded || isFinalized}
                            value={item.amount > 0 ? item.amount.toLocaleString() : '0'}
                            onChange={(e) =>
                              handleAmountChange(item.applicantId, e.target.value)
                            }
                            className={`w-32 px-2.5 py-1.5 text-right font-mono font-bold text-xs rounded-lg border transition ${
                              item.isAwarded && !isFinalized
                                ? 'bg-background border-border text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary'
                                : 'bg-muted/40 border-transparent text-muted-foreground cursor-not-allowed'
                            }`}
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApplicant(item);
                              setApplicantModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition cursor-pointer"
                            title="ดูรายละเอียดข้อมูลรายคนและเลขบัตรประชาชน"
                          >
                            <Eye className="w-3 h-3 text-muted-foreground" />
                            <span>ดูข้อมูล</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <SetBudgetModal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        onConfirm={handleSaveBudget}
        currentBudget={currentTotalBudget}
        isEditing={isEditingBudget}
      />

      <ApplicantDetailModal
        applicant={selectedApplicant}
        isOpen={applicantModalOpen}
        onClose={() => {
          setApplicantModalOpen(false);
          setSelectedApplicant(null);
        }}
      />

      <FinalizeModal
        isOpen={finalizeModalOpen}
        onClose={() => setFinalizeModalOpen(false)}
        onConfirm={handleFinalizeOrReopen}
        mode={finalizeMode}
        totalBudget={currentTotalBudget}
        allocatedAmount={currentAllocatedAmount}
        remainingBudget={currentRemainingBudget}
        recipientsCount={currentRecipientsCount}
      />
    </div>
  );
}
