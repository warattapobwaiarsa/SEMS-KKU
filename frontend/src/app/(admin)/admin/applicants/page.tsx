'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  FileSpreadsheet, 
  History, 
  RefreshCw, 
  Filter, 
  Calendar,
  ChevronDown,
  GraduationCap,
  Sparkles,
  Award,
  AlertCircle
} from 'lucide-react';
import { PageHeader, StatusBadge, Pagination, Select } from '@/components/ui';
import { fetchRoundsList } from '@/services/rounds.service';
import { fetchApplicants } from '@/services/applicants.service';
import { ScholarshipRoundListItem } from '@/types/rounds';
import { ApplicantListItem } from '@/types/applicants';
import { ImportApplicantModal } from '@/components/applicants/import-modal';
import { ImportHistoryModal } from '@/components/applicants/import-history-modal';
import { useDebounce } from '@/lib/use-debounce';

export default function ApplicantsPage() {
  const [rounds, setRounds] = useState<ScholarshipRoundListItem[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [selectedRound, setSelectedRound] = useState<ScholarshipRoundListItem | null>(null);

  const [applicants, setApplicants] = useState<ApplicantListItem[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [facultyFilter, setFacultyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // Modals
  const [showImportModal, setShowImportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Load rounds on mount
  useEffect(() => {
    let isMounted = true;
    setLoadingRounds(true);
    fetchRoundsList({ limit: 50 })
      .then((res) => {
        if (!isMounted) return;
        const list = res.data || [];
        setRounds(list);
        if (list.length > 0) {
          setSelectedRoundId(list[0].id);
          setSelectedRound(list[0]);
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดรายการรอบทุนได้');
      })
      .finally(() => {
        if (isMounted) setLoadingRounds(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update selectedRound object when id changes
  useEffect(() => {
    if (selectedRoundId) {
      const found = rounds.find((r) => r.id === selectedRoundId);
      setSelectedRound(found || null);
      setPage(1);
    }
  }, [selectedRoundId, rounds]);

  // Load applicants
  const loadApplicants = useCallback(async () => {
    if (!selectedRoundId) return;
    try {
      setLoadingApplicants(true);
      setError(null);
      const res = await fetchApplicants(selectedRoundId, {
        page,
        limit: 20,
        search: debouncedSearch.trim() || undefined,
        faculty: facultyFilter || undefined,
      });
      setApplicants(res.data);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้สมัคร');
      setApplicants([]);
    } finally {
      setLoadingApplicants(false);
    }
  }, [selectedRoundId, page, debouncedSearch, facultyFilter]);

  useEffect(() => {
    void loadApplicants();
  }, [loadApplicants]);

  const handleRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedRoundId(id);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void loadApplicants();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFacultyFilter('');
    setPage(1);
  };

  // Derive unique faculties from applicant list for filter dropdown
  const facultyOptions = useMemo(() => {
    const set = new Set<string>();
    applicants.forEach((a) => {
      if (a.faculty) set.add(a.faculty);
    });
    return Array.from(set);
  }, [applicants]);

  const isRoundDraft = selectedRound?.status === 'DRAFT';

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* Standard SEMS Page Header */}
      <PageHeader
        moduleBadge="การจัดการผู้สมัครทุน"
        moduleBadgeIcon={Users}
        title="ผู้สมัครทุนการศึกษา"
        description="ตรวจสอบรายชื่อ ค้นหา และนำเข้าข้อมูลผู้สมัครทุนการศึกษาจากไฟล์ Excel"
        action={
          isRoundDraft ? (
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              นำเข้าไฟล์ Excel
            </button>
          ) : undefined
        }
      />

      {/* Top Context & Round Selector Bar (A11 Wireframe Spec) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-card border border-border/80 rounded-2xl shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2 shrink-0">
            <Calendar className="h-4 w-4 text-primary" />
            <span>รอบทุนการศึกษา:</span>
          </label>

          {loadingRounds ? (
            <span className="text-sm text-muted-foreground animate-pulse">กำลังโหลดรอบทุน...</span>
          ) : rounds.length === 0 ? (
            <span className="text-sm text-muted-foreground">ยังไม่มีรอบทุนในระบบ</span>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-64 sm:w-72">
                <Select
                  value={selectedRoundId || ''}
                  onChange={handleRoundChange}
                >
                  {rounds.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (ปี {r.academicYear}/{r.semester})
                    </option>
                  ))}
                </Select>
              </div>

              {selectedRound && (
                <StatusBadge
                  variant={
                    selectedRound.status === 'OPEN'
                      ? 'open'
                      : selectedRound.status === 'CLOSED'
                      ? 'closed'
                      : 'draft'
                  }
                  label={
                    selectedRound.status === 'OPEN'
                      ? 'เปิดรับสมัคร (Open)'
                      : selectedRound.status === 'CLOSED'
                      ? 'ปิดรอบแล้ว (Closed)'
                      : 'แบบร่าง (Draft)'
                  }
                />
              )}

              {selectedRound && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground border border-border/60 font-mono">
                  ผู้สมัครทั้งหมด {meta.total} คน
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons in Context Bar */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedRoundId && (
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted border border-border/60 rounded-xl transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <History className="h-3.5 w-3.5" />
              <span>ประวัตินำเข้า</span>
            </button>
          )}

          {isRoundDraft ? (
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl shadow-xs transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>{meta.total > 0 ? 'นำเข้าข้อมูลใหม่ (แทนที่)' : 'นำเข้าไฟล์ Excel'}</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-muted-foreground/70 bg-muted/30 border border-border/40 rounded-xl cursor-not-allowed">
              <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span>ไม่สามารถนำเข้าได้ (รอบ{selectedRound?.status === 'OPEN' ? 'เปิดแล้ว' : 'ปิดแล้ว'})</span>
            </span>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-3 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อ, สกุล, รหัสนักศึกษา..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {facultyOptions.length > 0 && (
            <div className="w-full sm:w-48">
              <Select
                icon={Filter}
                value={facultyFilter}
                onChange={(e) => {
                  setFacultyFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">ทุกคณะ</option>
                {facultyOptions.map((fac) => (
                  <option key={fac} value={fac}>{fac}</option>
                ))}
              </Select>
            </div>
          )}

          {(searchTerm || facultyFilter) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition cursor-pointer shrink-0"
            >
              ล้างตัวกรอง
            </button>
          )}

          <button
            type="button"
            onClick={() => { setPage(1); void loadApplicants(); }}
            className="px-5 py-2.5 text-sm font-medium bg-muted hover:bg-muted/80 text-foreground rounded-xl transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer shrink-0"
          >
            ค้นหา
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3 text-destructive text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Applicants Card Container */}
      <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
        {loadingApplicants ? (
          <div className="p-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
            <p className="mt-4 text-sm text-muted-foreground animate-pulse">กำลังโหลดข้อมูลผู้สมัคร...</p>
          </div>
        ) : applicants.length === 0 ? (
          /* Empty States (A1 / A14) */
          <div className="p-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground border border-border/60">
              {searchTerm || facultyFilter ? (
                <Search className="h-7 w-7 text-muted-foreground" />
              ) : (
                <Users className="h-7 w-7 text-muted-foreground" />
              )}
            </div>

            <h3 className="mt-4 text-lg font-semibold text-foreground">
              {searchTerm || facultyFilter
                ? 'ไม่พบข้อมูลผู้สมัครที่ค้นหา'
                : 'ยังไม่มีข้อมูลผู้สมัครในรอบนี้'}
            </h3>

            <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
              {searchTerm || facultyFilter
                ? 'ลองปรับคำค้นหาหรือตัวกรองคณะใหม่อีกครั้ง'
                : isRoundDraft
                ? 'เริ่มต้นนำเข้าข้อมูลผู้สมัครจากไฟล์ Excel (.xlsx) เพื่อเตรียมความพร้อมสำหรับเปิดรอบ'
                : 'รอบนี้ยังไม่มีข้อมูลผู้สมัครที่บันทึกในระบบ'}
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              {searchTerm || facultyFilter ? (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-2 rounded-xl bg-muted px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/80 shadow-xs transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                  ล้างตัวกรองทั้งหมด
                </button>
              ) : isRoundDraft ? (
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  นำเข้าไฟล์ Excel ตอนนี้
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile View: Responsive Cards (< md) */}
            <div className="block md:hidden divide-y divide-border/60">
              {applicants.map((app) => (
                <div key={app.id} className="p-4 space-y-3 hover:bg-muted/10 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                        #{app.legacySeq ?? app.id}
                      </span>
                      <h4 className="mt-1 font-semibold text-foreground text-sm leading-snug">
                        {app.titlePrefix}{app.firstName} {app.lastName}
                      </h4>
                      <p className="font-mono text-xs text-muted-foreground mt-0.5">
                        {app.studentCode}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground/80 block">GPA</span>
                      <span className="font-mono font-bold text-sm text-foreground">
                        {app.gpa.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
                    <div>
                      <span className="block text-[10px] text-muted-foreground/80">คณะ</span>
                      <span className="font-medium text-foreground truncate block">{app.faculty}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground/80">สาขาวิชา</span>
                      <span className="font-medium text-foreground truncate block">{app.major}</span>
                    </div>
                    <div className="col-span-2 border-t border-border/40 pt-1.5 mt-0.5 flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground/80">ชั้นปีการศึกษา</span>
                      <span className="font-mono font-semibold text-foreground">ปี {app.studyYear}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Main Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-b border-border/80">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider w-20 text-center">
                      ลำดับ
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider w-40">
                      รหัสนักศึกษา
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      ชื่อ - สกุล
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      คณะ / สาขาวิชา
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center w-24">
                      ชั้นปี
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center w-28">
                      GPA
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {applicants.map((app) => (
                    <tr key={app.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-6 py-4 text-center font-mono text-xs text-muted-foreground">
                        {app.legacySeq ?? '-'}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-foreground text-xs">
                        {app.studentCode}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {app.titlePrefix}{app.firstName} {app.lastName}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground block">{app.faculty}</span>
                        <span className="text-muted-foreground/80 block">{app.major}</span>
                      </td>
                      <td className="px-6 py-4 text-center text-xs font-mono font-semibold text-foreground">
                        ปี {app.studyYear}
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-foreground text-sm">
                        {app.gpa.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Standard SEMS Pagination Bar */}
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={meta.limit}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </>
        )}
      </div>

      {/* Modals */}
      {selectedRoundId && selectedRound && (
        <>
          <ImportApplicantModal
            roundId={selectedRoundId}
            roundName={selectedRound.name}
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onSuccess={() => {
              void loadApplicants();
            }}
          />
          <ImportHistoryModal
            roundId={selectedRoundId}
            roundName={selectedRound.name}
            isOpen={showHistoryModal}
            onClose={() => setShowHistoryModal(false)}
          />
        </>
      )}
    </div>
  );
}
