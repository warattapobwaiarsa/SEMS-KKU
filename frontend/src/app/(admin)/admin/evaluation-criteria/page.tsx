'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CriteriaDetail } from '@/types/criteria';
import { fetchCriteriaList } from '@/services/criteria.service';
import { PageHeader, StatusBadge, Pagination, RoundBadges } from '@/components/ui';
import { 
  FileCheck2, 
  Plus, 
  Search, 
  Calendar, 
  Edit3, 
  Eye, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';
import { useDebounce } from '@/lib/use-debounce';

export default function EvaluationCriteriaPage() {
  const [criteriaList, setCriteriaList] = useState<CriteriaDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const loadCriteria = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchCriteriaList({
        page,
        limit: 10,
        search: debouncedSearch.trim() || undefined,
      });
      setCriteriaList(res.data);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
      console.warn('API connection:', msg);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    void loadCriteria();
  }, [loadCriteria]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void loadCriteria();
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* Standard Page Header */}
      <PageHeader
        moduleBadge="การจัดการข้อมูลหลัก"
        moduleBadgeIcon={Sparkles}
        title="เกณฑ์การประเมินทุน"
        description="กำหนดชุดเกณฑ์และสัดส่วนคะแนนสำหรับการประเมินทุนการศึกษา (ผลรวมทุกชุดเกณฑ์ต้องเท่ากับ 100 คะแนน)"
        action={
          <Link
            href="/admin/evaluation-criteria/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            สร้างชุดเกณฑ์ใหม่
          </Link>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-3 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อชุดเกณฑ์ หรือหัวข้อเกณฑ์การประเมิน..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </form>
        <button
          onClick={() => { setPage(1); void loadCriteria(); }}
          className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium bg-muted hover:bg-muted/80 text-foreground rounded-xl transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          ค้นหา
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
            <p className="mt-4 text-sm text-muted-foreground animate-pulse">กำลังโหลดข้อมูลชุดเกณฑ์...</p>
          </div>
        ) : criteriaList.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground border border-border/60">
              <FileCheck2 className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">ยังไม่มีชุดเกณฑ์การประเมิน</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
              เริ่มต้นสร้างชุดเกณฑ์การประเมินชุดแรกเพื่อนำไปผูกกับรอบทุนการศึกษา
            </p>
            <div className="mt-6">
              <Link
                href="/admin/evaluation-criteria/create"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm transition hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                สร้างชุดเกณฑ์ชุดแรก
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile View: Responsive Cards (< md) */}
            <div className="block md:hidden divide-y divide-border/60">
              {criteriaList.map((criteria) => (
                <div key={criteria.id} className="p-4 space-y-3 hover:bg-muted/10 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                        #{criteria.id}
                      </span>
                      <h4 className="mt-1 font-semibold text-foreground text-sm leading-snug">
                        {criteria.name}
                      </h4>
                    </div>
                    {criteria.isLocked ? (
                      <StatusBadge label="ล็อก" variant="locked" />
                    ) : (
                      <StatusBadge label="แก้ไขได้" variant="unlocked" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
                    <div>
                      <span className="block text-[10px] text-muted-foreground/80">คะแนนเต็ม</span>
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        {criteria.totalScore} คะแนน
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground/80">เกณฑ์ย่อย</span>
                      <span className="font-mono font-semibold text-foreground">
                        {criteria.subCriteria.length} ข้อ
                      </span>
                    </div>
                    <div className="col-span-2 border-t border-border/40 pt-2 mt-0.5">
                      <span className="block text-[10px] text-muted-foreground/80 mb-1">รอบทุนที่นำไปใช้</span>
                      <RoundBadges rounds={criteria.usedByRounds} compact={true} maxVisible={2} />
                    </div>
                  </div>

                  <div className="pt-1 flex justify-end">
                    {criteria.isLocked ? (
                      <Link
                        href={`/admin/evaluation-criteria/${criteria.id}`}
                        className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground py-2 px-3 rounded-xl bg-muted hover:bg-muted/80 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        ดูรายละเอียด
                      </Link>
                    ) : (
                      <Link
                        href={`/admin/evaluation-criteria/${criteria.id}`}
                        className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-primary py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary hover:text-primary-foreground transition shadow-2xs"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        แก้ไขเกณฑ์
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Full Data Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3.5 px-5">ชื่อชุดเกณฑ์</th>
                    <th className="py-3.5 px-4 text-center">คะแนนเต็ม</th>
                    <th className="py-3.5 px-4 text-center">จำนวนเกณฑ์ย่อย</th>
                    <th className="py-3.5 px-5">รอบทุนที่นำไปใช้</th>
                    <th className="py-3.5 px-4 text-center">สถานะการแก้ไข</th>
                    <th className="py-3.5 px-5 text-right">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {criteriaList.map((criteria) => (
                    <tr key={criteria.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="py-4 px-5 font-medium text-foreground">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {criteria.name}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono mt-0.5">
                            ชุดเกณฑ์ที่ #{criteria.id}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs shadow-2xs">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {criteria.totalScore} คะแนน
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center text-muted-foreground font-mono text-xs font-semibold">
                        {criteria.subCriteria.length} ข้อ
                      </td>
                      <td className="py-4 px-5">
                        <RoundBadges rounds={criteria.usedByRounds} maxVisible={2} />
                      </td>
                      <td className="py-4 px-4 text-center">
                        {criteria.isLocked ? (
                          <StatusBadge label="ล็อก (เปิดประเมินแล้ว)" variant="locked" />
                        ) : (
                          <StatusBadge label="แก้ไขได้" variant="unlocked" />
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        {criteria.isLocked ? (
                          <Link
                            href={`/admin/evaluation-criteria/${criteria.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3.5 py-2 rounded-xl hover:bg-muted btn-interactive cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            ดูรายละเอียด
                          </Link>
                        ) : (
                          <Link
                            href={`/admin/evaluation-criteria/${criteria.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-foreground px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary btn-interactive shadow-2xs cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            แก้ไขเกณฑ์
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination Controls */}
        {!loading && criteriaList.length > 0 && (
          <Pagination
            page={page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            onPageChange={(newPage) => setPage(newPage)}
            disabled={loading}
          />
        )}
      </div>
    </div>
  );
}
