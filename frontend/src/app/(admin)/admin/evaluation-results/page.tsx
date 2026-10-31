'use client';

import React, { useEffect, useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import {
  Award,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Users,
  Eye,
  Calendar,
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { fetchRoundsList } from '@/services/rounds.service';
import { fetchRoundEvaluationResults } from '@/services/evaluation-results.service';
import type { ScholarshipRoundListItem } from '@/types/rounds';
import type {
  RoundEvaluationResultsData,
  ApplicantResultItem,
} from '@/types/evaluation-results';
import {
  PageHeader,
  Select,
  StatusBadge,
  Pagination,
} from '@/components/ui';
import { ApplicantScoreDetailModal } from '@/components/evaluation-results/applicant-score-detail-modal';

export default function EvaluationResultsPage() {
  const [rounds, setRounds] = useState<ScholarshipRoundListItem[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [resultsData, setResultsData] = useState<RoundEvaluationResultsData | null>(null);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  // Modal detail state
  const [selectedApplicantId, setSelectedApplicantId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [, startTransition] = useTransition();

  // Selected round entity
  const selectedRound = useMemo(
    () => rounds.find((r) => r.id === selectedRoundId),
    [rounds, selectedRoundId],
  );

  // Load rounds on initial mount
  useEffect(() => {
    let isMounted = true;
    setLoadingRounds(true);

    fetchRoundsList({ limit: 100 })
      .then((res) => {
        if (!isMounted) return;
        const roundList = res.data || [];
        setRounds(roundList);
        if (roundList.length > 0) {
          // Default to first open round or first round
          const openRound = roundList.find((r) => r.status === 'OPEN') || roundList[0];
          setSelectedRoundId(openRound.id);
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

  // Fetch evaluation results when selected round, page, or filters change
  useEffect(() => {
    if (!selectedRoundId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchRoundEvaluationResults(selectedRoundId, {
      page,
      limit,
      search: searchTerm.trim() || undefined,
      faculty: facultyFilter.trim() || undefined,
    })
      .then((res) => {
        if (isMounted) {
          setResultsData(res.data);
          if (res.meta) {
            setMeta(res.meta);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดผลการประเมิน');
          setResultsData(null);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedRoundId, page, searchTerm, facultyFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFacultyFilter('');
    setPage(1);
  };

  const handleViewDetail = (applicantId: number) => {
    setSelectedApplicantId(applicantId);
    setModalOpen(true);
  };

  // Derive unique faculties from items for filter dropdown
  const facultyOptions = useMemo(() => {
    const set = new Set<string>();
    resultsData?.items?.forEach((a) => {
      if (a.faculty) set.add(a.faculty);
    });
    return Array.from(set);
  }, [resultsData]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* Standard SEMS Page Header */}
      <PageHeader
        moduleBadge="การประเมินและจัดสรรทุน"
        moduleBadgeIcon={Award}
        title="ผลการประเมินและอันดับ"
        description="ตรวจสอบคะแนนเฉลี่ยจากผู้ประเมินหลายท่าน พร้อมจัดอันดับอัตโนมัติตามเกณฑ์ Tie-break แบบเรียลไทม์"
        action={
          <Link
            href="/admin/scholarship-allocation"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>ไปหน้าการจัดสรรทุน</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {/* Top Context & Round Selector Bar (SEMS Design System) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-card border border-border/80 rounded-2xl shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="round-select" className="text-sm font-semibold text-foreground flex items-center gap-2 shrink-0">
            <Calendar className="h-4 w-4 text-primary" />
            <span>รอบทุนการศึกษา:</span>
          </label>

          {loadingRounds ? (
            <span className="text-sm text-muted-foreground animate-pulse">กำลังโหลดรอบทุน...</span>
          ) : rounds.length === 0 ? (
            <span className="text-sm text-muted-foreground">ยังไม่มีรอบทุนในระบบ</span>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-64 sm:w-80">
                <Select
                  id="round-select"
                  value={selectedRoundId || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    startTransition(() => {
                      setSelectedRoundId(val);
                      setPage(1);
                    });
                  }}
                >
                  {rounds.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (ปี {r.academicYear}/{r.semester})
                    </option>
                  ))}
                </Select>
              </div>

              {selectedRound && (
                <StatusBadge
                  variant={
                    selectedRound.status === 'OPEN'
                      ? 'open'
                      : selectedRound.status === 'CLOSED'
                      ? 'closed'
                      : 'draft'
                  }
                  label={
                    selectedRound.status === 'OPEN'
                      ? 'เปิดรับสมัคร (Open)'
                      : selectedRound.status === 'CLOSED'
                      ? 'ปิดรอบแล้ว (Closed)'
                      : 'แบบร่าง (Draft)'
                  }
                />
              )}

              {selectedRound && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground border border-border/60 font-mono">
                  ผู้สมัครทั้งหมด {meta.total} คน
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary KPI Cards (SEMS Theme Tokens) */}
      {resultsData?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border/80 rounded-2xl p-4.5 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                ผู้สมัครทั้งหมด
              </span>
              <div className="text-2xl font-bold font-mono text-foreground mt-0.5">
                {resultsData.summary.totalApplicants ?? 0}{' '}
                <span className="text-xs font-normal text-muted-foreground font-sans">คน</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-4.5 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                ประเมินเสร็จแล้ว
              </span>
              <div className="text-2xl font-bold font-mono text-foreground mt-0.5">
                {resultsData.summary.evaluatedApplicants ?? 0}{' '}
                <span className="text-xs font-normal text-muted-foreground font-sans">คน</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-4.5 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                รอการประเมิน
              </span>
              <div className="text-2xl font-bold font-mono text-foreground mt-0.5">
                {resultsData.summary.pendingApplicants ?? 0}{' '}
                <span className="text-xs font-normal text-muted-foreground font-sans">คน</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-4.5 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                ส่งผลคะแนนแล้ว
              </span>
              <div className="text-2xl font-bold font-mono text-foreground mt-0.5">
                {resultsData.summary.totalEvaluations ?? 0}{' '}
                <span className="text-xs font-normal text-muted-foreground font-sans">ครั้ง</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-3 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="ค้นหาด้วยรหัสนักศึกษา หรือชื่อ-นามสกุล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-background/50 border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-56">
            <Select
              icon={Filter}
              value={facultyFilter}
              onChange={(e) => {
                setFacultyFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">ทุกคณะ / สำนักวิชา</option>
              {facultyOptions.map((fac) => (
                <option key={fac} value={fac}>
                  {fac}
                </option>
              ))}
            </Select>
          </div>

          {(searchTerm || facultyFilter) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-xl hover:bg-muted/60 transition shrink-0"
              title="ล้างคำค้นหาและตัวกรอง"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">ล้างตัวกรอง</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setPage(1)}
            className="px-4 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition shadow-xs shrink-0 cursor-pointer"
          >
            ค้นหา
          </button>
        </div>
      </div>

      {/* Main Results Table */}
      <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm">กำลังคำนวณคะแนนเฉลี่ยและจัดอันดับ...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 gap-3 text-destructive">
            <AlertCircle className="w-6 h-6" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        ) : !resultsData || !resultsData.items || resultsData.items.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <FileSpreadsheet className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-base font-semibold text-foreground">ไม่พบข้อมูลผลการประเมิน</p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchTerm || facultyFilter
                ? 'ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองคณะ'
                : 'ยังไม่มีผู้สมัครในรอบนี้ หรือรอบยังไม่มีการนำเข้าข้อมูล'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground text-xs uppercase font-semibold select-none">
                  <tr>
                    <th className="py-3.5 px-4 w-20 text-center">อันดับ</th>
                    <th className="py-3.5 px-4">รหัสนักศึกษา</th>
                    <th className="py-3.5 px-4">ชื่อ - นามสกุล</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">สาขาวิชา / คณะ</th>
                    <th className="py-3.5 px-4 text-center">GPAX</th>
                    <th className="py-3.5 px-4 text-center">กรรมการที่ส่งผล</th>
                    <th className="py-3.5 px-4 text-right">คะแนนเฉลี่ยรวม</th>
                    <th className="py-3.5 px-4 text-center w-28">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-foreground">
                  {resultsData.items.map((item: ApplicantResultItem) => (
                    <tr
                      key={item.applicantId}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center font-mono font-medium text-muted-foreground">
                        {item.rank}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                        {item.studentCode}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {item.titlePrefix}
                        {item.firstName} {item.lastName}
                      </td>
                      <td className="py-3.5 px-4 hidden md:table-cell text-muted-foreground text-xs">
                        <div className="font-medium text-foreground/80">{item.major}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{item.faculty}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold">
                        {item.gpa.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.submittedCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{item.submittedCount} ท่าน</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border/60">
                            ยังไม่มี
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-base text-foreground">
                          {item.finalScore.display}
                        </span>
                        <span className="text-[11px] text-muted-foreground ml-1">คะแนน</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleViewDetail(item.applicantId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-border hover:bg-muted text-foreground hover:text-primary transition-all shadow-2xs cursor-pointer"
                          title="ดูรายละเอียดคะแนนแยกตามกรรมการ"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ดูคะแนน</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="p-4 border-t border-border/80 flex flex-col sm:flex-row justify-between items-center gap-3 bg-muted/20">
                <span className="text-xs text-muted-foreground">
                  แสดง {resultsData.items.length} จาก {meta.total} รายการ
                </span>
                <Pagination
                  currentPage={meta.page}
                  totalPages={meta.totalPages}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Score Breakdown Modal */}
      <ApplicantScoreDetailModal
        applicantId={selectedApplicantId}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
