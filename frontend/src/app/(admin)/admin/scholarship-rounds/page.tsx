'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ScholarshipRoundListItem } from '@/types/rounds';
import { fetchRoundsList } from '@/services/rounds.service';
import { PageHeader, StatusBadge } from '@/components/ui';
import { 
  Calendar, 
  Plus, 
  Search, 
  Users, 
  ArrowRight,
  Eye,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { useDebounce } from '@/lib/use-debounce';

export default function ScholarshipRoundsPage() {
  const [rounds, setRounds] = useState<ScholarshipRoundListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const loadRounds = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchRoundsList({
        page,
        limit: 10,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter || undefined,
      });
      setRounds(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดรอบทุน';
      console.warn('API connection:', msg);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    void loadRounds();
  }, [loadRounds]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void loadRounds();
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* Standard Page Header */}
      <PageHeader
        moduleBadge="การจัดการรอบการให้ทุน"
        moduleBadgeIcon={Calendar}
        title="รอบทุนการศึกษา"
        description="จัดการและควบคุมสถานะรอบทุนการศึกษา (ร่าง ➔ เปิดรับสมัคร ➔ ปิดรอบการประเมิน)"
        action={
          <Link
            href="/admin/scholarship-rounds/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            สร้างรอบทุนใหม่
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
            placeholder="ค้นหาชื่อรอบทุนการศึกษา..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-44">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition cursor-pointer"
            >
              <option value="">ทุกสถานะ</option>
              <option value="DRAFT">ร่าง (Draft)</option>
              <option value="OPEN">เปิดรับสมัคร (Open)</option>
              <option value="CLOSED">ปิดรอบแล้ว (Closed)</option>
            </select>
          </div>

          <button
            onClick={() => { setPage(1); void loadRounds(); }}
            className="px-5 py-2.5 text-sm font-medium bg-muted hover:bg-muted/80 text-foreground rounded-xl transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            ค้นหา
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
            <p className="mt-4 text-sm text-muted-foreground animate-pulse">กำลังโหลดรายการรอบทุน...</p>
          </div>
        ) : rounds.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground border border-border/60">
              <Calendar className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">ยังไม่มีรอบทุนการศึกษา</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
              เริ่มต้นสร้างรอบทุนการศึกษาชุดแรกเพื่อเปิดรับสมัครและเชื่อมโยงเกณฑ์
            </p>
            <div className="mt-6">
              <Link
                href="/admin/scholarship-rounds/create"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm transition hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                สร้างรอบทุนชุดแรก
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3.5 px-5">ชื่อรอบทุน</th>
                  <th className="py-3.5 px-4 text-center">ปี/ภาคการศึกษา</th>
                  <th className="py-3.5 px-5">เกณฑ์การประเมินที่เชื่อมไว้</th>
                  <th className="py-3.5 px-4 text-center">จำนวนผู้สมัคร</th>
                  <th className="py-3.5 px-4 text-center">สถานะรอบทุน</th>
                  <th className="py-3.5 px-5 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rounds.map((round) => (
                  <tr key={round.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="py-4 px-5 font-medium text-foreground">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {round.name}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono mt-0.5">
                          รอบที่ #{round.id}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center font-mono font-medium px-2.5 py-0.5 rounded-lg bg-muted text-xs">
                        {round.academicYear}/{round.semester}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      {round.criteriaName ? (
                        <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          {round.criteriaName}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md italic">
                          ยังไม่ได้ผูกเกณฑ์
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {round.applicantCount} คน
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {round.status === 'OPEN' ? (
                        <StatusBadge label="เปิดรับสมัคร (Open)" variant="open" />
                      ) : round.status === 'CLOSED' ? (
                        <StatusBadge label="ปิดรอบแล้ว (Closed)" variant="closed" />
                      ) : (
                        <StatusBadge label="ร่าง (Draft)" variant="draft" />
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <Link
                        href={`/admin/scholarship-rounds/${round.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-foreground px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary transition hover:scale-[1.02] active:scale-[0.98] shadow-2xs cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        จัดการรอบ
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
