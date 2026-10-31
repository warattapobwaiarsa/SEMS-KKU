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
import type { PaginationMeta } from '@/types/evaluation';
import {
  Search,
  Users,
  CheckCircle2,
  Clock,
  Play,
  Eye,
  Edit3,
  AlertCircle,
  RefreshCw,
  Award,
  Sparkles,
  Inbox,
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
    void fetchApplicants();
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
        <Link
          href={applicantLink}
          className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-muted hover:bg-muted/80 text-foreground transition shadow-2xs"
        >
          <Eye className="w-3.5 h-3.5" />
          ดูผล
        </Link>
      );
    }

    if (status === 'DRAFT') {
      return (
        <Link
          href={applicantLink}
          className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 transition shadow-2xs"
        >
          <Edit3 className="w-3.5 h-3.5" />
          ประเมินต่อ
        </Link>
      );
    }

    // NOT_STARTED
    if (!canStart) {
      return (
        <div className="relative group">
          <button
            disabled
            className="w-full sm:w-auto px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-muted text-muted-foreground/60 border border-dashed border-border cursor-not-allowed"
          >
            เริ่มประเมิน
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-52 p-2 bg-slate-900 text-white text-[11px] rounded-lg shadow-lg z-20 text-center leading-relaxed">
            บัญชีหมดอายุ ไม่สามารถเริ่มประเมินรายใหม่ได้
          </div>
        </div>
      );
    }

    return (
      <Link
        href={applicantLink}
        className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-1.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-2xs"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        เริ่มประเมิน
      </Link>
    );
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 max-w-7xl mx-auto pb-12 w-full">
      {/* Page Header */}
      <PageHeader
        moduleBadge="ระบบประเมินทุนการศึกษา"
        moduleBadgeIcon={Award}
        title={roundDetail?.name || `รอบการประเมินที่ #${roundId}`}
        description={
          roundDetail
            ? `ปีการศึกษา ${roundDetail.academicYear} ภาคเรียนที่ ${roundDetail.semester} • ชุดเกณฑ์: ${roundDetail.criteriaName || 'เกณฑ์มาตรฐาน'}`
            : `เลือกลำดับผู้สมัครเพื่อเข้าสู่หน้าจอประเมินคะแนนแบบแบ่งจอ (Split-Screen)`
        }
        backHref="/evaluator/rounds"
        backLabel="กลับหน้ารอบทุนที่เปิดประเมิน"
      />

      {/* Progress & KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">ผู้สมัครในรอบนี้</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {pagination.total} <span className="text-xs font-normal text-muted-foreground">คน</span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1">ทั้งหมดที่เปิดให้ประเมิน</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-medium">ส่งผลการประเมินแล้ว</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            {stats.submitted} <span className="text-xs font-normal text-muted-foreground">คน</span>
          </div>
          <div className="w-full bg-emerald-100/60 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-medium">บันทึกร่างไว้</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700">
            {stats.draft} <span className="text-xs font-normal text-muted-foreground">คน</span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1">กำลังดำเนินการอยู่</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">ยังไม่เริ่มประเมิน</span>
            <Sparkles className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {stats.notStarted} <span className="text-xs font-normal text-muted-foreground">คน</span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1">รอการตรวจและให้คะแนน</span>
        </div>
      </div>

      {/* Error Banner with Retry */}
      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => void fetchApplicants()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-destructive text-destructive-foreground rounded-xl hover:bg-destructive/90 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            ลองใหม่
          </button>
        </div>
      )}

      {/* Search & Status Filter Tabs Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-3 shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            ทั้งหมด ({applicants.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('NOT_STARTED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer whitespace-nowrap ${
              statusFilter === 'NOT_STARTED'
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            ยังไม่ประเมิน ({stats.notStarted})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('DRAFT')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer whitespace-nowrap ${
              statusFilter === 'DRAFT'
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            ฉบับร่าง ({stats.draft})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('SUBMITTED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer whitespace-nowrap ${
              statusFilter === 'SUBMITTED'
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            ส่งผลแล้ว ({stats.submitted})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ หรือรหัสนักศึกษา..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </div>
      </div>

      {/* Main Content (Table + Mobile Cards) */}
      <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
            <p className="mt-4 text-sm text-muted-foreground animate-pulse">กำลังโหลดรายชื่อผู้สมัคร...</p>
          </div>
        ) : displayedApplicants.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground border border-border/60">
              <Inbox className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">
              {debouncedSearch ? 'ไม่พบผู้สมัครที่ตรงกับคำค้นหา' : 'ไม่พบรายการผู้สมัคร'}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              {debouncedSearch
                ? `ไม่พบข้อมูลที่ตรงกับ "${debouncedSearch}" กรุณาตรวจสอบรหัสนักศึกษาหรือชื่อ-สกุลอีกครั้ง`
                : statusFilter !== 'ALL'
                ? 'ไม่มีผู้สมัครที่ตรงกับแท็บสถานะที่เลือก'
                : 'รอบทุนนี้ยังไม่มีผู้สมัครที่เปิดให้ประเมิน'}
            </p>
            {debouncedSearch && (
              <button
                onClick={() => setSearch('')}
                className="mt-4 px-4 py-1.5 text-xs font-semibold rounded-xl bg-muted hover:bg-muted/80 text-foreground transition cursor-pointer"
              >
                ล้างการค้นหา
              </button>
            )}
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
                        <span className="text-[11px] font-mono font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                          #{String((pagination.page - 1) * pagination.limit + idx + 1).padStart(2, '0')} • {row.studentCode}
                        </span>
                        <h4 className="mt-1 font-semibold text-foreground text-sm">
                          {`${row.titlePrefix}${row.firstName} ${row.lastName}`}
                        </h4>
                      </div>
                      <StatusBadge label={statusBadge.label} variant={statusBadge.variant} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
                      <div>
                        <span className="block text-[10px] text-muted-foreground/80">สาขาวิชา</span>
                        <span className="font-medium text-foreground truncate block">{row.major || '-'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-muted-foreground/80">ส่งผลแล้ว</span>
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

            {/* Desktop View: Full Data Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground font-semibold text-xs">
                  <tr>
                    <th className="py-3.5 px-4 w-14 text-center">ลำดับ</th>
                    <th className="py-3.5 px-4 w-32 font-mono">รหัสนักศึกษา</th>
                    <th className="py-3.5 px-4">ชื่อ - นามสกุล</th>
                    <th className="py-3.5 px-4">สาขาวิชา</th>
                    <th className="py-3.5 px-4 text-center">ผู้ประเมินที่ส่งผลแล้ว</th>
                    <th className="py-3.5 px-4 text-center">สถานะของฉัน</th>
                    <th className="py-3.5 px-5 text-right w-36">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {displayedApplicants.map((row, idx) => {
                    const statusBadge = getStatusBadge(row.myStatus);
                    return (
                      <tr key={row.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="py-4 px-4 text-center font-mono text-xs text-muted-foreground">
                          {String((pagination.page - 1) * pagination.limit + idx + 1).padStart(2, '0')}
                        </td>
                        <td className="py-4 px-4 font-mono font-semibold text-foreground text-xs">
                          {row.studentCode}
                        </td>
                        <td className="py-4 px-4 font-medium text-foreground">
                          {`${row.titlePrefix}${row.firstName} ${row.lastName}`}
                        </td>
                        <td className="py-4 px-4 text-muted-foreground text-xs truncate max-w-xs">
                          {row.major || '-'}
                        </td>
                        <td className="py-4 px-4 text-center font-mono text-xs text-muted-foreground">
                          <span className="px-2.5 py-1 rounded-full bg-muted/60 border border-border/40 font-semibold">
                            {row.submittedCount > 0 ? `${row.submittedCount} คน` : '0 คน'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <StatusBadge label={statusBadge.label} variant={statusBadge.variant} />
                        </td>
                        <td className="py-4 px-5 text-right">
                          {getActionButton(row)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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