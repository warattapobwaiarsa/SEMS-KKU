'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Calendar,
  Layers,
  ArrowRight,
  Search,
  Users,
  CheckCircle2,
  RefreshCw,
  X,
  Sliders,
} from 'lucide-react';
import {
  PageHeader,
  Pagination,
  Button,
  Input,
  Alert,
  EmptyState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui';
import { useDebounce } from '@/lib/use-debounce';
import { ApiError } from '@/lib/api-client';
import { fetchEvaluatorRounds } from '@/services/evaluation.service';
import type { EvaluatorRound, PaginationMeta } from '@/types/evaluation';
import { RoundStageIndicator } from '@/components/rounds/round-stage-indicator';

function EvaluatorRoundsContent() {
  const searchParams = useSearchParams();
  const [rounds, setRounds] = useState<EvaluatorRound[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const loadRounds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchEvaluatorRounds({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch.trim() || undefined,
      });

      setRounds(res.data);
      if (res.meta) {
        setPagination(res.meta);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (
        err instanceof Error &&
        (err.message.includes('fetch') ||
          err.message.includes('network') ||
          err.name === 'TypeError')
      ) {
        setError(
          'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (Failed to fetch) กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง'
        );
      } else {
        setError('เกิดข้อผิดพลาดในการโหลดรายการรอบทุน');
      }
      setRounds([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, pagination.page, pagination.limit]);

  useEffect(() => {
    void Promise.resolve().then(() => loadRounds());
  }, [loadRounds]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      {/* Standard Admin Page Header */}
      <PageHeader
        title="รอบทุนการศึกษาที่เปิดประเมิน"
      />

      {/* Search Bar - Exactly matching Admin Scholarship Rounds */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-3 shadow-xs">
        <div className="relative flex-1 max-w-md w-full">
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อรอบทุน"
          />
          {search && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md transition"
              title="ล้างข้อความค้นหา"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Error Alert with Retry */}
      {error && (
        <Alert
          variant="destructive"
          title="ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
            <p className="text-xs text-destructive/90">{error} (เซิร์ฟเวอร์ Backend อาจกำลังเริ่มต้นระบบ กรุณารอสักครู่แล้วลองใหม่)</p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void loadRounds()}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              className="shrink-0 self-end sm:self-auto"
            >
              ลองใหม่อีกครั้ง
            </Button>
          </div>
        </Alert>
      )}

      {/* Main Table / Data View (Admin Scholarship Rounds Style) */}
      <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs w-full min-h-[460px] flex flex-col justify-between">
        {/* Mobile View: Responsive Cards (< md) */}
        <div className="block md:hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
              <p className="mt-4 text-sm text-muted-foreground animate-pulse">กำลังโหลดรายการรอบทุน...</p>
            </div>
          ) : rounds.length === 0 ? (
            <div className="p-8 text-center">
              <EmptyState
                icon={Calendar}
                title={search ? 'ไม่พบรอบทุนตามเงื่อนไข' : 'ยังไม่มีรอบทุนที่เปิดรับประเมิน'}
                description={
                  search
                    ? `ไม่พบข้อมูลที่ตรงกับ "${search}" กรุณาลองค้นหาด้วยคำอื่น หรือกดล้างการค้นหา`
                    : 'รอบทุนการศึกษาจะต้องเปิดรับการประเมิน (สถานะ OPEN) โดยผู้ดูแลระบบ จึงจะปรากฏในหน้านี้'
                }
              >
                {search && (
                  <Button variant="secondary" onClick={() => handleSearchChange('')}>
                    ล้างการค้นหา
                  </Button>
                )}
              </EmptyState>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {rounds.map((round) => (
                <div key={round.id} className="p-4 space-y-3 hover:bg-muted/10 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-foreground text-sm leading-snug">
                        {round.name}
                      </h4>
                    </div>
                    <div className="shrink-0">
                      <RoundStageIndicator status={round.status} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
                    <div>
                      <span className="block text-[11px] text-muted-foreground/80">ปี/ภาคเรียน</span>
                      <span className="font-mono font-medium text-foreground">{round.academicYear}/{round.semester}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-muted-foreground/80">ผู้สมัคร</span>
                      <span className="font-mono font-bold text-foreground flex items-center gap-1">
                        <Users className="h-3 w-3 text-blue-600" /> {round.applicantCount} คน
                      </span>
                    </div>
                    <div className="col-span-2 border-t border-border/40 pt-1.5 mt-0.5">
                      <span className="block text-[11px] text-muted-foreground/80 mb-0.5">ชุดเกณฑ์ที่ผูก</span>
                      {round.criteriaName ? (
                        <span className="font-medium text-foreground flex items-center gap-1 truncate">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{round.criteriaName}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">เกณฑ์มาตรฐาน</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <Link
                      href={`/evaluator/rounds/${round.id}/applicants`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-primary py-2.5 px-3 rounded-xl bg-primary/10 hover:bg-primary hover:text-primary-foreground transition shadow-2xs"
                    >
                      <Sliders className="h-3.5 w-3.5" />
                      <span>เข้าสู่การประเมินผู้สมัคร</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop View: Full Data Table (>= md) Matching Admin Round Style */}
        <div className="hidden md:block overflow-x-auto flex-1">
          <Table className="table-fixed min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/6">ชื่อรอบทุนการศึกษา</TableHead>
                <TableHead className="w-1/6 text-center">ปี/ภาคเรียน</TableHead>
                <TableHead className="w-1/6">เกณฑ์การประเมิน</TableHead>
                <TableHead className="w-1/6 text-center">ผู้สมัคร</TableHead>
                <TableHead className="w-1/6 text-center">สถานะ</TableHead>
                <TableHead className="w-1/6 text-center">ดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-24 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
                    <p className="mt-4 text-sm text-muted-foreground animate-pulse">กำลังโหลดรายการรอบทุน...</p>
                  </TableCell>
                </TableRow>
              ) : rounds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 px-4 text-center">
                    <div className="max-w-md mx-auto">
                      <EmptyState
                        icon={Calendar}
                        title={search ? 'ไม่พบรอบทุนตามเงื่อนไข' : 'ยังไม่มีรอบทุนที่เปิดรับประเมิน'}
                        description={
                          search
                            ? `ไม่พบข้อมูลที่ตรงกับ "${search}" กรุณาลองค้นหาด้วยคำอื่น หรือกดล้างการค้นหา`
                            : 'รอบทุนการศึกษาจะต้องเปิดรับการประเมิน (สถานะ OPEN) โดยผู้ดูแลระบบ จึงจะปรากฏในหน้านี้'
                        }
                      >
                        {search && (
                          <Button variant="secondary" onClick={() => handleSearchChange('')}>
                            ล้างการค้นหา
                          </Button>
                        )}
                      </EmptyState>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rounds.map((round) => (
                  <TableRow key={round.id} className="group">
                    {/* Name & Type */}
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground group-hover:text-primary transition-colors text-sm">
                            {round.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>รหัสรอบ #{round.id}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Year & Semester */}
                    <TableCell className="text-center">
                      <span className="inline-flex items-center font-mono font-bold px-2.5 py-1 rounded-lg bg-muted text-xs text-foreground border border-border/60">
                        {round.academicYear}/{round.semester}
                      </span>
                    </TableCell>

                    {/* Criteria */}
                    <TableCell>
                      {round.criteriaName ? (
                        <div className="flex flex-col gap-0.5 max-w-full">
                          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 min-w-0">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate block" title={round.criteriaName}>
                              {round.criteriaName}
                            </span>
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          เกณฑ์มาตรฐาน
                        </span>
                      )}
                    </TableCell>

                    {/* Applicant Count */}
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-foreground px-2.5 py-1 rounded-lg bg-muted/60 border border-border/40">
                        <Users className="h-3.5 w-3.5 text-blue-600" />
                        {round.applicantCount} คน
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <RoundStageIndicator status={round.status} />
                      </div>
                    </TableCell>

                    {/* Contextual Action Button */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link href={`/evaluator/rounds/${round.id}/applicants`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-w-[130px] justify-center whitespace-nowrap bg-primary/5 text-primary border-primary/20 hover:bg-primary hover:text-white hover:border-transparent font-medium shrink-0 text-xs px-2.5"
                            rightIcon={<ArrowRight className="h-3 w-3 shrink-0" />}
                            leftIcon={<Sliders className="h-3.5 w-3.5 shrink-0" />}
                          >
                            ประเมินผู้สมัคร
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination matching Admin Rounds */}
        {!loading && pagination.totalPages > 1 && (
          <div className="border-t border-border/60 p-3 bg-muted/10">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={handlePageChange}
              disabled={loading}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function EvaluatorRoundsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12 animate-pulse">
          <div className="h-10 w-64 bg-muted rounded-xl" />
          <div className="h-14 w-full bg-muted/40 rounded-2xl" />
          <div className="h-96 w-full bg-muted/20 rounded-2xl" />
        </div>
      }
    >
      <EvaluatorRoundsContent />
    </Suspense>
  );
}
