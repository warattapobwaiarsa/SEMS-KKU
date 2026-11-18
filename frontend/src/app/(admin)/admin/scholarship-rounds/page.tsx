'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ScholarshipRoundListItem } from '@/types/rounds';
import { fetchRoundsList } from '@/services/rounds.service';
import { PageHeader, StatusBadge, Pagination, Select, Button, Input, Alert, EmptyState } from '@/components/ui';
import { 
  Calendar, 
  Plus, 
  Search, 
  Users, 
  ArrowRight,
  Eye,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useDebounce } from '@/lib/use-debounce';

export default function ScholarshipRoundsPage() {
  const [rounds, setRounds] = useState<ScholarshipRoundListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const loadRounds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchRoundsList({
        page,
        limit: 10,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter || undefined,
      });
      setRounds(res.data);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดรอบทุน';
      setError(msg);
      setRounds([]);
      console.warn('API connection:', msg);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    void Promise.resolve().then(() => loadRounds());
  }, [loadRounds]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void Promise.resolve().then(() => loadRounds());
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
          <Link href="/admin/scholarship-rounds/create">
            <Button leftIcon={<Plus className="h-4 w-4" />}>
              สร้างรอบทุนใหม่
            </Button>
          </Link>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-3 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อรอบทุนการศึกษา..."
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-48">
            <Select
              icon={Filter}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">ทุกสถานะ</option>
              <option value="DRAFT">ร่าง (Draft)</option>
              <option value="OPEN">เปิดรับสมัคร (Open)</option>
              <option value="CLOSED">ปิดรอบแล้ว (Closed)</option>
            </Select>
          </div>

          <Button
            variant="secondary"
            onClick={() => { setPage(1); void loadRounds(); }}
          >
            ค้นหา
          </Button>
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

      {/* Main Table */}
      <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
            <p className="mt-4 text-sm text-muted-foreground animate-pulse">กำลังโหลดรายการรอบทุน...</p>
          </div>
        ) : error ? null : rounds.length === 0 ? (
          <div className="p-8 sm:p-12">
            <EmptyState
              icon={Calendar}
              title="ยังไม่มีรอบทุนการศึกษา"
              description="เริ่มต้นสร้างรอบทุนการศึกษาชุดแรกเพื่อเปิดรับสมัครและเชื่อมโยงเกณฑ์"
            >
              <Link href="/admin/scholarship-rounds/create">
                <Button leftIcon={<Plus className="h-4 w-4" />}>
                  สร้างรอบทุนชุดแรก
                </Button>
              </Link>
            </EmptyState>
          </div>
        ) : (
          <>
            {/* Mobile View: Responsive Cards (< md) */}
            <div className="block md:hidden divide-y divide-border/60">
              {rounds.map((round) => (
                <div key={round.id} className="p-4 space-y-3 hover:bg-muted/10 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-mono font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                        #{round.id}
                      </span>
                      <h4 className="mt-1 font-semibold text-foreground text-sm leading-snug">
                        {round.name}
                      </h4>
                    </div>
                    {round.status === 'OPEN' ? (
                      <StatusBadge label="เปิดรับสมัคร" variant="open" />
                    ) : round.status === 'CLOSED' ? (
                      <StatusBadge label="ปิดรอบแล้ว" variant="closed" />
                    ) : (
                      <StatusBadge label="ร่าง" variant="draft" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
                    <div>
                      <span className="block text-xs text-muted-foreground/80">ปี/ภาคเรียน</span>
                      <span className="font-mono font-medium text-foreground">{round.academicYear}/{round.semester}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-muted-foreground/80">ผู้สมัคร</span>
                      <span className="font-mono font-semibold text-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> {round.applicantCount} คน
                      </span>
                    </div>
                    <div className="col-span-2 border-t border-border/40 pt-1.5 mt-0.5">
                      <span className="block text-xs text-muted-foreground/80 mb-0.5">ชุดเกณฑ์ที่ผูก</span>
                      {round.criteriaName ? (
                        <span className="font-medium text-foreground flex items-center gap-1 truncate">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{round.criteriaName}</span>
                        </span>
                      ) : (
                        <span className="text-amber-700 italic">ยังไม่ได้ผูกเกณฑ์</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <Link
                      href={`/admin/scholarship-rounds/${round.id}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-primary py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary hover:text-primary-foreground transition shadow-2xs"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      จัดการรอบทุน
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Full Data Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
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
                        <Link href={`/admin/scholarship-rounds/${round.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-primary/5 text-primary border-primary/20 hover:bg-primary hover:text-white hover:border-transparent font-medium"
                            leftIcon={<Eye className="h-3.5 w-3.5" />}
                            rightIcon={<ArrowRight className="h-3 w-3" />}
                          >
                            จัดการรอบ
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination Controls */}
        {!loading && rounds.length > 0 && (
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
