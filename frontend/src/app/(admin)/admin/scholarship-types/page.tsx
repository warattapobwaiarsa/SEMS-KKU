'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ScholarshipTypeListItem } from '@/types/scholarship-type';
import {
  fetchScholarshipTypes,
} from '@/services/scholarship-types.service';
import {
  PageHeader,
  Pagination,
  Button,
  Input,
  Badge,
  EmptyState,
  Alert,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui';
import { DeleteScholarshipTypeModal } from '@/components/scholarship-types/delete-scholarship-type-modal';
import {
  Award,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Layers,
  Calendar,
  ArrowRight,
  Sliders,
  X,
  RefreshCw,
} from 'lucide-react';
import { useDebounce } from '@/lib/use-debounce';

export default function ScholarshipTypesPage() {
  const [types, setTypes] = useState<ScholarshipTypeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [deletingType, setDeletingType] = useState<ScholarshipTypeListItem | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchScholarshipTypes({
        page,
        limit: 10,
        search: debouncedSearch.trim() || undefined,
      });

      setTypes(res.data);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดประเภททุน';
      setError(msg);
      setTypes([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void loadData();
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      {/* Standard Page Header */}
      <PageHeader
        title="ประเภททุนการศึกษา"
        action={
          <Link href="/admin/scholarship-types/create">
            <Button leftIcon={<Plus className="h-4 w-4" />}>
              สร้างประเภททุนใหม่
            </Button>
          </Link>
        }
      />

      {/* Search Bar with Total Count */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-3 shadow-xs">
        <div className="flex items-center gap-2 px-2 text-xs font-semibold text-muted-foreground">
          <Layers className="h-4 w-4 text-primary" />
          <span>ประเภททุนทั้งหมด</span>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-bold">
            {meta.total}
          </span>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md w-full">
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="ค้นหาชื่อประเภททุน..."
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
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
        <Alert variant="destructive" title="ไม่สามารถโหลดข้อมูลประเภททุนได้">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
            <p className="text-xs text-destructive/90">{error}</p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void loadData()}
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
              <p className="mt-4 text-sm text-muted-foreground animate-pulse">กำลังโหลดรายการประเภททุน...</p>
            </div>
          ) : types.length === 0 ? (
            <div className="p-8 text-center">
              <EmptyState
                icon={Award}
                title={searchTerm ? 'ไม่พบประเภททุนที่ค้นหา' : 'ยังไม่มีประเภททุนในระบบ'}
                description={
                  searchTerm
                    ? `ไม่พบข้อมูลที่ตรงกับคำค้นหา "${searchTerm}" กรุณาลองค้นหาด้วยคำอื่น หรือกดล้างการค้นหา`
                    : 'ยังไม่มีประเภททุนในระบบ สามารถเริ่มต้นโดยการสร้างประเภททุนใหม่'
                }
              >
                {searchTerm ? (
                  <Button variant="secondary" onClick={handleClearSearch}>
                    ล้างการค้นหา
                  </Button>
                ) : (
                  <Link href="/admin/scholarship-types/create">
                    <Button leftIcon={<Plus className="h-4 w-4" />}>
                      สร้างประเภททุนใหม่
                    </Button>
                  </Link>
                )}
              </EmptyState>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {types.map((item) => (
                <div key={item.id} className="p-4 space-y-3 hover:bg-muted/10 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-foreground text-base leading-snug">
                        {item.name}
                      </h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
                    <div>
                      <span className="block text-xs text-muted-foreground">เกณฑ์เริ่มต้น</span>
                      <span className="font-medium text-foreground flex items-center gap-1">
                        <Layers className="h-3 w-3 text-primary shrink-0" />
                        <span className="truncate">{item.subCriteriaCount ?? 0} ข้อเกณฑ์</span>
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-muted-foreground">ใช้งานในรอบทุน</span>
                      <span className="font-mono font-bold text-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-primary" /> {item.roundsCount} รอบ
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <Link
                      href={`/admin/scholarship-types/${item.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-primary py-2.5 px-3 rounded-xl bg-primary/10 hover:bg-primary hover:text-primary-foreground transition shadow-2xs border-transparent"
                    >
                      <Sliders className="h-3.5 w-3.5" />
                      <span>ดูรายละเอียดและเกณฑ์</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>

                    {item.canDelete ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingType(item)}
                        className="h-9 w-9 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl border border-rose-200/60 dark:border-rose-900/40 shrink-0"
                        title="ลบประเภททุนนี้"
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
                        title="ไม่สามารถลบประเภททุนที่ผูกกับรอบการประเมินที่เปิดหรือปิดรอบแล้วได้"
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
          <Table className="table-fixed min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/4">ชื่อประเภททุน</TableHead>
                <TableHead className="w-1/4">เกณฑ์ประเมินเริ่มต้น</TableHead>
                <TableHead className="w-1/4 text-center">ใช้งานในรอบทุน</TableHead>
                <TableHead className="w-1/4 text-center">ดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-24 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
                    <p className="mt-4 text-sm text-muted-foreground animate-pulse">กำลังโหลดรายการประเภททุน...</p>
                  </TableCell>
                </TableRow>
              ) : types.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-20 px-4 text-center">
                    <div className="max-w-md mx-auto">
                      <EmptyState
                        icon={Award}
                        title={searchTerm ? 'ไม่พบประเภททุนที่ค้นหา' : 'ยังไม่มีประเภททุนในระบบ'}
                        description={
                          searchTerm
                            ? `ไม่พบข้อมูลที่ตรงกับคำค้นหา "${searchTerm}" กรุณาลองค้นหาด้วยคำอื่น หรือกดล้างการค้นหา`
                            : 'ยังไม่มีประเภททุนในระบบ สามารถเริ่มต้นโดยการสร้างประเภททุนใหม่'
                        }
                      >
                        {searchTerm ? (
                          <Button variant="secondary" onClick={handleClearSearch}>
                            ล้างการค้นหา
                          </Button>
                        ) : (
                          <Link href="/admin/scholarship-types/create">
                            <Button leftIcon={<Plus className="h-4 w-4" />}>
                              สร้างประเภททุนใหม่
                            </Button>
                          </Link>
                        )}
                      </EmptyState>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                types.map((item) => (
                  <TableRow key={item.id} className="group">
                    {/* Name */}
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground group-hover:text-primary transition-colors text-sm">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>สร้างเมื่อ {new Date(item.createdAt).toLocaleDateString('th-TH')}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Criteria */}
                    <TableCell>
                      {item.defaultCriteriaName ? (
                        <div className="flex flex-col gap-0.5 max-w-full">
                          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 min-w-0">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate block" title={item.defaultCriteriaName}>
                              {item.defaultCriteriaName}
                            </span>
                          </span>
                          {item.subCriteriaCount !== undefined && item.subCriteriaCount > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Layers className="h-3 w-3 text-primary" />
                              {item.subCriteriaCount} ข้อเกณฑ์
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md italic">
                          ยังไม่ได้ผูกเกณฑ์
                        </span>
                      )}
                    </TableCell>

                    {/* Rounds Count */}
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-foreground px-2.5 py-1 rounded-lg bg-muted/60 border border-border/40">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        {item.roundsCount} รอบ
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link href={`/admin/scholarship-types/${item.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-w-[110px] justify-center whitespace-nowrap bg-primary/5 text-primary border-primary/20 hover:bg-primary hover:text-white hover:border-transparent font-medium shrink-0 text-xs px-2.5"
                            rightIcon={<ArrowRight className="h-3 w-3 shrink-0" />}
                            leftIcon={<Sliders className="h-3.5 w-3.5 shrink-0" />}
                          >
                            <span>ดูรายละเอียด</span>
                          </Button>
                        </Link>

                        {item.canDelete ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingType(item)}
                            className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl border border-rose-200/60 dark:border-rose-900/40 shrink-0"
                            title="ลบประเภททุนนี้"
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
                            title="ไม่สามารถลบประเภททุนที่ผูกกับรอบการประเมินที่เปิดหรือปิดรอบแล้วได้"
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
        {!loading && types.length > 0 && (
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

      {/* Delete Scholarship Type Confirmation Modal */}
      {deletingType && (
        <DeleteScholarshipTypeModal
          isOpen={true}
          typeId={deletingType.id}
          typeName={deletingType.name}
          roundsCount={deletingType.roundsCount}
          onClose={() => setDeletingType(null)}
          onSuccess={() => void loadData()}
        />
      )}
    </div>
  );
}
