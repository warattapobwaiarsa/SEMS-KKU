'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Eye,
  Edit3,
  Search,
  Filter,
  Layers,
  ChevronRight,
  AlertCircle,
  FolderOpen,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { useDebounce } from '@/lib/use-debounce';
import {
  fetchEvaluatorRounds,
  fetchEvaluatorApplicants,
} from '@/services/evaluation.service';
import type { EvaluatorRound, EvaluatorApplicant } from '@/types/evaluation';
import { ApiError } from '@/lib/api-client';

export default function MyEvaluationsPage() {
  const [rounds, setRounds] = useState<EvaluatorRound[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [applicants, setApplicants] = useState<EvaluatorApplicant[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ตัวกรอง
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'DRAFT'>('ALL');

  const debouncedSearch = useDebounce(search, 300);

  // 1. โหลดรอบทุนทั้งหมดที่เปิดสำหรับ Evaluator
  useEffect(() => {
    let active = true;
    async function loadRounds() {
      setLoadingRounds(true);
      setError(null);
      try {
        const res = await fetchEvaluatorRounds({ limit: 50 });
        if (!active) return;
        setRounds(res.data);
        if (res.data.length > 0) {
          // เลือกรอบแรกที่เป็น OPEN ก่อน หรือรอบแรกสุด
          const openRound = res.data.find((r) => r.status === 'OPEN') ?? res.data[0];
          setSelectedRoundId(openRound.id);
        }
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อโหลดรายการรอบทุนได้');
        }
      } finally {
        if (active) setLoadingRounds(false);
      }
    }
    void loadRounds();
    return () => {
      active = false;
    };
  }, []);

  // 2. โหลดรายชื่อผู้สมัครของรอบที่เลือก
  const loadApplicants = useCallback(async (roundId: number) => {
    setLoadingApplicants(true);
    try {
      // ดึงรายชื่อผู้สมัครในรอบ (ดึงแบบเยอะขึ้นเพื่อแสดง portfolio)
      const res = await fetchEvaluatorApplicants(roundId, { limit: 100 });
      setApplicants(res.data);
    } catch (err) {
      console.warn('Failed to load applicants for round:', err);
      setApplicants([]);
    } finally {
      setLoadingApplicants(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRoundId !== null) {
      void Promise.resolve().then(() => loadApplicants(selectedRoundId));
    }
  }, [selectedRoundId, loadApplicants]);

  // คัดกรองเฉพาะผู้สมัครที่ฉันได้ประเมินแล้ว (SUBMITTED หรือ DRAFT)
  const evaluatedApplicants = useMemo(() => {
    return applicants.filter((app) => app.myStatus === 'SUBMITTED' || app.myStatus === 'DRAFT');
  }, [applicants]);

  // สถิติภาพรวมในรอบนี้
  const stats = useMemo(() => {
    const submittedCount = evaluatedApplicants.filter((a) => a.myStatus === 'SUBMITTED').length;
    const draftCount = evaluatedApplicants.filter((a) => a.myStatus === 'DRAFT').length;
    const totalRoundApplicants = applicants.length;
    const completionPercent =
      totalRoundApplicants > 0
        ? Math.round((submittedCount / totalRoundApplicants) * 100)
        : 0;

    return {
      submittedCount,
      draftCount,
      totalEvaluated: evaluatedApplicants.length,
      totalRoundApplicants,
      completionPercent,
    };
  }, [evaluatedApplicants, applicants]);

  // กรองตามคำค้นหาและสถานะ
  const filteredApplicants = useMemo(() => {
    return evaluatedApplicants.filter((app) => {
      // ตรวจสถานะ
      if (statusFilter !== 'ALL' && app.myStatus !== statusFilter) {
        return false;
      }
      // ตรวจคำค้นหา
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.trim().toLowerCase();
        const fullName = `${app.titlePrefix}${app.firstName} ${app.lastName}`.toLowerCase();
        const code = app.studentCode.toLowerCase();
        const faculty = app.faculty.toLowerCase();
        return fullName.includes(q) || code.includes(q) || faculty.includes(q);
      }
      return true;
    });
  }, [evaluatedApplicants, statusFilter, debouncedSearch]);

  const selectedRound = rounds.find((r) => r.id === selectedRoundId);

  return (
    <div className="flex-1 flex flex-col space-y-6">
      {/* Header */}
      <PageHeader
        title="ผลการประเมินของฉัน"
      />

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Controls Bar: Round Selector & Round Progress */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              เลือกรอบทุนการศึกษาที่ต้องการตรวจสอบ:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {loadingRounds ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>กำลังโหลดรายการรอบทุน...</span>
                </div>
              ) : rounds.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">ไม่มีรอบทุนที่เปิดให้ประเมิน</p>
              ) : (
                <select
                  value={selectedRoundId ?? ''}
                  onChange={(e) => setSelectedRoundId(Number(e.target.value))}
                  className="px-3.5 py-2 text-sm font-semibold rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition cursor-pointer max-w-md"
                >
                  {rounds.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (ปี {r.academicYear}/{r.semester}) • {r.status === 'OPEN' ? '🟢 เปิดประเมิน' : r.status === 'CLOSED' ? '🔒 ปิดรอบแล้ว' : 'ฉบับร่าง'}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {selectedRound && (
            <Link
              href={`/evaluator/rounds/${selectedRound.id}/applicants`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition shrink-0 shadow-2xs btn-interactive"
            >
              <span>ไปหน้ารายชื่อผู้สมัครรอบนี้</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
            </Link>
          )}
        </div>

        {/* Overview Stats Cards */}
        {selectedRound && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border/60">
            <div className="p-3 bg-muted/30 border border-border/50 rounded-xl">
              <span className="text-xs text-muted-foreground font-medium block">ส่งผลการประเมินแล้ว</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-600">
                  {stats.submittedCount}
                </span>
                <span className="text-xs text-muted-foreground font-mono">/ {stats.totalRoundApplicants} คน</span>
              </div>
            </div>

            <div className="p-3 bg-muted/30 border border-border/50 rounded-xl">
              <span className="text-xs text-muted-foreground font-medium block">แบบร่างที่ยังไม่ส่ง</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl sm:text-2xl font-bold font-mono text-amber-600">
                  {stats.draftCount}
                </span>
                <span className="text-xs text-muted-foreground">คน</span>
              </div>
            </div>

            <div className="p-3 bg-muted/30 border border-border/50 rounded-xl">
              <span className="text-xs text-muted-foreground font-medium block">ความคืบหน้ารอบนี้</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl sm:text-2xl font-bold font-mono text-primary">
                  {stats.completionPercent}%
                </span>
                <span className="text-xs text-muted-foreground">เสร็จสิ้น</span>
              </div>
            </div>

            <div className="p-3 bg-muted/30 border border-border/50 rounded-xl">
              <span className="text-xs text-muted-foreground font-medium block">สถานะรอบทุน</span>
              <div className="mt-1.5">
                <StatusBadge
                  label={selectedRound.status === 'OPEN' ? 'กำลังเปิดรับการประเมิน' : 'ปิดรอบแล้ว'}
                  variant={selectedRound.status === 'OPEN' ? 'success' : 'neutral'}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Table Card */}
      <div className="bg-card border border-border/80 rounded-2xl shadow-2xs overflow-hidden flex flex-col">
        {/* Table Filters Header */}
        <div className="p-4 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาด้วยชื่อ, รหัสนักศึกษา..."
              className="w-full pl-9 pr-3.5 py-1.5 text-xs sm:text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-medium mr-1 hidden md:inline">
              <Filter className="w-3.5 h-3.5 inline mr-1" />
              กรองสถานะ:
            </span>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'bg-background hover:bg-muted text-muted-foreground border border-border'
              }`}
            >
              ทั้งหมด ({evaluatedApplicants.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('SUBMITTED')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                statusFilter === 'SUBMITTED'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-background hover:bg-muted text-muted-foreground border border-border'
              }`}
            >
              ส่งแล้ว ({stats.submittedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DRAFT')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                statusFilter === 'DRAFT'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-background hover:bg-muted text-muted-foreground border border-border'
              }`}
            >
              ฉบับร่าง ({stats.draftCount})
            </button>
          </div>
        </div>

        {/* Content List */}
        {loadingApplicants ? (
          <div className="p-12 text-center text-muted-foreground space-y-3">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            <p className="text-sm">กำลังโหลดข้อมูลการประเมิน...</p>
          </div>
        ) : filteredApplicants.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-foreground">ไม่พบรายการผลการประเมิน</h4>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                {search || statusFilter !== 'ALL'
                  ? 'ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรอง'
                  : 'คุณยังไม่ได้เริ่มประเมินผู้สมัครในรอบทุนนี้ สามารถไปยังหน้ารายชื่อผู้สมัครเพื่อเริ่มทำการประเมินได้ทันที'}
              </p>
            </div>
            {selectedRound && evaluatedApplicants.length === 0 && (
              <Link
                href={`/evaluator/rounds/${selectedRound.id}/applicants`}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition shadow-2xs btn-interactive"
              >
                <span>เริ่มประเมินผู้สมัครรอบนี้</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold text-xs">
                  <th className="py-3 px-4">รหัสนักศึกษา</th>
                  <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                  <th className="py-3 px-4 hidden md:table-cell">คณะ / สาขาวิชา</th>
                  <th className="py-3 px-4 text-center hidden sm:table-cell">ชั้นปี</th>
                  <th className="py-3 px-4 text-center hidden sm:table-cell">GPAX</th>
                  <th className="py-3 px-4 text-center">สถานะของฉัน</th>
                  <th className="py-3 px-4 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredApplicants.map((app) => {
                  const fullName = `${app.titlePrefix}${app.firstName} ${app.lastName}`.trim();
                  const isSubmitted = app.myStatus === 'SUBMITTED';

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-foreground">
                        {app.studentCode}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-foreground block">{fullName}</span>
                        <span className="text-xs text-muted-foreground md:hidden">
                          {app.faculty}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                        <span>{app.faculty}</span>
                        {app.major && <span className="block text-xs opacity-75">{app.major}</span>}
                      </td>
                      <td className="py-3 px-4 text-center text-muted-foreground font-mono hidden sm:table-cell">
                        {app.studyYear ? `ปี ${app.studyYear}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium hidden sm:table-cell">
                        {typeof app.gpa === 'number' ? (
                          <span className="px-2 py-0.5 rounded-md bg-muted text-foreground text-xs">
                            {app.gpa.toFixed(2)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isSubmitted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>ส่งแล้ว</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>ฉบับร่าง</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/evaluator/rounds/${selectedRoundId}/applicants/${app.id}`}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-2xs btn-interactive ${
                            isSubmitted
                              ? 'bg-muted/70 hover:bg-muted text-foreground border border-border'
                              : 'bg-primary text-primary-foreground hover:bg-primary/90'
                          }`}
                        >
                          {isSubmitted ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>ดูผลคะแนน</span>
                            </>
                          ) : (
                            <>
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>ประเมินต่อ</span>
                            </>
                          )}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
