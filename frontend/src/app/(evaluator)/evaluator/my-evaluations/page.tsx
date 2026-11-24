'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Eye,
  Edit3,
  Search,
  Layers,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  FileEdit,
  CheckCircle2,
  X,
  Sliders,
  Calendar,
  Users,
  Clock,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { RoundStageIndicator } from '@/components/rounds/round-stage-indicator';
import { useDebounce } from '@/lib/use-debounce';
import {
  fetchEvaluatorRounds,
  fetchEvaluatorApplicants,
} from '@/services/evaluation.service';
import type { EvaluatorRound, EvaluatorApplicant } from '@/types/evaluation';
import { ApiError } from '@/lib/api-client';

export default function MyEvaluationsPage() {
  const [rounds, setRounds] = useState<EvaluatorRound[]>([]);
  const [activeRound, setActiveRound] = useState<EvaluatorRound | null>(null);
  const [applicants, setApplicants] = useState<EvaluatorApplicant[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters for View 1 (Rounds List)
  const [roundSearch, setRoundSearch] = useState('');
  const [roundStatusFilter, setRoundStatusFilter] = useState<string>('ALL');
  const debouncedRoundSearch = useDebounce(roundSearch, 300);

  // Filters for View 2 (Applicants within selected round)
  const [applicantSearch, setApplicantSearch] = useState('');
  const [applicantStatusFilter, setApplicantStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'DRAFT'>('ALL');
  const debouncedApplicantSearch = useDebounce(applicantSearch, 300);

  // 1. โหลดรอบทุนทั้งหมดที่เปิดสำหรับ Evaluator
  const loadRounds = useCallback(async () => {
    setLoadingRounds(true);
    setError(null);
    try {
      const res = await fetchEvaluatorRounds({ limit: 50 });
      setRounds(res.data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อโหลดรายการรอบทุนได้');
      }
    } finally {
      setLoadingRounds(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadRounds());
  }, [loadRounds]);

  // 2. โหลดรายชื่อผู้สมัครของรอบที่เจาะลึกเข้าไปดู
  const loadApplicants = useCallback(async (roundId: number) => {
    setLoadingApplicants(true);
    setError(null);
    try {
      const res = await fetchEvaluatorApplicants(roundId, { limit: 100 });
      setApplicants(res.data);
    } catch (err) {
      console.warn('Failed to load applicants for round:', err);
      setApplicants([]);
    } finally {
      setLoadingApplicants(false);
    }
  }, []);

  const handleSelectRound = (round: EvaluatorRound) => {
    setActiveRound(round);
    setApplicantSearch('');
    setApplicantStatusFilter('ALL');
    void loadApplicants(round.id);
  };

  const handleBackToRounds = () => {
    setActiveRound(null);
    setApplicants([]);
  };

  // Filtered Rounds (View 1)
  const filteredRounds = useMemo(() => {
    return rounds.filter((r) => {
      if (roundStatusFilter !== 'ALL' && r.status !== roundStatusFilter) {
        return false;
      }
      if (debouncedRoundSearch.trim()) {
        const q = debouncedRoundSearch.trim().toLowerCase();
        return r.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [rounds, roundStatusFilter, debouncedRoundSearch]);

  // Evaluated Applicants in active round (View 2)
  const evaluatedApplicants = useMemo(() => {
    return applicants.filter((app) => app.myStatus === 'SUBMITTED' || app.myStatus === 'DRAFT');
  }, [applicants]);

  const applicantStats = useMemo(() => {
    const submittedCount = evaluatedApplicants.filter((a) => a.myStatus === 'SUBMITTED').length;
    const draftCount = evaluatedApplicants.filter((a) => a.myStatus === 'DRAFT').length;
    return {
      submittedCount,
      draftCount,
      totalEvaluated: evaluatedApplicants.length,
    };
  }, [evaluatedApplicants]);

  const filteredApplicants = useMemo(() => {
    return evaluatedApplicants.filter((app) => {
      if (applicantStatusFilter !== 'ALL' && app.myStatus !== applicantStatusFilter) {
        return false;
      }
      if (debouncedApplicantSearch.trim()) {
        const q = debouncedApplicantSearch.trim().toLowerCase();
        const fullName = `${app.titlePrefix}${app.firstName} ${app.lastName}`.toLowerCase();
        const code = app.studentCode.toLowerCase();
        return fullName.includes(q) || code.includes(q);
      }
      return true;
    });
  }, [evaluatedApplicants, applicantStatusFilter, debouncedApplicantSearch]);

  return (
    <div className="flex-1 flex flex-col space-y-6 max-w-7xl mx-auto pb-12 w-full">
      {/* ========================================================================= */}
      {/* VIEW 1: MASTER ROUNDS TABLE (ถอดแบบสไตล์ Admin Evaluation Results 100%)    */}
      {/* ========================================================================= */}
      {!activeRound ? (
        <>
          {/* Header */}
          <PageHeader
            title="ผลการประเมินของฉัน"
          />

          {/* Error Alert */}
          {error && (
            <Alert
              variant="destructive"
              title="เกิดข้อผิดพลาด"
            >
              <p className="mt-0.5">{error}</p>
              <div className="mt-3">
                <Button
                  variant="destructive"
                  size="sm"
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  onClick={() => void loadRounds()}
                >
                  ลองใหม่อีกครั้ง
                </Button>
              </div>
            </Alert>
          )}

          {/* Filter and Search Bar with Segmented Tabs (Admin Style) */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-3 shadow-xs">
            {/* Segmented Status Tabs Matching Admin */}
            <div className="flex items-center gap-1.5 p-1 bg-muted/50 border border-border/80 rounded-2xl overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setRoundStatusFilter('ALL')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  roundStatusFilter === 'ALL'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                <Layers className="h-3.5 w-3.5 shrink-0" />
                <span>ทั้งหมด</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md font-mono text-xs font-bold ${
                    roundStatusFilter === 'ALL'
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {rounds.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRoundStatusFilter('OPEN')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  roundStatusFilter === 'OPEN'
                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>เปิดรับประเมิน</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md font-mono text-xs font-bold ${
                    roundStatusFilter === 'OPEN'
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                  }`}
                >
                  {rounds.filter((r) => r.status === 'OPEN').length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRoundStatusFilter('CLOSED')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  roundStatusFilter === 'CLOSED'
                    ? 'bg-slate-700 text-white shadow-xs ring-2 ring-slate-700/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>ปิดรอบแล้ว</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md font-mono text-xs font-bold ${
                    roundStatusFilter === 'CLOSED'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  {rounds.filter((r) => r.status === 'CLOSED').length}
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md w-full">
              <Input
                value={roundSearch}
                onChange={(e) => setRoundSearch(e.target.value)}
                placeholder="ค้นหาชื่อรอบทุนการศึกษา..."
                leftIcon={<Search className="h-4 w-4" />}
              />
              {roundSearch && (
                <button
                  type="button"
                  onClick={() => setRoundSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md transition cursor-pointer"
                  title="ล้างคำค้นหา"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Main Rounds Data Table (5 Equal 1/5 Columns Matching Admin Rounds) */}
          <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs w-full min-h-[460px] flex flex-col justify-between">
            {loadingRounds ? (
              <div className="p-16 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
                <p className="mt-4 text-sm text-muted-foreground animate-pulse">กำลังโหลดรายการรอบทุน...</p>
              </div>
            ) : filteredRounds.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={Calendar}
                  title={roundSearch ? 'ไม่พบรอบทุนตามเงื่อนไข' : 'ยังไม่มีรอบทุนที่เปิดรับประเมิน'}
                  description={
                    roundSearch
                      ? `ไม่พบข้อมูลที่ตรงกับ "${roundSearch}" กรุณาลองค้นหาด้วยคำอื่น หรือกดล้างการค้นหา`
                      : 'ยังไม่มีรอบทุนการศึกษาที่เปิดให้ประเมินในขณะนี้'
                  }
                >
                  {roundSearch && (
                    <Button variant="secondary" size="sm" onClick={() => setRoundSearch('')}>
                      ล้างการค้นหา
                    </Button>
                  )}
                </EmptyState>
              </div>
            ) : (
              <>
                {/* Mobile View: Responsive Cards (< md) */}
                <div className="block md:hidden divide-y divide-border/60">
                  {filteredRounds.map((round) => (
                    <div key={round.id} className="p-4 space-y-3 hover:bg-muted/10 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-foreground text-base leading-snug">
                            {round.name}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            ปี {round.academicYear}/{round.semester}
                          </span>
                        </div>
                        <RoundStageIndicator status={round.status} />
                      </div>

                      <div className="pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectRound(round)}
                          className="w-full justify-center text-xs"
                          rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                        >
                          ตรวจผลคะแนน
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View: Full Data Table (5 Equal Columns Matching Admin Style) */}
                <div className="hidden md:block overflow-x-auto flex-1">
                  <Table className="table-fixed min-w-[800px] w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/5">ชื่อรอบทุนการศึกษา</TableHead>
                        <TableHead className="w-1/5 text-center">ปี/ภาคเรียน</TableHead>
                        <TableHead className="w-1/5 text-center">ผู้สมัคร</TableHead>
                        <TableHead className="w-1/5 text-center">สถานะรอบทุน</TableHead>
                        <TableHead className="w-1/5 text-center">ดำเนินการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRounds.map((round) => (
                        <TableRow key={round.id} className="group">
                          {/* Round Name */}
                          <TableCell className="font-medium">
                            <span className="font-bold text-foreground group-hover:text-primary transition-colors text-sm block">
                              {round.name}
                            </span>
                            <span className="text-xs text-muted-foreground block mt-0.5">
                              รหัสรอบ #{round.id}
                            </span>
                          </TableCell>

                          {/* Year / Semester */}
                          <TableCell className="text-center">
                            <span className="inline-flex items-center font-mono font-bold px-2.5 py-1 rounded-lg bg-muted text-xs text-foreground border border-border/60">
                              {round.academicYear}/{round.semester}
                            </span>
                          </TableCell>

                          {/* Applicant Count */}
                          <TableCell className="text-center">
                            <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-foreground px-2.5 py-1 rounded-lg bg-muted/60 border border-border/40">
                              <Users className="h-3.5 w-3.5 text-blue-600" />
                              {round.applicantCount} คน
                            </span>
                          </TableCell>

                          {/* Round Status */}
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <RoundStageIndicator status={round.status} />
                            </div>
                          </TableCell>

                          {/* Action Button: Drill-down to Applicants View */}
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectRound(round)}
                                className="min-w-[130px] justify-center whitespace-nowrap bg-primary/5 text-primary border-primary/20 hover:bg-primary hover:text-white hover:border-transparent font-medium shrink-0 text-xs px-2.5"
                                rightIcon={<ArrowRight className="h-3 w-3 shrink-0" />}
                                leftIcon={<Sliders className="h-3.5 w-3.5 shrink-0" />}
                              >
                                ตรวจผลคะแนน
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: DRILL-DOWN APPLICANTS TABLE IN SELECTED ROUND (สไตล์ Admin)      */
        /* ========================================================================= */
        <>
          {/* Header with Back Button */}
          <PageHeader
            title={`ผลการประเมิน: ${activeRound.name}`}
            backHref="#"
            backLabel="กลับสู่รายการรอบทุนการศึกษา"
            action={
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
                onClick={handleBackToRounds}
              >
                กลับหน้ารวมรอบทุน
              </Button>
            }
          />

          {/* Round Context Info Banner */}
          <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground text-sm">{activeRound.name}</h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
                    ปี {activeRound.academicYear}/{activeRound.semester}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ประเมินแล้วทั้งหมด {applicantStats.totalEvaluated} คน (ส่งผลแล้ว {applicantStats.submittedCount} คน, ฉบับร่าง {applicantStats.draftCount} คน)
                </p>
              </div>
            </div>

            <Link
              href={`/evaluator/rounds/${activeRound.id}/applicants`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline self-start sm:self-auto"
            >
              <span>ไปหน้ารายชื่อผู้สมัครทั้งหมด</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Filter & Search Bar with Segmented Tabs */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-3 shadow-xs">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-muted/50 border border-border/80 rounded-2xl overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setApplicantStatusFilter('ALL')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  applicantStatusFilter === 'ALL'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                <Layers className="h-3.5 w-3.5 shrink-0" />
                <span>ทั้งหมด</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md font-mono text-xs font-bold ${
                    applicantStatusFilter === 'ALL'
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {evaluatedApplicants.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setApplicantStatusFilter('SUBMITTED')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  applicantStatusFilter === 'SUBMITTED'
                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>ส่งผลแล้ว</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md font-mono text-xs font-bold ${
                    applicantStatusFilter === 'SUBMITTED'
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                  }`}
                >
                  {applicantStats.submittedCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setApplicantStatusFilter('DRAFT')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  applicantStatusFilter === 'DRAFT'
                    ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-600/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                <FileEdit className="h-3.5 w-3.5 shrink-0" />
                <span>ฉบับร่าง</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md font-mono text-xs font-bold ${
                    applicantStatusFilter === 'DRAFT'
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                  }`}
                >
                  {applicantStats.draftCount}
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md w-full">
              <Input
                value={applicantSearch}
                onChange={(e) => setApplicantSearch(e.target.value)}
                placeholder="ค้นหาชื่อ, รหัสนักศึกษา..."
                leftIcon={<Search className="h-4 w-4" />}
              />
              {applicantSearch && (
                <button
                  type="button"
                  onClick={() => setApplicantSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md transition cursor-pointer"
                  title="ล้างคำค้นหา"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Applicants Symmetrical Table (5 Equal Columns w-1/5) */}
          <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs w-full min-h-[460px] flex flex-col justify-between">
            {loadingApplicants ? (
              <div className="p-16 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
                <p className="mt-4 text-sm text-muted-foreground animate-pulse">กำลังโหลดข้อมูลการประเมิน...</p>
              </div>
            ) : filteredApplicants.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={Calendar}
                  title={applicantSearch || applicantStatusFilter !== 'ALL' ? 'ไม่พบรายการที่ตรงกับเงื่อนไข' : 'ยังไม่มีผลการประเมินในรอบนี้'}
                  description={
                    applicantSearch || applicantStatusFilter !== 'ALL'
                      ? 'กรุณาตรวจสอบคำค้นหาหรือตัวกรองสถานะอีกครั้ง'
                      : 'คุณยังไม่ได้เริ่มให้คะแนนผู้สมัครในรอบนี้ สามารถคลิกเพื่อเริ่มทำการประเมินได้ทันที'
                  }
                >
                  {evaluatedApplicants.length === 0 ? (
                    <Link href={`/evaluator/rounds/${activeRound.id}/applicants`}>
                      <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        เริ่มประเมินผู้สมัครรอบนี้
                      </Button>
                    </Link>
                  ) : applicantSearch ? (
                    <Button variant="secondary" size="sm" onClick={() => setApplicantSearch('')}>
                      ล้างคำค้นหา
                    </Button>
                  ) : null}
                </EmptyState>
              </div>
            ) : (
              <>
                {/* Mobile View */}
                <div className="block md:hidden divide-y divide-border/60">
                  {filteredApplicants.map((app) => {
                    const fullName = `${app.titlePrefix}${app.firstName} ${app.lastName}`.trim();
                    const isSubmitted = app.myStatus === 'SUBMITTED';

                    return (
                      <div key={app.id} className="p-4 space-y-3 hover:bg-muted/10 transition">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-xs font-mono font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                              {app.studentCode}
                            </span>
                            <h4 className="mt-1 font-bold text-foreground text-base">
                              {fullName}
                            </h4>
                          </div>
                          <StatusBadge
                            label={isSubmitted ? 'ส่งผลแล้ว' : 'ฉบับร่าง'}
                            variant={isSubmitted ? 'success' : 'draft'}
                          />
                        </div>

                        <div className="pt-1">
                          <Link href={`/evaluator/rounds/${activeRound.id}/applicants/${app.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-center text-xs"
                              leftIcon={isSubmitted ? <Eye className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
                            >
                              {isSubmitted ? 'ดูผลคะแนน' : 'ประเมินต่อ'}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View: 5 Equal Columns */}
                <div className="hidden md:block overflow-x-auto flex-1">
                  <Table className="table-fixed min-w-[800px] w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/5 text-center">ลำดับ</TableHead>
                        <TableHead className="w-1/5 text-center">รหัสนักศึกษา</TableHead>
                        <TableHead className="w-1/5">ชื่อ - นามสกุล</TableHead>
                        <TableHead className="w-1/5 text-center">สถานะของฉัน</TableHead>
                        <TableHead className="w-1/5 text-center">ดำเนินการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplicants.map((app, idx) => {
                        const fullName = `${app.titlePrefix}${app.firstName} ${app.lastName}`.trim();
                        const isSubmitted = app.myStatus === 'SUBMITTED';

                        return (
                          <TableRow key={app.id} className="group">
                            <TableCell className="text-center font-mono text-xs text-muted-foreground">
                              {String(idx + 1).padStart(2, '0')}
                            </TableCell>
                            <TableCell className="text-center font-mono font-semibold text-foreground text-xs">
                              {app.studentCode}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              {fullName}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <StatusBadge
                                  label={isSubmitted ? 'ส่งผลแล้ว' : 'ฉบับร่าง'}
                                  variant={isSubmitted ? 'success' : 'draft'}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center">
                                <Link href={`/evaluator/rounds/${activeRound.id}/applicants/${app.id}`}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={`min-w-[110px] justify-center whitespace-nowrap text-xs px-2.5 font-medium ${
                                      isSubmitted
                                        ? 'bg-muted/60 text-foreground border-border/60 hover:bg-muted'
                                        : 'bg-primary/5 text-primary border-primary/20 hover:bg-primary hover:text-white'
                                    }`}
                                    leftIcon={
                                      isSubmitted ? (
                                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                      ) : (
                                        <Edit3 className="h-3.5 w-3.5" />
                                      )
                                    }
                                  >
                                    {isSubmitted ? 'ดูผล' : 'ประเมินต่อ'}
                                  </Button>
                                </Link>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
