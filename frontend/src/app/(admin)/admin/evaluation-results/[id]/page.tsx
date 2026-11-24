'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  Search,
  CheckCircle2,
  Users,
  Eye,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Medal,
  X,
  RefreshCw,
  Sliders,
  Layers,
} from 'lucide-react';
import { fetchRoundById } from '@/services/rounds.service';
import { fetchRoundEvaluationResults } from '@/services/evaluation-results.service';
import type { ScholarshipRoundDetail } from '@/types/rounds';
import type {
  RoundEvaluationResultsData,
  ApplicantResultItem,
} from '@/types/evaluation-results';
import {
  StatusBadge,
  Pagination,
  Button,
  Input,
  EmptyState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Card,
} from '@/components/ui';
import { ApplicantScoreDetailModal } from '@/components/evaluation-results/applicant-score-detail-modal';
import { RoundStageIndicator } from '@/components/rounds/round-stage-indicator';
import { useDebounce } from '@/lib/use-debounce';

export default function RoundEvaluationResultsDetailPage() {
  const params = useParams();
  const roundId = Number(params?.id);

  const [round, setRound] = useState<ScholarshipRoundDetail | null>(null);
  const [resultsData, setResultsData] = useState<RoundEvaluationResultsData | null>(null);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [loadingRound, setLoadingRound] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING'>('ALL');
  const [page, setPage] = useState(1);
  const limit = 15;

  // Modal detail state
  const [selectedApplicantId, setSelectedApplicantId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Load All Round Data (Resilient with Promise.allSettled)
  const loadData = useCallback(async () => {
    if (!roundId || isNaN(roundId)) return;
    try {
      setLoading(true);
      setError(null);
      const [roundRes, resultsRes] = await Promise.allSettled([
        fetchRoundById(roundId),
        fetchRoundEvaluationResults(roundId, {
          page,
          limit,
          search: debouncedSearch.trim() || undefined,
        }),
      ]);

      if (roundRes.status === 'fulfilled' && roundRes.value?.data) {
        setRound(roundRes.value.data);
      }

      if (resultsRes.status === 'fulfilled' && resultsRes.value?.data) {
        setResultsData(resultsRes.value.data);
        if (resultsRes.value.meta) {
          setMeta(resultsRes.value.meta);
        }
      } else if (resultsRes.status === 'rejected') {
        const err = resultsRes.reason;
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดผลการประเมิน');
        setResultsData(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดผลการประเมิน');
      setResultsData(null);
    } finally {
      setLoading(false);
      setLoadingRound(false);
    }
  }, [roundId, page, debouncedSearch]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setPage(1);
  };

  const handleViewDetail = (applicantId: number) => {
    setSelectedApplicantId(applicantId);
    setModalOpen(true);
  };

  // Filter items by status tab (ALL / COMPLETED / PENDING)
  const displayItems = useMemo(() => {
    if (!resultsData?.items) return [];
    if (statusFilter === 'COMPLETED') {
      return resultsData.items.filter((item) => item.submittedCount > 0);
    }
    if (statusFilter === 'PENDING') {
      return resultsData.items.filter((item) => item.submittedCount === 0);
    }
    return resultsData.items;
  }, [resultsData, statusFilter]);

  if (!roundId || isNaN(roundId)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 max-w-xl mx-auto text-center">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-bold text-foreground">ไม่พบรหัสรอบทุนการศึกษา</h2>
        <p className="text-sm text-muted-foreground">กรุณาเลือกรอบทุนการศึกษาจากตารางในหน้าแรก</p>
        <Link href="/admin/evaluation-results">
          <Button variant="primary">กลับสู่ตารางรอบทุน</Button>
        </Link>
      </div>
    );
  }

  const roundName = round?.name || resultsData?.round?.name || `รอบทุน #${roundId}`;
  const academicYear = round?.academicYear || resultsData?.round?.academicYear;
  const semester = round?.semester || resultsData?.round?.semester;
  const status = round?.status || resultsData?.round?.status || 'OPEN';

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      {/* 1. Top Navigation Bar (Consistent with Round Detail Page) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-5">
        <Link
          href="/admin/evaluation-results"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition hover:-translate-x-0.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>กลับสู่หน้ารายการผลการประเมิน</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/admin/scholarship-allocation">
            <Button
              type="button"
              size="sm"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              ไปหน้าจัดสรรทุน
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Error Notification Banner */}
      {error && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50/90 p-4 text-sm text-rose-900 flex items-start gap-3 shadow-xs dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1">
            <h4 className="font-bold">เกิดข้อผิดพลาดในการโหลดผลการประเมิน</h4>
            <p className="mt-0.5 font-medium">{error}</p>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => void loadData()}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            ลองใหม่อีกครั้ง
          </Button>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700 p-1 rounded-md cursor-pointer"
            title="ปิดการแจ้งเตือน"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 3. Hero Card: ข้อมูลทั่วไปของรอบทุนการศึกษา (Consistent with scholarship-rounds/[id]) */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            ข้อมูลทั่วไปของรอบทุนการศึกษา
          </h3>
          <div className="flex items-center gap-2">
            {status === 'OPEN' ? (
              <StatusBadge variant="open" label="เปิดรับประเมิน" />
            ) : status === 'CLOSED' ? (
              <StatusBadge variant="closed" label="ปิดรอบแล้ว" />
            ) : (
              <StatusBadge variant="draft" label="แบบร่าง" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium block">ชื่อรอบทุน</span>
            <span className="font-bold text-foreground text-sm mt-1 block">{roundName}</span>
          </div>
          <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium block">ปีการศึกษา / ภาคเรียน</span>
            <span className="font-bold text-foreground text-sm mt-1 block">
              ปีการศึกษา {academicYear || '-'} (ภาคเรียนที่ {semester || '-'})
            </span>
          </div>
          <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium block">ประเภททุนการศึกษา</span>
            <span className="font-bold text-foreground text-sm mt-1 block">
              {round?.scholarshipType?.name || 'ทุนการศึกษาทั่วไป'}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium block">ชุดเกณฑ์การประเมินที่ใช้</span>
            <span className="font-bold text-foreground text-sm mt-1 block">
              {round?.criteria?.name || resultsData?.round?.criteria?.name || 'เกณฑ์มาตรฐาน (100 คะแนน)'}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium block">จำนวนผู้สมัครในรอบ</span>
            <span className="font-bold font-mono text-foreground text-sm mt-1 block">
              {resultsData?.summary?.totalApplicants ?? round?.applicantCount ?? 0} คน
            </span>
          </div>
          <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium block">สถานะกระบวนการ</span>
            <div className="mt-1">
              <RoundStageIndicator status={status} />
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-border/60">
          <Link href={`/admin/scholarship-rounds/${roundId}`}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Sliders className="h-3.5 w-3.5 text-muted-foreground" />}
            >
              จัดการรอบทุนนี้
            </Button>
          </Link>
          <Link href={`/admin/applicants/${roundId}`}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Users className="h-3.5 w-3.5" />}
            >
              รายชื่อผู้สมัคร
            </Button>
          </Link>
        </div>
      </Card>

      {/* Draft Status Notice Banner */}
      {status === 'DRAFT' && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 dark:bg-amber-950/20 dark:border-amber-900/40 p-4 text-sm text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <h4 className="font-bold">รอบทุนนี้ยังอยู่ในสถานะแบบร่าง (Draft)</h4>
              <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
                ยังไม่ได้เปิดให้กรรมการทำการประเมิน จึงยังไม่มีคะแนนหรือการจัดอันดับจริง
              </p>
            </div>
          </div>
          <Link href={`/admin/scholarship-rounds/${roundId}`}>
            <Button
              type="button"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 self-start sm:self-auto"
            >
              ไปเปิดรอบการประเมิน
            </Button>
          </Link>
        </div>
      )}

      {/* 4. Filter and Search Bar with Segmented Status Tabs (SEMS Style) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-3 shadow-xs">
        {/* Segmented Status Tabs */}
        <div className="flex items-center p-1 bg-muted/60 rounded-xl gap-1 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setStatusFilter('ALL');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-card text-primary shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            ทั้งหมด ({resultsData?.summary?.totalApplicants ?? 0})
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('COMPLETED');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              statusFilter === 'COMPLETED'
                ? 'bg-card text-emerald-600 shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            ประเมินแล้ว ({resultsData?.summary?.evaluatedApplicants ?? 0})
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('PENDING');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              statusFilter === 'PENDING'
                ? 'bg-card text-amber-600 shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            รอประเมิน ({resultsData?.summary?.pendingApplicants ?? 0})
          </button>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-1 max-w-md">
          <div className="relative w-full">
            <Input
              leftIcon={<Search className="h-4 w-4" />}
              type="text"
              placeholder="ค้นหารหัสนักศึกษา หรือชื่อ-นามสกุล..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                title="ล้างข้อความค้นหา"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {(searchTerm || statusFilter !== 'ALL') && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleClearFilters}
              leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
              className="shrink-0"
            >
              ล้างตัวกรอง
            </Button>
          )}
        </div>
      </div>

      {/* 5. Active Filter Chips */}
      {(searchTerm || statusFilter !== 'ALL') && (
        <div className="flex items-center gap-2 flex-wrap px-1 text-xs">
          <span className="text-muted-foreground font-medium">ตัวกรองที่เลือก:</span>
          {statusFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
              <span>สถานะ: {statusFilter === 'COMPLETED' ? 'ประเมินเสร็จแล้ว' : 'รอการประเมิน'}</span>
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className="hover:text-destructive transition p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {searchTerm && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
              <span>ค้นหา: &ldquo;{searchTerm}&rdquo;</span>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="hover:text-destructive transition p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-muted-foreground hover:text-destructive transition underline ml-1 cursor-pointer"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      )}

      {/* 6. Main Rankings Table / Data View (Consistent with SEMS Design) */}
      <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs w-full min-h-[460px] flex flex-col justify-between">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
            <p className="mt-4 text-sm text-muted-foreground animate-pulse">กำลังคำนวณคะแนนเฉลี่ยและจัดอันดับ...</p>
          </div>
        ) : displayItems.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              icon={Award}
              title="ไม่พบข้อมูลผลการประเมิน"
              description={
                searchTerm || statusFilter !== 'ALL'
                  ? 'ไม่พบข้อมูลที่ตรงกับตัวกรองปัจจุบัน กรุณาลองค้นหาด้วยคำอื่น หรือกดล้างตัวกรอง'
                  : 'ยังไม่มีผลการประเมิน หรือยังไม่มีผู้สมัครในรอบนี้'
              }
              actionLabel={searchTerm || statusFilter !== 'ALL' ? 'ล้างตัวกรองทั้งหมด' : undefined}
              onAction={handleClearFilters}
            />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto flex-1">
              <Table className="table-fixed min-w-[980px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20 text-center">อันดับ</TableHead>
                    <TableHead className="w-36">รหัสนักศึกษา</TableHead>
                    <TableHead className="w-1/4">ชื่อ - นามสกุล</TableHead>
                    <TableHead className="w-1/4">สาขาวิชา / คณะ</TableHead>
                    <TableHead className="w-24 text-center">GPAX</TableHead>
                    <TableHead className="w-36 text-center">กรรมการที่ส่งผล</TableHead>
                    <TableHead className="w-36 text-right">คะแนนเฉลี่ยรวม</TableHead>
                    <TableHead className="w-32 text-center">ดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayItems.map((item: ApplicantResultItem) => (
                    <TableRow
                      key={item.applicantId}
                      className={`group ${
                        item.rank === 1
                          ? 'bg-amber-500/10 font-medium'
                          : item.rank === 2
                          ? 'bg-slate-500/5'
                          : item.rank === 3
                          ? 'bg-amber-900/5'
                          : ''
                      }`}
                    >
                      {/* Rank Column with Podium Medals */}
                      <TableCell className="text-center font-mono font-medium">
                        {item.rank === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold font-mono text-xs shadow-2xs ring-2 ring-amber-500/20">
                            <Medal className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                            <span>1</span>
                          </span>
                        ) : item.rank === 2 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-bold font-mono text-xs shadow-2xs">
                            <Medal className="w-3.5 h-3.5 text-slate-400 fill-slate-400 shrink-0" />
                            <span>2</span>
                          </span>
                        ) : item.rank === 3 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-900/15 text-amber-800 dark:text-amber-400 border border-amber-800/30 font-bold font-mono text-xs shadow-2xs">
                            <Medal className="w-3.5 h-3.5 text-amber-700 fill-amber-700 shrink-0" />
                            <span>3</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-mono text-xs">{item.rank}</span>
                        )}
                      </TableCell>

                      {/* Student Code */}
                      <TableCell className="font-mono font-bold text-foreground">
                        {item.studentCode}
                      </TableCell>

                      {/* Student Name */}
                      <TableCell className="font-bold text-foreground group-hover:text-primary transition-colors text-sm">
                        {item.titlePrefix}{item.firstName} {item.lastName}
                      </TableCell>

                      {/* Major / Faculty */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-foreground text-xs">{item.major}</span>
                          <span className="text-xs text-muted-foreground">{item.faculty}</span>
                        </div>
                      </TableCell>

                      {/* GPAX */}
                      <TableCell className="text-center">
                        <span className="inline-flex items-center font-mono font-bold px-2.5 py-1 rounded-lg bg-muted text-xs text-foreground border border-border/60">
                          {item.gpa.toFixed(2)}
                        </span>
                      </TableCell>

                      {/* Committee Status */}
                      <TableCell className="text-center">
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
                      </TableCell>

                      {/* Score Gauge */}
                      <TableCell className="text-right">
                        <div>
                          <span
                            className={`font-mono font-bold text-base ${
                              item.finalScore.average >= 80
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : item.finalScore.average >= 60
                                ? 'text-primary'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {item.finalScore.display}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            / {resultsData?.round?.criteria?.targetScore || 100}
                          </span>
                        </div>
                        <div className="w-20 ml-auto h-1.5 bg-muted rounded-full overflow-hidden mt-1 flex">
                          <div
                            style={{
                              width: `${Math.min(
                                (item.finalScore.average / (resultsData?.round?.criteria?.targetScore || 100)) * 100,
                                100,
                              )}%`,
                            }}
                            className={`h-full rounded-full transition-all ${
                              item.finalScore.average >= 80
                                ? 'bg-emerald-500'
                                : item.finalScore.average >= 60
                                ? 'bg-primary'
                                : 'bg-amber-500'
                            }`}
                          />
                        </div>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="min-w-[100px] justify-center whitespace-nowrap bg-primary/5 text-primary border-primary/20 hover:bg-primary hover:text-white hover:border-transparent font-medium shrink-0 text-xs px-2.5"
                          onClick={() => handleViewDetail(item.applicantId)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          ดูคะแนน
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Responsive Cards View (block md:hidden) */}
            <div className="block md:hidden divide-y divide-border/60 p-2">
              {displayItems.map((item: ApplicantResultItem) => (
                <div key={item.applicantId} className="p-4 space-y-3 hover:bg-muted/10 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-muted border">
                        #{item.rank}
                      </span>
                      <div>
                        <div className="font-mono font-bold text-foreground text-xs">{item.studentCode}</div>
                        <div className="font-semibold text-foreground text-sm">
                          {item.titlePrefix}{item.firstName} {item.lastName}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-base text-primary">
                        {item.finalScore.display}
                      </div>
                      <span className="text-[10px] text-muted-foreground block font-mono">GPAX {item.gpa.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>{item.faculty}</span>
                    <span>กรรมการส่งผล: {item.submittedCount} ท่าน</span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleViewDetail(item.applicantId)}
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                  >
                    ดูรายละเอียดคะแนน
                  </Button>
                </div>
              ))}
            </div>

            {/* Pagination Footer */}
            {meta.totalPages > 1 && (
              <div className="p-4 border-t border-border/80 flex flex-col sm:flex-row justify-between items-center gap-3 bg-muted/20">
                <span className="text-xs text-muted-foreground">
                  แสดง {displayItems.length} จาก {meta.total} รายการ
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

      {/* 7. Score Breakdown Modal */}
      <ApplicantScoreDetailModal
        applicantId={selectedApplicantId}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
