'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Search,
  Users,
  ArrowRight,
  CheckCircle2,
  Clock,
  Archive,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';
import {
  PageHeader,
  Pagination,
  Button,
  Input,
  Alert,
  EmptyState,
  StatusBadge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Card,
} from '@/components/ui';
import { RoundStatusFilterTabs } from '@/components/rounds/round-status-filter-tabs';
import { RoundStageIndicator } from '@/components/rounds/round-stage-indicator';
import { fetchRoundsList } from '@/services/rounds.service';
import type { ScholarshipRoundListItem } from '@/types/rounds';
import { useDebounce } from '@/lib/use-debounce';

export default function EvaluationResultsRoundsPage() {
  const [rounds, setRounds] = useState<ScholarshipRoundListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
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

  // Track counts for RoundStatusFilterTabs
  const [statusCounts, setStatusCounts] = useState({
    total: 0,
    draft: 0,
    open: 0,
    closed: 0,
  });

  // Load Rounds List
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

      const list = res.data || [];
      setRounds(list);
      if (res.meta) {
        setMeta(res.meta);
      }

      // Update status counts if no active filters
      if (!statusFilter && !debouncedSearch.trim()) {
        setStatusCounts({
          total: res.meta?.total ?? list.length,
          draft: list.filter((r) => r.status === 'DRAFT').length,
          open: list.filter((r) => r.status === 'OPEN').length,
          closed: list.filter((r) => r.status === 'CLOSED').length,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดรอบทุนการศึกษา';
      setError(msg);
      setRounds([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    void loadRounds();
  }, [loadRounds]);

  const handleClearFilter = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      {/* 1. Page Header (Standard SEMS Design) */}
      <PageHeader
        title="ผลการประเมินและอันดับ"
      />

      {/* 2. Filter and Search Bar with Segmented Tabs (หน้ารอบทุน Style) */}
      <Card className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 shadow-xs">
        {/* Segmented Status Tabs */}
        <RoundStatusFilterTabs
          currentStatus={statusFilter}
          onSelectStatus={(status) => {
            setStatusFilter(status);
            setPage(1);
          }}
          counts={statusCounts}
        />

        {/* Search Input with Debounce */}
        <div className="relative flex-1 max-w-md w-full">
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="ค้นหาชื่อรอบทุน หรือปีการศึกษา..."
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md"
              title="ล้างข้อความค้นหา"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </Card>

      {/* 4. Error Alert with Retry */}
      {error && (
        <Alert variant="destructive" title="ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
            <p className="text-xs text-destructive/90">{error}</p>
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

      {/* 5. Main Scholarship Rounds Table (Desktop Table + Mobile Cards) */}
      <Card className="overflow-hidden w-full min-h-[460px] flex flex-col justify-between shadow-xs">
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
                  statusFilter || searchTerm
                    ? 'ไม่พบข้อมูลที่ตรงกับตัวกรองปัจจุบัน กรุณาลองค้นหาด้วยคำอื่น หรือกดล้างตัวกรอง'
                    : 'ยังไม่มีรอบทุนในระบบ กรุณาสร้างรอบทุนในหน้ารอบทุนการศึกษา'
                }
              >
                {(statusFilter || searchTerm) && (
                  <Button variant="secondary" onClick={handleClearFilter}>
                    ล้างตัวกรองทั้งหมด
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
                        <div className="text-xs text-primary font-medium mt-0.5">
                          {round.scholarshipTypeName || 'ทุนการศึกษาทั่วไป'}
                        </div>
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
                    </div>

                    <div className="pt-1 flex items-center gap-2">
                      <Link
                        href={`/admin/evaluation-results/${round.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-primary py-2.5 px-3 rounded-xl bg-primary/10 hover:bg-primary hover:text-primary-foreground transition shadow-2xs"
                      >
                        <span>ดูผลคะแนนและอันดับ</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Desktop View: Full Data Table (>= md) */}
        <div className="hidden md:block overflow-x-auto flex-1">
          <Table className="table-fixed min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/5">ชื่อรอบทุนการศึกษา</TableHead>
                <TableHead className="w-1/5 text-center">ปี/ภาคเรียน</TableHead>
                <TableHead className="w-1/5 text-center">ผู้สมัคร</TableHead>
                <TableHead className="w-1/5 text-center">สถานะ</TableHead>
                <TableHead className="w-1/5 text-center">ดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-24 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
                    <p className="mt-4 text-sm text-muted-foreground animate-pulse">กำลังโหลดรายการรอบทุน...</p>
                  </TableCell>
                </TableRow>
              ) : rounds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 px-4 text-center">
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
                          statusFilter || searchTerm
                            ? 'ไม่พบข้อมูลที่ตรงกับตัวกรองปัจจุบัน กรุณาลองค้นหาด้วยคำอื่น หรือกดล้างตัวกรอง'
                            : 'ยังไม่มีรอบทุนในระบบ กรุณาสร้างรอบทุนในหน้ารอบทุนการศึกษา'
                        }
                      >
                        {(statusFilter || searchTerm) && (
                          <Button variant="secondary" onClick={handleClearFilter}>
                            ล้างตัวกรองทั้งหมด
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
                          <span>{round.scholarshipTypeName || 'ทุนการศึกษาทั่วไป'}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Year & Semester */}
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

                    {/* Status */}
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <RoundStageIndicator status={round.status} />
                      </div>
                    </TableCell>

                    {/* Action Button */}
                    <TableCell className="text-center">
                      <Link href={`/admin/evaluation-results/${round.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-w-[130px] justify-center whitespace-nowrap bg-primary/5 text-primary border-primary/20 hover:bg-primary hover:text-white hover:border-transparent font-medium shrink-0 text-xs px-2.5"
                          rightIcon={<ArrowRight className="h-3 w-3 shrink-0" />}
                        >
                          ดูผลคะแนนและอันดับ
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-border/80 flex flex-col sm:flex-row justify-between items-center gap-3 bg-muted/20">
            <span className="text-xs text-muted-foreground">
              แสดง {rounds.length} จาก {meta.total} รอบทุนการศึกษา
            </span>
            <Pagination
              currentPage={meta.page}
              totalPages={meta.totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
