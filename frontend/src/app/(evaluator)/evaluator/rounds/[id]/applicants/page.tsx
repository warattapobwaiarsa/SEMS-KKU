/**
 * หน้ารายชื่อผู้สมัครสำหรับ Evaluator
 * Route: /evaluator/rounds/[id]/applicants
 * ใช้ข้อมูลจาก API: GET /scholarship-rounds/:roundId/applicants
 * Header: X-User-Id (mock auth, TEMPORARY จนกว่าจะมี KKU SSO [FR-AUTH-01])
 * [FR-EVL-01] [BR-EVL-01] [FR-EVL-03] [BR-SCR-01] [FR-APP-04]
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebounce } from '@/lib/use-debounce';
import { apiClient, ApiError } from '@/lib/api-client';
import { getEvaluatorId } from '@/lib/mock-evaluator';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Pagination } from '@/components/ui/pagination';
import type { PaginationMeta } from '@/types/evaluation';

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
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
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

  // โหลดข้อมูลรอบทุน (ชื่อ + สถานะ)
  useEffect(() => {
    params.then((p) => {
      const id = parseInt(p.id, 10);
      setRoundId(id);
      // รอบทุนจะได้จาก API applicants response (มี roundId) หรือจะดึงแยกก็ได้
      // ใช้ชื่อรอบจาก localStorage หรือจะใส่ default ไปก่อน
    });
  }, [params]);

  // ดึงข้อมูลผู้สมัคร
  const fetchApplicants = useCallback(async () => {
    if (!roundId) return;
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams();
      if (debouncedSearch) query.set('search', debouncedSearch);
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

      setApplicants(res.data);
      setPagination(res.meta);
      // เก็บชื่อรอบและสถานะ (จะได้จาก backend response หรือจะใส่เอง)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 404) {
          setError('ไม่พบรอบทุนนี้หรือรอบนี้ยังไม่เปิดรับการประเมิน');
        } else {
          setError(err.message);
        }
      } else {
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  }, [roundId, debouncedSearch, pagination.page, pagination.limit]);

  // เรียก fetch เมื่อ debouncedSearch, page, limit เปลี่ยน
  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  // จัดการการเปลี่ยน search (reset page = 1)
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (pagination.page !== 1) {
      setPagination((prev: PaginationMeta) => ({ ...prev, page: 1 }));
    }
  };

  // จัดการเปลี่ยนหน้า
  const handlePageChange = (page: number) => {
    setPagination((prev: PaginationMeta) => ({ ...prev, page }));
  };

  // สถานะ badge
  const getStatusBadge = (status: ApplicantRow['myStatus']) => {
    switch (status) {
      case 'NOT_STARTED':
        return { label: 'ยังไม่ประเมิน', variant: 'neutral' as const };
      case 'DRAFT':
        return { label: 'ร่าง', variant: 'draft' as const };
      case 'SUBMITTED':
        return { label: 'ส่งแล้ว', variant: 'success' as const };
    }
  };

  // ปุ่ม action
  const getActionButton = (row: ApplicantRow) => {
    const status = row.myStatus;
    const canStart = row.canStart;
    const applicantLink = `/evaluator/rounds/${roundId}/applicants/${row.id}`;

    if (status === 'SUBMITTED') {
      return (
        <a
          href={applicantLink}
          className="inline-flex items-center justify-center w-full px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition"
        >
          ดูผล
        </a>
      );
    }

    if (status === 'DRAFT') {
      return (
        <a
          href={applicantLink}
          className="inline-flex items-center justify-center w-full px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition"
        >
          ประเมินต่อ
        </a>
      );
    }

    // NOT_STARTED
    if (!canStart) {
      return (
        <div className="relative group">
          <button
            disabled
            className="w-full px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-100 text-slate-400 border border-dashed border-slate-300 cursor-not-allowed"
          >
            เริ่มประเมิน
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-52 p-2 bg-slate-900 text-white text-[11px] rounded shadow-lg z-10 leading-tight whitespace-nowrap">
            บัญชีหมดอายุ ไม่สามารถเริ่มประเมินผู้สมัครรายใหม่ได้
          </div>
        </div>
      );
    }

    return (
      <a
        href={applicantLink}
        className="inline-flex items-center justify-center w-full px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-700 bg-slate-900 text-white hover:bg-slate-800 transition"
      >
        เริ่มประเมิน
      </a>
    );
  };

  // Loading skeleton rows (ใช้ Tailwind animate-pulse แทน custom CSS)
  const renderSkeletonRows = () => (
    <>
      {[1, 2, 3].map((i) => (
        <tr key={i} className="h-[60px]">
          <td className="px-4 text-center"><div className="animate-pulse bg-slate-200 h-4 w-6 mx-auto rounded" /></td>
          <td className="px-4"><div className="animate-pulse bg-slate-200 h-4 w-24 rounded" /></td>
          <td className="px-4"><div className="animate-pulse bg-slate-200 h-4 w-36 rounded" /></td>
          <td className="px-4"><div className="animate-pulse bg-slate-200 h-4 w-32 rounded" /></td>
          <td className="px-4 text-center"><div className="animate-pulse bg-slate-200 h-4 w-12 mx-auto rounded" /></td>
          <td className="px-4 text-center"><div className="animate-pulse bg-slate-200 h-6 w-20 mx-auto rounded-full" /></td>
          <td className="px-4 text-center"><div className="animate-pulse bg-slate-200 h-8 w-24 mx-auto rounded" /></td>
        </tr>
      ))}
    </>
  );

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        title={`ผู้สมัครรอบ ${roundId}`}
        description={`รหัสรอบ: ${roundId}`}
        backHref="/evaluator/rounds"
        backLabel="กลับหน้ารอบทุนที่เปิดประเมิน"
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="ค้นหารหัสนักศึกษาหรือชื่อ"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-4 py-2 text-sm border border-slate-300 bg-white focus:outline-none focus:border-slate-900 rounded-xl"
          />
          <div className="absolute right-3 top-2.5 text-xs text-slate-400">🔍</div>
        </div>
        <div className="text-sm text-slate-500">
          แสดง {applicants.length} รายการจาก {pagination.total} รายการ
        </div>
      </div>

      {loading ? (
        // Loading skeleton
        <div className="border border-slate-200 overflow-hidden rounded-xl">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 w-16 text-center">ลำดับ</th>
                <th className="py-3 px-4 w-36">รหัสนักศึกษา</th>
                <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3 px-4">สาขาวิชา</th>
                <th className="py-3 px-4 text-center">ผู้ประเมินที่ส่งผลแล้ว</th>
                <th className="py-3 px-4 text-center">สถานะของฉัน</th>
                <th className="py-3 px-4 text-center w-36">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {renderSkeletonRows()}
            </tbody>
          </table>
        </div>
      ) : applicants.length === 0 ? (
        // Empty state
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 w-16 text-center">ลำดับ</th>
                <th className="py-3 px-4 w-36">รหัสนักศึกษา</th>
                <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3 px-4">สาขาวิชา</th>
                <th className="py-3 px-4 text-center">ผู้ประเมินที่ส่งผลแล้ว</th>
                <th className="py-3 px-4 text-center">สถานะของฉัน</th>
                <th className="py-3 px-4 text-center w-36">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} className="py-16 text-center bg-slate-50">
                  <div className="w-12 h-12 border border-slate-200 bg-white mx-auto mb-3 flex items-center justify-center text-slate-400 font-mono text-lg">?</div>
                  <div className="text-base font-bold text-slate-800">
                    {debouncedSearch
                      ? 'ไม่พบผู้สมัครที่ตรงกับการค้นหา'
                      : 'ไม่พบผู้สมัครในรอบนี้'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {debouncedSearch
                      ? `ไม่พบข้อมูลที่ตรงกับคำค้นหา "${debouncedSearch}" กรุณาตรวจสอบรหัสนักศึกษาหรือชื่อ-สกุลใหม่อีกครั้ง`
                      : 'ยังไม่มีผู้สมัครในรอบทุนนี้'}
                  </div>
                  {debouncedSearch && (
                    <button
                      onClick={() => setSearch('')}
                      className="mt-4 px-4 py-1.5 border border-slate-300 bg-white text-xs hover:bg-slate-50 font-medium rounded-xl"
                    >
                      ล้างการค้นหา
                    </button>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        // Data table
        <div className="border border-slate-200 overflow-hidden rounded-xl">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 w-16 text-center">ลำดับ</th>
                <th className="py-3 px-4 w-36">รหัสนักศึกษา</th>
                <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3 px-4">สาขาวิชา</th>
                <th className="py-3 px-4 text-center">ผู้ประเมินที่ส่งผลแล้ว</th>
                <th className="py-3 px-4 text-center">สถานะของฉัน</th>
                <th className="py-3 px-4 text-center w-36">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {applicants.map((row, idx) => {
                const statusBadge = getStatusBadge(row.myStatus);
                return (
                  <tr key={row.id} className="h-[60px] hover:bg-slate-50">
                    <td className="px-4 text-center text-slate-500 font-mono text-sm">
                      {String((pagination.page - 1) * pagination.limit + idx + 1).padStart(2, '0')}
                    </td>
                    <td className="px-4 font-mono font-medium">{row.studentCode}</td>
                    <td className="px-4 font-medium">{`${row.titlePrefix}${row.firstName} ${row.lastName}`}</td>
                    <td className="px-4 text-slate-600">{row.major || '-'}</td>
                    <td className="px-4 text-center text-slate-600">
                      {row.submittedCount > 0
                        ? `${row.submittedCount} คน`
                        : '0 คน'}
                    </td>
                    <td className="px-4 text-center">
                      <StatusBadge
                        label={statusBadge.label}
                        variant={statusBadge.variant}
                      />
                    </td>
                    <td className="px-4 text-center">
                      {getActionButton(row)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        onPageChange={handlePageChange}
      />

      {/* Caption */}
      <div className="mt-4 text-xs text-slate-500 border-l-2 border-slate-300 pl-3 py-1">
        คำแนะนำ: ผู้ประเมินหลายคนประเมินผู้สมัครรายเดียวกันได้ แต่ประเมินซ้ำในรอบเดียวกันไม่ได้
      </div>
    </div>
  );
}