'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ScholarshipRoundListItem } from '@/types/rounds';
import { fetchRoundsList } from '@/services/rounds.service';
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
import { 
  Calendar, 
  Plus, 
  Search, 
  Users, 
  ArrowRight,
  CheckCircle2,
  Check,
  RefreshCw,
  Trash2,
  X,
  Sliders,
  Layers,
} from 'lucide-react';
import { useDebounce } from '@/lib/use-debounce';
import { DeleteRoundModal } from '@/components/rounds/delete-round-modal';
import { RoundStatusFilterTabs } from '@/components/rounds/round-status-filter-tabs';
import { RoundStageIndicator } from '@/components/rounds/round-stage-indicator';

export default function ScholarshipRoundsPage() {
  const [rounds, setRounds] = useState<ScholarshipRoundListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deletingRound, setDeletingRound] = useState<ScholarshipRoundListItem | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Track status breakdown counts
  const [statusCounts, setStatusCounts] = useState({
    total: 0,
    draft: 0,
    open: 0,
    closed: 0,
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

      // Update counts when no filter is applied
      if (!statusFilter && !debouncedSearch.trim()) {
        setStatusCounts({
          total: res.meta?.total ?? res.data.length,
          draft: res.data.filter((r) => r.status === 'DRAFT').length,
          open: res.data.filter((r) => r.status === 'OPEN').length,
          closed: res.data.filter((r) => r.status === 'CLOSED').length,
        });
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

  const handleClearFilter = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      {/* Standard Page Header */}
      <PageHeader
        title="รอบทุนการศึกษา"
        action={
          <Link href="/admin/scholarship-rounds/create">
            <Button leftIcon={<Plus className="h-4 w-4" />}>
              สร้างรอบทุนใหม่
            </Button>
          </Link>
        }
      />

      {/* Filter and Search Bar with Segmented Tabs */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-3 shadow-xs">
        {/* Segmented Status Tabs */}
        <RoundStatusFilterTabs
          currentStatus={statusFilter}
          onSelectStatus={(status) => {
            setStatusFilter(status);
            setPage(1);
          }}
          counts={statusCounts}
        />

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md w-full">
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อรอบทุน"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => { setSearchTerm(''); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md"
              title="ล้างข้อความค้นหา"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>
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

      {/* Main Table / Data View */}
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
                icon={statusFilter ? Layers : Calendar}
                title={
                  statusFilter === 'OPEN'
                    ? 'ยังไม่มีรอบทุนที่เปิดรับประเมิน'
                    : statusFilter === 'DRAFT'
                    ? 'ไม่มีรอบทุนแบบร่าง'
                    : statusFilter === 'CLOSED'
                    ? 'ยังไม่มีรอบทุนที่ปิดการประเมิน'
                    : 'ไม่พบรอบทุนตามเงื่อนไข'
                }
                description={
                  statusFilter === 'OPEN'
                    ? 'เมื่อรอบทุนแบบร่างได้รับการตั้งค่าครบถ้วนและกด "เปิดรับประเมิน" รอบทุนจะปรากฏที่นี่'
                    : statusFilter === 'DRAFT'
                    ? 'รอบทุนแบบร่างที่รอตั้งค่าจะแสดงที่นี่'
                    : statusFilter === 'CLOSED'
                    ? 'รอบทุนที่สิ้นสุดการประเมินจะถูกจัดเก็บไว้ที่นี่'
                    : 'ไม่พบข้อมูลที่ตรงกับตัวกรองปัจจุบัน กรุณาลองค้นหาด้วยคำอื่น หรือกดล้างตัวกรอง'
                }
              >
                {statusFilter || searchTerm ? (
                  <Button variant="secondary" onClick={handleClearFilter}>
                    ล้างตัวกรองทั้งหมด
                  </Button>
                ) : (
                  <Link href="/admin/scholarship-rounds/create">
                    <Button leftIcon={<Plus className="h-4 w-4" />}>
                      สร้างรอบทุนชุดแรก
                    </Button>
                  </Link>
                )}
              </EmptyState>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {rounds.map((round) => (
                <div key={round.id} className="p-4 space-y-3 hover:bg-muted/10 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-foreground text-base leading-snug">
                        {round.name}
                      </h4>
                    </div>
                    <div className="shrink-0">
                      <RoundStageIndicator status={round.status} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
                    <div>
                      <span className="block text-xs text-muted-foreground">ปี/ภาคเรียน</span>
                      <span className="font-mono font-medium text-foreground">{round.academicYear}/{round.semester}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-muted-foreground">ผู้สมัคร</span>
                      <span className="font-mono font-bold text-foreground flex items-center gap-1">
                        <Users className="h-3 w-3 text-blue-600" /> {round.applicantCount} คน
                      </span>
                    </div>
                    <div className="col-span-2 border-t border-border/40 pt-1.5 mt-0.5">
                      <span className="block text-xs text-muted-foreground mb-0.5">ชุดเกณฑ์ที่ผูก</span>
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

                  <div className="pt-1 flex items-center gap-2">
                    <Link
                      href={`/admin/scholarship-rounds/${round.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-primary py-2.5 px-3 rounded-xl bg-primary/10 hover:bg-primary hover:text-primary-foreground transition shadow-2xs"
                    >
                      <Sliders className="h-3.5 w-3.5" />
                      <span>ตั้งค่ารอบทุน</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                    {round.status === 'DRAFT' ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingRound(round)}
                        className="h-9 w-9 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl border border-rose-200/60 dark:border-rose-900/40 shrink-0"
                        title="ลบรอบทุนแบบร่างนี้"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled
                        className="h-9 w-9 p-0 text-muted-foreground/35 bg-muted/20 border border-border/40 rounded-xl shrink-0"
                        title={
                          round.status === 'OPEN'
                            ? 'ไม่สามารถลบรอบทุนที่กำลังเปิดรับประเมินได้'
                            : 'ไม่สามารถลบรอบทุนที่ปิดการประเมินแล้วได้'
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop View: Full Data Table (>= md) */}
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
                        icon={statusFilter ? Layers : Calendar}
                        title={
                          statusFilter === 'OPEN'
                            ? 'ยังไม่มีรอบทุนที่เปิดรับประเมิน'
                            : statusFilter === 'DRAFT'
                            ? 'ไม่มีรอบทุนแบบร่าง'
                            : statusFilter === 'CLOSED'
                            ? 'ยังไม่มีรอบทุนที่ปิดการประเมิน'
                            : 'ไม่พบรอบทุนตามเงื่อนไข'
                        }
                        description={
                          statusFilter === 'OPEN'
                            ? 'เมื่อรอบทุนแบบร่างได้รับการตั้งค่าครบถ้วนและกด "เปิดรับประเมิน" รอบทุนจะปรากฏที่นี่'
                            : statusFilter === 'DRAFT'
                            ? 'รอบทุนแบบร่างที่รอตั้งค่าจะแสดงที่นี่'
                            : statusFilter === 'CLOSED'
                            ? 'รอบทุนที่สิ้นสุดการประเมินจะถูกจัดเก็บไว้ที่นี่'
                            : 'ไม่พบข้อมูลที่ตรงกับตัวกรองปัจจุบัน กรุณาลองค้นหาด้วยคำอื่น หรือกดล้างตัวกรอง'
                        }
                      >
                        {statusFilter || searchTerm ? (
                          <Button variant="secondary" onClick={handleClearFilter}>
                            ล้างตัวกรองทั้งหมด
                          </Button>
                        ) : (
                          <Link href="/admin/scholarship-rounds/create">
                            <Button leftIcon={<Plus className="h-4 w-4" />}>
                              สร้างรอบทุนชุดแรก
                            </Button>
                          </Link>
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
                          <span>สร้างเมื่อ {new Date(round.createdAt).toLocaleDateString('th-TH')}</span>
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
                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md italic">
                          ยังไม่ได้ผูกเกณฑ์
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

                    {/* Contextual Action Buttons */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link href={`/admin/scholarship-rounds/${round.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-w-[110px] justify-center whitespace-nowrap bg-primary/5 text-primary border-primary/20 hover:bg-primary hover:text-white hover:border-transparent font-medium shrink-0 text-xs px-2.5"
                            rightIcon={<ArrowRight className="h-3 w-3 shrink-0" />}
                            leftIcon={<Sliders className="h-3.5 w-3.5 shrink-0" />}
                          >
                            ตั้งค่ารอบทุน
                          </Button>
                        </Link>
                        {round.status === 'DRAFT' ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingRound(round)}
                            className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl border border-rose-200/60 dark:border-rose-900/40 shrink-0"
                            title="ลบรอบทุนแบบร่างนี้"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled
                            className="h-8 w-8 p-0 text-muted-foreground/35 bg-muted/20 border border-border/40 rounded-xl shrink-0 cursor-not-allowed"
                            title={
                              round.status === 'OPEN'
                                ? 'ไม่สามารถลบรอบทุนที่กำลังเปิดรับประเมินได้'
                                : 'ไม่สามารถลบรอบทุนที่ปิดการประเมินแล้วได้'
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

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

      {/* Delete Draft Round Confirmation Modal */}
      {deletingRound && (
        <DeleteRoundModal
          isOpen={true}
          roundId={deletingRound.id}
          roundName={deletingRound.name}
          academicYear={deletingRound.academicYear}
          semester={deletingRound.semester}
          applicantCount={deletingRound.applicantCount}
          onClose={() => setDeletingRound(null)}
          onSuccess={() => {
            setDeletingRound(null);
            void loadRounds();
          }}
        />
      )}
    </div>
  );
}
