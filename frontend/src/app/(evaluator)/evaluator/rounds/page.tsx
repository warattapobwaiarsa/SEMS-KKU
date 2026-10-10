'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Award,
  Users,
  Calendar,
  Layers,
  ArrowRight,
  Search,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Pagination } from '@/components/ui/pagination';
import { useDebounce } from '@/lib/use-debounce';
import { ApiError } from '@/lib/api-client';
import { fetchEvaluatorRounds } from '@/services/evaluation.service';
import type { EvaluatorRound, PaginationMeta } from '@/types/evaluation';

export default function EvaluatorRoundsPage() {
  const searchParams = useSearchParams();
  const [rounds, setRounds] = useState<EvaluatorRound[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 12,
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
        search: debouncedSearch,
        page: pagination.page,
        limit: pagination.limit,
      });
      setRounds(res.data);
      setPagination(res.meta);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('เกิดข้อผิดพลาดในการโหลดรายการรอบทุนการศึกษา');
      }
      setRounds([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, pagination.page, pagination.limit]);

  useEffect(() => {
    void loadRounds();
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
    <div className="flex-1 flex flex-col space-y-6">
      <PageHeader
        title="รอบทุนการศึกษาที่เปิดประเมิน"
        description="เลือกรอบทุนการศึกษาที่เปิดรับการประเมินเพื่อเข้าสู่การตรวจรายชื่อและให้คะแนนผู้สมัคร"
      />

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อรอบทุนการศึกษา..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 animate-pulse shadow-xs"
            >
              <div className="flex justify-between items-start">
                <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
                <div className="h-5 w-16 bg-slate-200 rounded-full" />
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-4 w-1/2 bg-slate-100 rounded" />
                <div className="h-4 w-2/3 bg-slate-100 rounded" />
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="h-9 w-full bg-slate-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && rounds.length === 0 && !error && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
            <Inbox className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            ยังไม่มีรอบทุนที่เปิดรับการประเมิน
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {search
              ? 'ไม่พบข้อมูลรอบทุนที่ตรงกับคำค้นหา ลองตรวจสอบคำค้นหาใหม่อีกครั้ง'
              : 'รอบทุนการศึกษาจะต้องเปิดรับการประเมิน (สถานะ OPEN) โดยผู้ดูแลระบบ จึงจะปรากฏในหน้านี้'}
          </p>
        </div>
      )}

      {/* Rounds Grid */}
      {!loading && rounds.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rounds.map((round) => (
            <div
              key={round.id}
              className="bg-white border border-slate-200 hover:border-primary/40 rounded-2xl p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition line-clamp-1">
                        {round.name}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        ปีการศึกษา {round.academicYear} • ภาคเรียนที่ {round.semester}
                      </p>
                    </div>
                  </div>
                  <StatusBadge label="เปิดประเมิน" variant="success" />
                </div>

                {/* Details Meta */}
                <div className="space-y-2 py-3 border-y border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Layers className="h-3.5 w-3.5 text-slate-400" />
                      เกณฑ์การประเมิน
                    </span>
                    <span className="font-semibold text-slate-800 truncate max-w-[160px]">
                      {round.criteriaName ?? 'เกณฑ์มาตรฐาน'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      จำนวนผู้สมัคร
                    </span>
                    <span className="font-bold text-slate-900">
                      {round.applicantCount.toLocaleString('th-TH')} คน
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Link */}
              <div className="pt-4 mt-2">
                <Link
                  href={`/evaluator/rounds/${round.id}/applicants`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.99] transition shadow-xs"
                >
                  <span>เข้าสู่การประเมินผู้สมัคร</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="pt-4 flex justify-center">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
