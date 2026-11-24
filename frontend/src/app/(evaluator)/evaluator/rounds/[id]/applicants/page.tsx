/**
 * หน้ารายชื่อผู้สมัครสำหรับ Evaluator
 * Route: /evaluator/rounds/[id]/applicants
 * ใช้ข้อมูลจาก API: GET /scholarship-rounds/:roundId/applicants
 * Header: X-User-Id (mock auth, TEMPORARY จนกว่าจะมี KKU SSO [FR-AUTH-01])
 * [FR-EVL-01] [BR-EVL-01] [FR-EVL-03] [BR-SCR-01] [FR-APP-04]
 */
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useDebounce } from '@/lib/use-debounce';
import { apiClient, ApiError } from '@/lib/api-client';
import { getEvaluatorId } from '@/lib/mock-evaluator';
import { fetchRoundById } from '@/services/rounds.service';
import type { ScholarshipRoundDetail } from '@/types/rounds';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Pagination } from '@/components/ui/pagination';
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
import type { PaginationMeta } from '@/types/evaluation';
import {
  Search,
  Play,
  Eye,
  Edit3,
  RefreshCw,
  Sparkles,
  Layers,
  Clock,
  FileEdit,
  CheckCircle2,
  X,
  Sliders,
  ArrowRight,
} from 'lucide-react';

// ---------- Types ----------
interface ApplicantRow {
  id: number;
  roundId: number;
  legacySeq: number | null;
  studentCode: string;
  titlePrefix: string;
  firstName: string;
  lastName: string;
  faculty: string;
  major: string;
  studyYear: number;
  gpa: number;
  submittedCount: number;
  myStatus: 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED';
  canStart: boolean;
}

interface ApplicantsResponse {
  data: ApplicantRow[];
  meta: PaginationMeta;
}

