'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Search,
  FileSpreadsheet,
  History,
  RefreshCw,
  ArrowLeft,
  Sliders,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  PageHeader,
  StatusBadge,
  Pagination,
  Select,
  Button,
  Input,
  Alert,
  EmptyState,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui';
import { RoundStageIndicator } from '@/components/rounds/round-stage-indicator';
import { fetchRoundById } from '@/services/rounds.service';
import { fetchApplicants } from '@/services/applicants.service';
import type { ScholarshipRoundDetail } from '@/types/rounds';
import type { ApplicantListItem } from '@/types/applicants';
import { ImportApplicantModal } from '@/components/applicants/import-modal';
import { ImportHistoryModal } from '@/components/applicants/import-history-modal';
import { ApplicantHistoryModal } from '@/components/applicants/applicant-history-modal';
import { useDebounce } from '@/lib/use-debounce';

export default function RoundApplicantsDetailPage() {
  const params = useParams();
  const roundId = Number(params?.id);

  // Round Context State
  const [round, setRound] = useState<ScholarshipRoundDetail | null>(null);
  const [loadingRound, setLoadingRound] = useState(true);

  // Applicants State
  const [applicants, setApplicants] = useState<ApplicantListItem[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(true);
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

  // Modals State
  const [showImportModal, setShowImportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyStudentCode, setHistoryStudentCode] = useState<string | null>(null);
  const [showStudentHistoryModal, setShowStudentHistoryModal] = useState(false);

  // 1. Load Round Detail
  const loadRound = useCallback(async () => {
    if (!roundId || isNaN(roundId)) return;
    try {
      setLoadingRound(true);
      const res = await fetchRoundById(roundId);
      setRound(res.data);
    } catch (err: unknown) {
      console.warn('Failed to load round details:', err);
    } finally {
      setLoadingRound(false);
    }
  }, [roundId]);

  useEffect(() => {
    void loadRound();
  }, [loadRound]);

  // 2. Load Applicants List
  const loadApplicants = useCallback(async () => {
    if (!roundId || isNaN(roundId)) return;
    try {
      setLoadingApplicants(true);
      setError(null);
      const res = await fetchApplicants(roundId, {
        page,
        limit: 20,
        search: debouncedSearch.trim() || undefined,
        faculty: facultyFilter || undefined,
      });
      setApplicants(res.data || []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้สมัคร');
      setApplicants([]);
    } finally {
      setLoadingApplicants(false);
    }
  }, [roundId, page, debouncedSearch, facultyFilter]);

  useEffect(() => {
    void loadApplicants();
  }, [loadApplicants]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void loadApplicants();
  };

  const handleOpenStudentHistory = (studentCode: string) => {
    setHistoryStudentCode(studentCode);
    setShowStudentHistoryModal(true);
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

  const isRoundDraft = round?.status === 'DRAFT';

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      {/* 1. Top Navigation Bar with Back Link and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-5">
        <Link
          href="/admin/applicants"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition hover:-translate-x-0.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>กลับสู่หน้ารายการรอบทุน</span>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowHistoryModal(true)}
            leftIcon={<History className="h-3.5 w-3.5 text-muted-foreground" />}
          >
            ประวัตินำเข้า
          </Button>

          {isRoundDraft ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setShowImportModal(true)}
              leftIcon={<FileSpreadsheet className="h-3.5 w-3.5" />}
            >
              {meta.total > 0 ? 'นำเข้าข้อมูลใหม่ (แทนที่)' : 'นำเข้าไฟล์ Excel'}
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground/70 bg-muted/30 border border-border/40 rounded-xl cursor-not-allowed">
              <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span>ไม่สามารถนำเข้าได้ (รอบ{round?.status === 'OPEN' ? 'เปิดแล้ว' : 'ปิดแล้ว'})</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Hero Card: ข้อมูลทั่วไปของรอบทุนการศึกษา (Consistent SEMS Standard) */}
      <Card className="p-6 space-y-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            ข้อมูลรอบทุนการศึกษา
          </h3>
          <div className="flex items-center gap-2">
            {round?.status === 'OPEN' ? (
              <StatusBadge variant="open" label="เปิดรับสมัคร (Open)" />
            ) : round?.status === 'CLOSED' ? (
              <StatusBadge variant="closed" label="ปิดรอบแล้ว (Closed)" />
            ) : (
              <StatusBadge variant="draft" label="แบบร่าง (Draft)" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium block">ชื่อรอบทุน</span>
            <span className="font-bold text-foreground text-sm mt-1 block">
              {loadingRound ? 'กำลังโหลด...' : round?.name || `รอบทุน #${roundId}`}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium block">ปีการศึกษา / ภาคเรียน</span>
            <span className="font-bold text-foreground text-sm mt-1 block">
              {round?.academicYear ? `ปีการศึกษา ${round.academicYear} (ภาคเรียนที่ ${round.semester})` : '-'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium block">ประเภททุนการศึกษา</span>
            <span className="font-bold text-foreground text-sm mt-1 block">
              {round?.scholarshipType?.name || 'ทุนการศึกษาทั่วไป'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium block">ชุดเกณฑ์การประเมินที่ใช้</span>
            <span className="font-bold text-foreground text-sm mt-1 block">
              {round?.criteria?.name || 'เกณฑ์มาตรฐาน (100 คะแนน)'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium block">จำนวนผู้สมัครในรอบ</span>
            <span className="font-bold font-mono text-foreground text-sm mt-1 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-blue-600" />
              {meta.total} คน
            </span>
          </div>

          <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium block">สถานะกระบวนการ</span>
            <div className="mt-1">
              <RoundStageIndicator status={round?.status || 'DRAFT'} />
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Search and Faculty Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-3 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อ, สกุล, รหัสนักศึกษา..."
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {facultyOptions.length > 0 && (
            <div className="w-full sm:w-48">
              <Select
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
            >
              ล้างตัวกรอง
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            onClick={() => { setPage(1); void loadApplicants(); }}
          >
            ค้นหา
          </Button>
        </div>
      </div>

      {/* 4. Error Banner */}
      {error && (
        <Alert variant="destructive">
          <div className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void loadApplicants()}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              ลองใหม่อีกครั้ง
            </Button>
          </div>
        </Alert>
      )}

      {/* 5. Main Applicants Card Container */}
      <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
        {loadingApplicants ? (
          <div className="p-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
            <p className="mt-4 text-sm text-muted-foreground animate-pulse">กำลังโหลดข้อมูลผู้สมัคร...</p>
          </div>
        ) : applicants.length === 0 ? (
          <div className="p-8 sm:p-12">
            <EmptyState
              icon={searchTerm || facultyFilter ? Search : Users}
              title={
                searchTerm || facultyFilter
                  ? 'ไม่พบข้อมูลผู้สมัครที่ค้นหา'
                  : 'ยังไม่มีข้อมูลผู้สมัครในรอบนี้'
              }
              description={
                searchTerm || facultyFilter
                  ? 'ลองปรับคำค้นหาหรือตัวกรองคณะใหม่อีกครั้ง'
                  : isRoundDraft
                  ? 'เริ่มต้นนำเข้าข้อมูลผู้สมัครจากไฟล์ Excel (.xlsx) เพื่อเตรียมความพร้อมสำหรับเปิดรอบ'
                  : 'รอบนี้ยังไม่มีข้อมูลผู้สมัครที่บันทึกในระบบ'
              }
            >
              {searchTerm || facultyFilter ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleClearFilters}
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                >
                  ล้างตัวกรองทั้งหมด
                </Button>
              ) : isRoundDraft ? (
                <Button
                  size="sm"
                  onClick={() => setShowImportModal(true)}
                  leftIcon={<FileSpreadsheet className="h-4 w-4" />}
                >
                  นำเข้าไฟล์ Excel ตอนนี้
                </Button>
              ) : null}
            </EmptyState>
          </div>
        ) : (
          <>
            {/* Mobile View: Responsive Cards (< md) */}
            <div className="block md:hidden divide-y divide-border/60">
              {applicants.map((app) => (
                <div key={app.id} className="p-4 space-y-3 hover:bg-muted/10 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-mono font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                        #{app.legacySeq ?? app.id}
                      </span>
                      <h4 className="mt-1 font-bold text-foreground text-base leading-snug">
                        {app.titlePrefix}{app.firstName} {app.lastName}
                      </h4>
                      <p className="font-mono text-xs text-muted-foreground mt-0.5">
                        {app.studentCode}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground/80 block">GPA</span>
                      <span className="font-mono font-bold text-sm text-foreground">
                        {app.gpa.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
                    <div>
                      <span className="block text-xs text-muted-foreground/80">คณะ</span>
                      <span className="font-medium text-foreground truncate block">{app.faculty}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-muted-foreground/80">สาขาวิชา</span>
                      <span className="font-medium text-foreground truncate block">{app.major}</span>
                    </div>
                    <div className="col-span-2 border-t border-border/40 pt-1.5 mt-0.5 flex justify-between items-center">
                      <span className="text-xs text-muted-foreground/80">ชั้นปีการศึกษา</span>
                      <span className="font-semibold text-foreground">ปี <span className="font-mono">{app.studyYear}</span></span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenStudentHistory(app.studentCode)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition cursor-pointer"
                    >
                      <History className="h-3.5 w-3.5" />
                      ดูประวัติข้ามรอบ
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Main Table (>= md) */}
            <div className="hidden md:block overflow-x-auto flex-1">
              <Table className="table-fixed min-w-[960px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center whitespace-nowrap">
                      ลำดับ
                    </TableHead>
                    <TableHead className="w-36 whitespace-nowrap">
                      รหัสนักศึกษา
                    </TableHead>
                    <TableHead className="w-[24%] min-w-[170px] whitespace-nowrap">
                      ชื่อ - สกุล
                    </TableHead>
                    <TableHead className="w-[24%] min-w-[190px] whitespace-nowrap">
                      คณะ / สาขาวิชา
                    </TableHead>
                    <TableHead className="w-20 text-center whitespace-nowrap">
                      ชั้นปี
                    </TableHead>
                    <TableHead className="w-24 text-center whitespace-nowrap">
                      GPA
                    </TableHead>
                    <TableHead className="w-44 text-center whitespace-nowrap">
                      ประวัติข้ามรอบ
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applicants.map((app) => (
                    <TableRow key={app.id} className="hover:bg-muted/30 transition-colors group">
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        {app.legacySeq ?? '-'}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-foreground text-xs whitespace-nowrap">
                        {app.studentCode}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        <span className="block truncate">
                          {app.titlePrefix}{app.firstName} {app.lastName}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground block truncate">{app.faculty}</span>
                        <span className="text-muted-foreground/80 block truncate">{app.major}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-muted text-foreground border border-border/60">
                          ปี {app.studyYear}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-foreground text-sm">
                        {app.gpa.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="bg-primary/5 text-primary border-primary/20 hover:bg-primary hover:text-white transition-all shadow-2xs"
                          onClick={() => handleOpenStudentHistory(app.studentCode)}
                          leftIcon={<History className="h-3.5 w-3.5" />}
                        >
                          ดูประวัติข้ามรอบ
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
      {round && (
        <>
          <ImportApplicantModal
            roundId={roundId}
            roundName={round.name}
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onSuccess={() => {
              void loadApplicants();
              void loadRound();
            }}
          />
          <ImportHistoryModal
            roundId={roundId}
            roundName={round.name}
            isOpen={showHistoryModal}
            onClose={() => setShowHistoryModal(false)}
          />
          <ApplicantHistoryModal
            isOpen={showStudentHistoryModal}
            onClose={() => setShowStudentHistoryModal(false)}
            studentCode={historyStudentCode}
          />
        </>
      )}
    </div>
  );
}
