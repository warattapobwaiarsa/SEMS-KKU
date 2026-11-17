'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Save,
  Loader2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { StatusBadge, Select } from '@/components/ui';
import { fetchRoundEvaluationResults } from '@/services/evaluation-results.service';
import {
  fetchAllocationSummary,
  setRoundBudget,
  saveAllocations,
  finalizeAllocation,
  reopenAllocation,
} from '@/services/allocation.service';
import type {
  AllocationSummaryData,
  AllocationApplicantItem,
} from '@/types/allocation';
import { BudgetBarometer } from '@/components/allocation/budget-barometer';
import { SetBudgetModal } from '@/components/allocation/set-budget-modal';
import { ApplicantDetailModal } from '@/components/allocation/applicant-detail-modal';
import { FinalizeModal } from '@/components/allocation/finalize-modal';
import { useDebounce } from '@/lib/use-debounce';

interface RoundAllocationTabProps {
  roundId: number;
  roundStatus: string;
}

export function RoundAllocationTab({
  roundId,
  roundStatus,
}: RoundAllocationTabProps) {
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

  // Auto-allocate by rank modal
  const [showAutoFillModal, setShowAutoFillModal] = useState(false);
  const [autoAmountPerHead, setAutoAmountPerHead] = useState<number>(20000);
  const [autoMaxRecipients, setAutoMaxRecipients] = useState<number>(10);

  const [savingChanges, setSavingChanges] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isClosedRound = roundStatus === 'CLOSED';

  // โหลดข้อมูลการจัดสรรของรอบทุน
  const loadAllocationData = useCallback(async () => {
    if (!isClosedRound) return;
    try {
      setLoadingData(true);
      setError(null);
      setSaveSuccess(null);
      setHasUnsavedChanges(false);

      const res = await fetchAllocationSummary(roundId);
      let summaryData = res.data;

      // ถ้าในรอบทุนยังไม่มีรายการจัดสรร ให้ดึงผลการประเมินมาตั้งต้น
      if (!summaryData.allocations || summaryData.allocations.length === 0) {
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
          // ignore evaluation results error
        }
      }

      setSummary(summaryData);
      setItems(summaryData.allocations || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูลการจัดสรร');
    } finally {
      setLoadingData(false);
    }
  }, [roundId, isClosedRound]);

  useEffect(() => {
    void loadAllocationData();
  }, [loadAllocationData]);

  // คำนวณยอดจัดสรรสด (Real-time Calculation)
  const currentTotalBudget = summary?.totalBudget ?? 0;
  const currentAllocatedAmount = useMemo(() => {
    return items.reduce((acc, cur) => (cur.isAwarded ? acc + (cur.amount || 0) : acc), 0);
  }, [items]);
  const currentRemainingBudget = currentTotalBudget - currentAllocatedAmount;
  const currentRecipientsCount = useMemo(() => {
    return items.filter((cur) => cur.isAwarded).length;
  }, [items]);

  const isFinalized = summary?.status === 'FINALIZED';
  const canEditBudget = isClosedRound && !isFinalized && currentAllocatedAmount === 0;

  // Toggle ได้รับทุน
  const handleToggleAwarded = (applicantId: number) => {
    if (isFinalized) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.applicantId === applicantId) {
          const nextAwarded = !item.isAwarded;
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

  // เปลี่ยนจำนวนเงิน
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

  // บันทึกการจัดสรร (Save)
  const handleSaveChanges = async () => {
    if (isFinalized) return;
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
      await saveAllocations(roundId, payload);
      setSaveSuccess('บันทึกผลการจัดสรรทุนเรียบร้อยแล้ว');
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถบันทึกผลการจัดสรรได้');
    } finally {
      setSavingChanges(false);
    }
  };

  // กำหนดงบประมาณรวม (Set / Edit Budget)
  const handleConfirmBudget = async (newBudget: number) => {
    try {
      setError(null);
      await setRoundBudget(roundId, newBudget);
      setSummary((prev) => (prev ? { ...prev, totalBudget: newBudget } : null));
      setSaveSuccess(`กำหนดงบประมาณรวม ${newBudget.toLocaleString()} บาท สำเร็จ`);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถบันทึกงบประมาณได้');
      throw err;
    }
  };

  // ยืนยัน / ปลดล็อกจัดสรร (Finalize / Reopen)
  const handleConfirmFinalize = async () => {
    try {
      setError(null);
      if (finalizeMode === 'finalize') {
        if (hasUnsavedChanges) {
          await handleSaveChanges();
        }
        await finalizeAllocation(roundId);
        setSummary((prev) => (prev ? { ...prev, status: 'FINALIZED' } : null));
        setSaveSuccess('ยืนยันผลการจัดสรรสำเร็จ (Finalized) และล็อกการแก้ไขเรียบร้อยแล้ว');
      } else {
        await reopenAllocation(roundId);
        setSummary((prev) => (prev ? { ...prev, status: 'EDITING' } : null));
        setSaveSuccess('ปลดล็อกการแก้ไขผลการจัดสรรเรียบร้อยแล้ว');
      }
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถดำเนินการเปลี่ยนสถานะได้');
      throw err;
    }
  };

  // จัดสรรอัตโนมัติตามอันดับ (Auto-fill by Rank)
  const handleApplyAutoFill = () => {
    if (isFinalized) return;
    const sorted = [...items].sort((a, b) => a.rank - b.rank);
    let remaining = currentTotalBudget;
    let count = 0;

    const updated = sorted.map((applicant) => {
      if (count < autoMaxRecipients && remaining >= autoAmountPerHead) {
        remaining -= autoAmountPerHead;
        count++;
        return {
          ...applicant,
          isAwarded: true,
          amount: autoAmountPerHead,
        };
      } else {
        return {
          ...applicant,
          isAwarded: false,
          amount: 0,
        };
      }
    });

    setItems(updated);
    setHasUnsavedChanges(true);
    setShowAutoFillModal(false);
    setSaveSuccess(`จัดสรรให้อันดับ 1 ถึง ${count} คนละ ${autoAmountPerHead.toLocaleString()} บาท เรียบร้อยแล้ว (อย่าลืมกดบันทึก)`);
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  // ฟิลเตอร์ข้อมูลรายการผู้สมัคร
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        debouncedSearch === '' ||
        item.studentCode.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.firstName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.lastName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.faculty.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'AWARDED' && item.isAwarded) ||
        (statusFilter === 'NOT_AWARDED' && !item.isAwarded);

      return matchSearch && matchStatus;
    });
  }, [items, debouncedSearch, statusFilter]);

  // หากรอบยังไม่ปิด (Not CLOSED) ให้แสดงการแนะนำสเต็ป
  if (!isClosedRound) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center max-w-2xl mx-auto my-6 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
          <Banknote className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          แท็บการจัดสรรทุนจะพร้อมใช้งานเมื่อ &quot;ปิดรอบทุน (CLOSED)&quot;
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          {roundStatus === 'DRAFT'
            ? 'รอบทุนนี้ยังอยู่ในสถานะแบบร่าง (Draft) กรุณาตรวจสอบความพร้อมและเปิดรับสมัครก่อน'
            : 'รอบทุนกำลังอยู่ในช่วงเปิดประเมิน (Open) กรุณาให้กรรมการให้คะแนนและปิดรอบทุนก่อน จึงจะสามารถจัดสรรงบประมาณได้'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground font-medium">
            สถานะปัจจุบัน: <strong className="text-foreground">{roundStatus}</strong>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <p>{saveSuccess}</p>
        </div>
      )}

      {/* Budget Barometer */}
      <BudgetBarometer
        totalBudget={currentTotalBudget}
        allocatedAmount={currentAllocatedAmount}
        remainingBudget={currentRemainingBudget}
        recipientsCount={currentRecipientsCount}
      />

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl">
        <div className="flex flex-1 items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="ค้นหารหัสนักศึกษา, ชื่อ, คณะ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Filter Status */}
          <div className="w-48">
            <Select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'ALL' | 'AWARDED' | 'NOT_AWARDED')
              }
            >
              <option value="ALL">ผู้สมัครทั้งหมด</option>
              <option value="AWARDED">ได้รับทุนแล้ว</option>
              <option value="NOT_AWARDED">ยังไม่ได้รับทุน</option>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canEditBudget && (
            <button
              type="button"
              onClick={() => {
                setIsEditingBudget(currentTotalBudget > 0);
                setBudgetModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-muted hover:bg-muted/80 border border-border rounded-xl transition-colors"
            >
              <Edit2 className="w-4 h-4 text-muted-foreground" />
              <span>{currentTotalBudget > 0 ? 'แก้ไขงบประมาณ' : 'กำหนดงบประมาณ'}</span>
            </button>
          )}
          {!isFinalized && (
            <>
              <button
                type="button"
                onClick={() => setShowAutoFillModal(true)}
                disabled={currentTotalBudget === 0}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="จัดสรรด่วนตามอันดับคะแนน"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>จัดสรรตามอันดับ</span>
              </button>

              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={savingChanges || !hasUnsavedChanges || currentRemainingBudget < 0}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingChanges ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>บันทึกการจัดสรร</span>
              </button>
            </>
          )}

          {/* Finalize / Reopen Button */}
          {isFinalized ? (
            <button
              type="button"
              onClick={() => {
                setFinalizeMode('reopen');
                setFinalizeModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ปลดล็อกแก้ไข</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setFinalizeMode('finalize');
                setFinalizeModalOpen(true);
              }}
              disabled={currentAllocatedAmount === 0 || currentRemainingBudget < 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Verified className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>ยืนยันผลจัดสรร (Finalize)</span>
            </button>
          )}
        </div>
      </div>

      {/* Allocation Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        {loadingData ? (
          <div className="p-12 text-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm">กำลังโหลดข้อมูลผู้สมัครและผลการประเมิน...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Filter className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
            <p className="text-sm">ไม่พบรายชื่อผู้สมัครตามเงื่อนไขที่เลือก</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4 text-center w-16">อันดับ</th>
                  <th className="py-3 px-4 w-36">รหัสนักศึกษา</th>
                  <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                  <th className="py-3 px-4">คณะ / สาขาวิชา</th>
                  <th className="py-3 px-4 text-center w-20">GPAX</th>
                  <th className="py-3 px-4 text-right w-28">คะแนนรวม</th>
                  <th className="py-3 px-4 text-center w-36">การรับทุน</th>
                  <th className="py-3 px-4 text-right w-44">จำนวนเงิน (บาท)</th>
                  <th className="py-3 px-4 text-center w-20">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredItems.map((applicant) => (
                  <tr
                    key={applicant.applicantId}
                    className={`hover:bg-muted/30 transition-colors ${
                      applicant.isAwarded ? 'bg-emerald-500/5' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          applicant.rank <= 3
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {applicant.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-foreground">
                      {applicant.studentCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">
                        {applicant.titlePrefix}
                        {applicant.firstName} {applicant.lastName}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      <div>{applicant.faculty}</div>
                      <div className="text-muted-foreground/70">{applicant.major}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-sm">
                      {applicant.gpa.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                      {applicant.finalScore.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleAwarded(applicant.applicantId)}
                        disabled={isFinalized}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed ${
                          applicant.isAwarded ? 'bg-emerald-600' : 'bg-input'
                        }`}
                        role="switch"
                        aria-checked={applicant.isAwarded}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            applicant.isAwarded ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {applicant.isAwarded ? (
                        <input
                          type="text"
                          value={applicant.amount.toLocaleString()}
                          onChange={(e) =>
                            handleAmountChange(applicant.applicantId, e.target.value)
                          }
                          disabled={isFinalized}
                          className="w-32 px-3 py-1 text-right font-mono text-sm rounded-lg border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      ) : (
                        <span className="text-muted-foreground text-xs italic">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedApplicant(applicant);
                          setApplicantModalOpen(true);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="ดูรายละเอียดผู้สมัครและข้อมูล PDPA"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <SetBudgetModal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        onConfirm={handleConfirmBudget}
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
        onConfirm={handleConfirmFinalize}
        mode={finalizeMode}
        totalBudget={currentTotalBudget}
        allocatedAmount={currentAllocatedAmount}
        remainingBudget={currentRemainingBudget}
        recipientsCount={currentRecipientsCount}
      />

      {/* Auto-fill Modal */}
      {showAutoFillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6 animate-spring-pop space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  จัดสรรทุนอัตโนมัติตามอันดับ
                </h3>
                <p className="text-xs text-muted-foreground">
                  กำหนดจำนวนเงินต่อทุนและจำนวนผู้รับทุนตามลำดับผลคะแนน
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  จำนวนเงินต่อทุน (บาท)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={autoAmountPerHead}
                  onChange={(e) => setAutoAmountPerHead(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  จำนวนผู้รับทุนสูงสุด (คน)
                </label>
                <input
                  type="number"
                  min="1"
                  max={items.length}
                  value={autoMaxRecipients}
                  onChange={(e) => setAutoMaxRecipients(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-muted/60 text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>งบประมาณที่จะใช้:</span>
                  <span className="font-mono font-medium text-foreground">
                    {(autoAmountPerHead * autoMaxRecipients).toLocaleString()} บาท
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>งบประมาณรวมที่มี:</span>
                  <span className="font-mono font-medium text-foreground">
                    {currentTotalBudget.toLocaleString()} บาท
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAutoFillModal(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleApplyAutoFill}
                disabled={autoAmountPerHead * autoMaxRecipients > currentTotalBudget}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ยืนยันการจัดสรร
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