// ---------- Component ----------
export default function EvaluatorApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const searchParams = useSearchParams();
  const [roundId, setRoundId] = useState<number>(0);
  const [roundDetail, setRoundDetail] = useState<ScholarshipRoundDetail | null>(null);
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED'>('ALL');
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search 400ms [FR-EVL-03]
  const debouncedSearch = useDebounce(search, 400);

  // Unpack params and load round detail
  useEffect(() => {
    params.then(async (p) => {
      const id = parseInt(p.id, 10);
      setRoundId(id);
      try {
        const res = await fetchRoundById(id);
        setRoundDetail(res.data);
      } catch (err) {
        console.warn('Failed to load round details:', err);
      }
    });
  }, [params]);

  // ดึงข้อมูลผู้สมัคร
  const fetchApplicants = useCallback(async () => {
    if (!roundId) return;
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams();
      if (debouncedSearch.trim()) query.set('search', debouncedSearch.trim());
      query.set('page', String(pagination.page));
      query.set('limit', String(pagination.limit));

      const res = await apiClient<ApplicantsResponse>(
        `/scholarship-rounds/${roundId}/applicants?${query.toString()}`,
        {
          method: 'GET',
          headers: {
            'X-User-Id': getEvaluatorId(),
          },
        }
      );

      setApplicants(res.data || []);
      setPagination(res.meta);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 404) {
          setError('ไม่พบรอบทุนนี้หรือรอบนี้ยังไม่เปิดรับการประเมิน');
        } else {
          setError(err.message);
        }
      } else if (
        err instanceof Error &&
        (err.message.includes('fetch') ||
          err.message.includes('network') ||
          err.name === 'TypeError')
      ) {
        setError(
          'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ Failed to fetch (เซิร์ฟเวอร์ Backend อาจกำลังเริ่มต้นระบบ กรุณารอสักครู่แล้วลองใหม่)',
        );
      } else {
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้สมัคร');
      }
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  }, [roundId, debouncedSearch, pagination.page, pagination.limit]);

  // เรียก fetch เมื่อ debouncedSearch, page, limit เปลี่ยน
  useEffect(() => {
    void Promise.resolve().then(() => fetchApplicants());
  }, [fetchApplicants]);

  // กรองตาม status tab
  const displayedApplicants = useMemo(() => {
    if (statusFilter === 'ALL') return applicants;
    return applicants.filter((a) => a.myStatus === statusFilter);
  }, [applicants, statusFilter]);

  // สถิติการประเมิน
  const stats = useMemo(() => {
    const total = applicants.length;
    const submitted = applicants.filter((a) => a.myStatus === 'SUBMITTED').length;
    const draft = applicants.filter((a) => a.myStatus === 'DRAFT').length;
    const notStarted = applicants.filter((a) => a.myStatus === 'NOT_STARTED').length;
    const percent = total > 0 ? Math.round((submitted / total) * 100) : 0;
    return { total, submitted, draft, notStarted, percent };
  }, [applicants]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (pagination.page !== 1) {
      setPagination((prev: PaginationMeta) => ({ ...prev, page: 1 }));
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev: PaginationMeta) => ({ ...prev, page }));
  };

  const getStatusBadge = (status: ApplicantRow['myStatus']) => {
    switch (status) {
      case 'NOT_STARTED':
        return { label: 'ยังไม่ประเมิน', variant: 'neutral' as const };
      case 'DRAFT':
        return { label: 'ฉบับร่าง', variant: 'draft' as const };
      case 'SUBMITTED':
        return { label: 'ส่งผลแล้ว', variant: 'success' as const };
    }
  };

  const getActionButton = (row: ApplicantRow) => {
    const status = row.myStatus;
    const canStart = row.canStart;
    const applicantLink = `/evaluator/rounds/${roundId}/applicants/${row.id}`;

    if (status === 'SUBMITTED') {
      return (
        <Link href={applicantLink}>
          <Button
            variant="outline"
            size="sm"
            className="min-w-[110px] justify-center whitespace-nowrap bg-muted/60 text-foreground border-border/60 hover:bg-muted font-medium text-xs px-2.5"
            leftIcon={<Eye className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          >
            ดูผล
          </Button>
        </Link>
      );
    }

    if (status === 'DRAFT') {
      return (
        <Link href={applicantLink}>
          <Button
            variant="outline"
            size="sm"
            className="min-w-[110px] justify-center whitespace-nowrap bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100 font-medium text-xs px-2.5"
            leftIcon={<Edit3 className="h-3.5 w-3.5 shrink-0" />}
          >
            ประเมินต่อ
          </Button>
        </Link>
      );
    }

    // NOT_STARTED
    if (!canStart) {
      return (
        <div className="relative group inline-block">
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="min-w-[110px] justify-center text-muted-foreground/40 bg-muted/20 border border-border/40 cursor-not-allowed text-xs px-2.5"
          >
            เริ่มประเมิน
          </Button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-52 p-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg z-20 text-center leading-relaxed">
            บัญชีหมดอายุ ไม่สามารถเริ่มประเมินรายใหม่ได้
          </div>
        </div>
      );
    }

    return (
      <Link href={applicantLink}>
        <Button
          variant="outline"
          size="sm"
          className="min-w-[110px] justify-center whitespace-nowrap bg-primary/5 text-primary border-primary/20 hover:bg-primary hover:text-white hover:border-transparent font-medium text-xs px-2.5"
          leftIcon={<Sliders className="h-3.5 w-3.5 shrink-0" />}
          rightIcon={<ArrowRight className="h-3 w-3 shrink-0" />}
        >
          เริ่มประเมิน
        </Button>
      </Link>
    );
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 max-w-7xl mx-auto pb-12 w-full">
      {/* Page Header */}
      <PageHeader
        title={roundDetail?.name || `รอบการประเมินที่ #${roundId}`}
        backHref="/evaluator/rounds"
        backLabel="กลับหน้ารอบทุนที่เปิดประเมิน"
      />

      {/* Error Banner with Retry */}
      {error && (
        <Alert
          variant="destructive"
          title="เกิดข้อผิดพลาดในการโหลดข้อมูลผู้สมัคร"
        >
          <p className="mt-0.5">{error}</p>
          <div className="mt-3">
            <Button
              variant="destructive"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() => void fetchApplicants()}
            >
              ลองใหม่อีกครั้ง
            </Button>
          </div>
        </Alert>
      )}

      {/* Filter and Search Bar with Segmented Tabs (Admin Scholarship Rounds Style) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-3 shadow-xs">
        {/* Segmented Status Tabs Matching Admin Rounds */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/50 border border-border/80 rounded-2xl overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
            }`}
          >
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span>ทั้งหมด</span>
            <span
              className={`px-1.5 py-0.5 rounded-md font-mono text-xs font-bold ${
                statusFilter === 'ALL'
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {applicants.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('NOT_STARTED')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              statusFilter === 'NOT_STARTED'
                ? 'bg-slate-700 text-white shadow-xs ring-2 ring-slate-700/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
            }`}
          >
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>ยังไม่ประเมิน</span>
            <span
              className={`px-1.5 py-0.5 rounded-md font-mono text-xs font-bold ${
                statusFilter === 'NOT_STARTED'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              {stats.notStarted}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('DRAFT')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              statusFilter === 'DRAFT'
                ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-600/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
            }`}
          >
            <FileEdit className="h-3.5 w-3.5 shrink-0" />
            <span>ฉบับร่าง</span>
            <span
              className={`px-1.5 py-0.5 rounded-md font-mono text-xs font-bold ${
                statusFilter === 'DRAFT'
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
              }`}
            >
              {stats.draft}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('SUBMITTED')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              statusFilter === 'SUBMITTED'
                ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>ส่งผลแล้ว</span>
            <span
              className={`px-1.5 py-0.5 rounded-md font-mono text-xs font-bold ${
                statusFilter === 'SUBMITTED'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
              }`}
            >
              {stats.submitted}
            </span>
          </button>
        </div>

        {/* Search input with clear button */}
        <div className="relative flex-1 max-w-md w-full">
          <Input
            placeholder="ค้นหาชื่อ หรือรหัสนักศึกษา..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
          {search && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md transition cursor-pointer"
              title="ล้างการค้นหา"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content (Table + Mobile Cards) */}
      <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs w-full min-h-[460px] flex flex-col justify-between">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
            <p className="mt-4 text-sm text-muted-foreground animate-pulse">กำลังโหลดรายชื่อผู้สมัคร...</p>
          </div>
        ) : displayedApplicants.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={debouncedSearch ? 'ไม่พบผู้สมัครที่ตรงกับคำค้นหา' : 'ไม่พบรายการผู้สมัคร'}
              description={
                debouncedSearch
                  ? `ไม่พบข้อมูลที่ตรงกับ "${debouncedSearch}" กรุณาตรวจสอบรหัสนักศึกษาหรือชื่อ-สกุลอีกครั้ง`
                  : statusFilter !== 'ALL'
                  ? 'ไม่มีผู้สมัครที่ตรงกับแท็บสถานะที่เลือก'
                  : 'รอบทุนนี้ยังไม่มีผู้สมัครที่เปิดให้ประเมิน'
              }
            >
              {debouncedSearch && (
                <Button variant="secondary" onClick={() => setSearch('')}>
                  ล้างการค้นหา
                </Button>
              )}
            </EmptyState>
          </div>
        ) : (
          <>
            {/* Mobile View: Responsive Cards (< md) */}
            <div className="block md:hidden divide-y divide-border/60">
              {displayedApplicants.map((row, idx) => {
                const statusBadge = getStatusBadge(row.myStatus);
                return (
                  <div key={row.id} className="p-4 space-y-3 hover:bg-muted/10 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-mono font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                          #{String((pagination.page - 1) * pagination.limit + idx + 1).padStart(2, '0')} • {row.studentCode}
                        </span>
                        <h4 className="mt-1 font-bold text-foreground text-base">
                          {`${row.titlePrefix}${row.firstName} ${row.lastName}`}
                        </h4>
                      </div>
                      <StatusBadge label={statusBadge.label} variant={statusBadge.variant} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
                      <div>
                        <span className="block text-xs text-muted-foreground">ผู้ประเมินที่ส่งผลแล้ว</span>
                        <span className="font-mono font-semibold text-foreground">
                          {row.submittedCount > 0 ? `${row.submittedCount} คน` : '0 คน'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1">{getActionButton(row)}</div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Full Data Table (>= md) Matching Admin Round table-fixed and 5 equal 1/5 width columns */}
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
                  {displayedApplicants.map((row, idx) => {
                    const statusBadge = getStatusBadge(row.myStatus);
                    return (
                      <TableRow key={row.id} className="group">
                        <TableCell className="text-center font-mono text-xs text-muted-foreground">
                          {String((pagination.page - 1) * pagination.limit + idx + 1).padStart(2, '0')}
                        </TableCell>
                        <TableCell className="text-center font-mono font-semibold text-foreground text-xs">
                          {row.studentCode}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {`${row.titlePrefix}${row.firstName} ${row.lastName}`}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <StatusBadge label={statusBadge.label} variant={statusBadge.variant} />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            {getActionButton(row)}
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

        {/* Pagination */}
        {!loading && applicants.length > 0 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={handlePageChange}
            disabled={loading}
          />
        )}
      </div>

      {/* Helpful Guidelines */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 border border-border/50 rounded-xl p-3">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <span>
          <strong>คำแนะนำ:</strong> กรรมการสามารถให้คะแนนและบันทึกร่างไว้ได้ตลอดเวลา โดยระบบจะเปิดให้แก้ไขได้จนกว่าจะกดยืนยัน <em>&quot;ส่งผลการประเมิน&quot;</em>
        </span>
      </div>
    </div>
  );
}