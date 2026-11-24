'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CriteriaDetail } from '@/types/criteria';
import { fetchCriteriaList } from '@/services/criteria.service';
import {
  PageHeader,
  Pagination,
  Button,
  Input,
  EmptyState,
  Alert,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  RoundBadges,
} from '@/components/ui';
import { CriteriaStatusFilterTabs } from '@/components/criteria/criteria-status-filter-tabs';
import { CriteriaStageIndicator } from '@/components/criteria/criteria-stage-indicator';
import { DeleteCriteriaModal } from '@/components/criteria/delete-criteria-modal';
import {
  FileCheck2,
  Plus,
  Search,
  Edit3,
  Eye,
  CheckCircle2,
  Trash2,
  Layers,
  ArrowRight,
  X,
  RefreshCw,
} from 'lucide-react';
import { useDebounce } from '@/lib/use-debounce';

export default function EvaluationCriteriaPage() {
  const [criteriaList, setCriteriaList] = useState<CriteriaDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deletingCriteria, setDeletingCriteria] = useState<CriteriaDetail | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [statusCounts, setStatusCounts] = useState({
    total: 0,
    unlocked: 0,
    locked: 0,
  });

  const loadCriteria = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchCriteriaList({
        page,
        limit: 10,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter || undefined,
      });

      setCriteriaList(res.data);
      if (res.meta) {
        setMeta({
          page: res.meta.page,
          limit: res.meta.limit,
          total: res.meta.total,
          totalPages: res.meta.totalPages,
        });
        if (res.meta.statusCounts) {
          setStatusCounts(res.meta.statusCounts);
        } else if (!statusFilter && !debouncedSearch.trim()) {
          setStatusCounts({
            total: res.meta.total ?? res.data.length,
            unlocked: res.data.filter((c) => !c.isLocked).length,
            locked: res.data.filter((c) => c.isLocked).length,
          });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูลชุดเกณฑ์';
      setError(msg);
      setCriteriaList([]);
      console.warn('API connection:', msg);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    void loadCriteria();
  }, [loadCriteria]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void loadCriteria();
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
        title="เกณฑ์การประเมินทุน"
        action={
          <Link href="/admin/evaluation-criteria/create">
            <Button leftIcon={<Plus className="h-4 w-4" />}>
              สร้างชุดเกณฑ์ใหม่
            </Button>
          </Link>
        }
      />

      {/* Filter and Search Bar with Segmented Tabs */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-3 shadow-xs">
        {/* Segmented Status Tabs */}
        <CriteriaStatusFilterTabs
          currentStatus={statusFilter}
          onSelectStatus={(status) => {
            setStatusFilter(status);
            setPage(1);
          }}
          counts={statusCounts}
        />

        {/* Search Input with Clear Button */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md w-full">
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="ค้นหาชื่อชุดเกณฑ์ หรือหัวข้อเกณฑ์ย่อย..."
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md cursor-pointer"
              title="ล้างข้อความค้นหา"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>
      </div>

      {/* Error Alert with Retry */}
      {error && (
        <Alert variant="destructive" title="ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
            <p className="text-xs text-destructive/90">{error}</p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void loadCriteria()}
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
              <p className="mt-4 text-sm text-muted-foreground animate-pulse">กำลังโหลดข้อมูลชุดเกณฑ์...</p>
            </div>
          ) : criteriaList.length === 0 ? (
            <div className="p-8 text-center">
              <EmptyState
                icon={FileCheck2}
                title={
                  statusFilter || searchTerm
                    ? 'ไม่พบชุดเกณฑ์ตามเงื่อนไข'
                    : 'ยังไม่มีชุดเกณฑ์การประเมิน'
                }
                description={
                  statusFilter || searchTerm
                    ? 'ไม่พบข้อมูลที่ตรงกับตัวกรองปัจจุบัน กรุณาลองค้นหาด้วยคำอื่น หรือกดล้างตัวกรอง'
                    : 'เริ่มต้นสร้างชุดเกณฑ์การประเมินชุดแรกเพื่อนำไปผูกกับรอบทุนการศึกษา'
                }
              >
                {statusFilter || searchTerm ? (
                  <Button variant="secondary" onClick={handleClearFilter}>
                    ล้างตัวกรองทั้งหมด
                  </Button>
                ) : (
                  <Link href="/admin/evaluation-criteria/create">
                    <Button leftIcon={<Plus className="h-4 w-4" />}>
                      สร้างชุดเกณฑ์ชุดแรก
                    </Button>
                  </Link>
                )}
              </EmptyState>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {criteriaList.map((criteria) => (
                <div key={criteria.id} className="p-4 space-y-3 hover:bg-muted/10 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-foreground text-base leading-snug">
                        {criteria.name}
                      </h4>
                      {criteria.createdAt && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>สร้างเมื่อ {new Date(criteria.createdAt).toLocaleDateString('th-TH')}</span>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      <CriteriaStageIndicator isLocked={criteria.isLocked} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
                    <div>
                      <span className="block text-xs text-muted-foreground">คะแนนเต็ม</span>
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        {criteria.totalScore} คะแนน
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-muted-foreground">เกณฑ์ย่อย</span>
                      <span className="font-mono font-bold text-foreground flex items-center gap-1">
                        <Layers className="h-3 w-3 text-primary" />
                        {criteria.subCriteria.length} ข้อ
                      </span>
                    </div>
                    {criteria.usedByRounds && criteria.usedByRounds.length > 0 && (
                      <div className="col-span-2 border-t border-border/40 pt-1.5 mt-0.5">
                        <span className="block text-xs text-muted-foreground mb-0.5">รอบทุนที่นำไปใช้</span>
                        <RoundBadges rounds={criteria.usedByRounds} compact={true} maxVisible={2} />
                      </div>
                    )}
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <Link
                      href={`/admin/evaluation-criteria/${criteria.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-primary py-2.5 px-3 rounded-xl bg-primary/10 hover:bg-primary hover:text-primary-foreground transition shadow-2xs"
                    >
                      {criteria.isLocked ? (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          <span>ดูรายละเอียด</span>
                        </>
                      ) : (
                        <>
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>แก้ไขเกณฑ์</span>
                        </>
                      )}
                      <ArrowRight className="h-3 w-3" />
                    </Link>

                    {!criteria.isLocked ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingCriteria(criteria)}
                        className="h-9 w-9 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl border border-rose-200/60 dark:border-rose-900/40 shrink-0"
                        title="ลบชุดเกณฑ์นี้"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled
                        className="h-9 w-9 p-0 text-muted-foreground/35 bg-muted/20 border border-border/40 rounded-xl shrink-0 cursor-not-allowed"
                        title="ไม่สามารถลบชุดเกณฑ์ที่นำไปใช้ในรอบทุนที่เปิดรับประเมินหรือปิดรอบแล้วได้"
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
          <Table className="table-fixed min-w-[850px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/5">ชื่อชุดเกณฑ์</TableHead>
                <TableHead className="w-1/5 text-center">คะแนนเต็ม</TableHead>
                <TableHead className="w-1/5 text-center">จำนวนเกณฑ์ย่อย</TableHead>
                <TableHead className="w-1/5 text-center">สถานะการแก้ไข</TableHead>
                <TableHead className="w-1/5 text-center">ดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-24 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
                    <p className="mt-4 text-sm text-muted-foreground animate-pulse">กำลังโหลดข้อมูลชุดเกณฑ์...</p>
                  </TableCell>
                </TableRow>
              ) : criteriaList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 px-4 text-center">
                    <div className="max-w-md mx-auto">
                      <EmptyState
                        icon={FileCheck2}
                        title={
                          statusFilter || searchTerm
                            ? 'ไม่พบชุดเกณฑ์ตามเงื่อนไข'
                            : 'ยังไม่มีชุดเกณฑ์การประเมิน'
                        }
                        description={
                          statusFilter || searchTerm
                            ? 'ไม่พบข้อมูลที่ตรงกับตัวกรองปัจจุบัน กรุณาลองค้นหาด้วยคำอื่น หรือกดล้างตัวกรอง'
                            : 'เริ่มต้นสร้างชุดเกณฑ์การประเมินชุดแรกเพื่อนำไปผูกกับรอบทุนการศึกษา'
                        }
                      >
                        {statusFilter || searchTerm ? (
                          <Button variant="secondary" onClick={handleClearFilter}>
                            ล้างตัวกรองทั้งหมด
                          </Button>
                        ) : (
                          <Link href="/admin/evaluation-criteria/create">
                            <Button leftIcon={<Plus className="h-4 w-4" />}>
                              สร้างชุดเกณฑ์ชุดแรก
                            </Button>
                          </Link>
                        )}
                      </EmptyState>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                criteriaList.map((criteria) => (
                  <TableRow key={criteria.id} className="group">
                    {/* 1. ชื่อชุดเกณฑ์ (20% - font-bold text-sm + Date) */}
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground group-hover:text-primary transition-colors text-sm">
                            {criteria.name}
                          </span>
                        </div>
                        {criteria.createdAt && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>สร้างเมื่อ {new Date(criteria.createdAt).toLocaleDateString('th-TH')}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* 2. คะแนนเต็ม (20% - font-mono bold xs) */}
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40 shadow-2xs">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {criteria.totalScore} คะแนน
                      </span>
                    </TableCell>

                    {/* 3. จำนวนเกณฑ์ย่อย (20% - font-mono bold xs) */}
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-foreground px-2.5 py-1 rounded-lg bg-muted/60 border border-border/40">
                        <Layers className="h-3.5 w-3.5 text-primary" />
                        {criteria.subCriteria.length} ข้อ
                      </span>
                    </TableCell>

                    {/* 4. สถานะการแก้ไข (20% - CriteriaStageIndicator เหมือน round) */}
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <CriteriaStageIndicator isLocked={criteria.isLocked} />
                      </div>
                    </TableCell>

                    {/* 5. ปุ่มดำเนินการ (20% - ปุ่มดู/แก้ไข + ปุ่มถังขยะ) */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link href={`/admin/evaluation-criteria/${criteria.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-w-[105px] justify-center whitespace-nowrap bg-primary/5 text-primary border-primary/20 hover:bg-primary hover:text-white hover:border-transparent font-medium shrink-0 text-xs px-2.5"
                            leftIcon={
                              criteria.isLocked ? (
                                <Eye className="h-3.5 w-3.5 shrink-0" />
                              ) : (
                                <Edit3 className="h-3.5 w-3.5 shrink-0" />
                              )
                            }
                            rightIcon={<ArrowRight className="h-3 w-3 shrink-0" />}
                          >
                            {criteria.isLocked ? 'ดูรายละเอียด' : 'แก้ไขเกณฑ์'}
                          </Button>
                        </Link>

                        {!criteria.isLocked ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingCriteria(criteria)}
                            className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl border border-rose-200/60 dark:border-rose-900/40 shrink-0"
                            title="ลบชุดเกณฑ์นี้"
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
                            title="ไม่สามารถลบชุดเกณฑ์ที่นำไปใช้ในรอบทุนที่เปิดรับประเมินหรือปิดรอบแล้วได้"
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

      {/* Delete Criteria Confirmation Modal */}
      {deletingCriteria && (
        <DeleteCriteriaModal
          isOpen={!!deletingCriteria}
          criteriaId={deletingCriteria.id}
          criteriaName={deletingCriteria.name}
          subCriteriaCount={deletingCriteria.subCriteria?.length || 0}
          draftRoundsCount={
            deletingCriteria.usedByRounds?.filter((r) => r.status === 'DRAFT').length || 0
          }
          onClose={() => setDeletingCriteria(null)}
          onSuccess={() => void loadCriteria()}
        />
      )}
    </div>
  );
}
