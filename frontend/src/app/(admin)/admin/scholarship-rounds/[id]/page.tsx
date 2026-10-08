'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ScholarshipRoundDetail, 
  OpenReadinessCheck, 
  CloseStatusCheck 
} from '@/types/rounds';
import { CriteriaDetail } from '@/types/criteria';
import { 
  fetchRoundById, 
  checkOpenReadiness, 
  openRound, 
  checkCloseStatus, 
  closeRound,
  linkRoundCriteria,
  updateRound 
} from '@/services/rounds.service';
import { fetchCriteriaList } from '@/services/criteria.service';
import { 
  ArrowLeft, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Archive, 
  Play, 
  PowerOff, 
  ShieldAlert,
  X,
  Lock,
  Pencil
} from 'lucide-react';

export default function RoundDetailPage() {
  const params = useParams();
  const roundId = Number(params?.id);

  const [round, setRound] = useState<ScholarshipRoundDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Criteria Linking
  const [criteriaList, setCriteriaList] = useState<CriteriaDetail[]>([]);
  const [selectedCriteriaId, setSelectedCriteriaId] = useState<number | ''>('');
  const [linkingCriteria, setLinkingCriteria] = useState(false);

  // Open Modal State
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [readiness, setReadiness] = useState<OpenReadinessCheck | null>(null);
  const [openingRound, setOpeningRound] = useState(false);

  // Close Modal State
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeCheck, setCloseCheck] = useState<CloseStatusCheck | null>(null);
  const [closingRound, setClosingRound] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [closeModalError, setCloseModalError] = useState<string | null>(null);

  // Edit Round Info Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAcademicYear, setEditAcademicYear] = useState<number>(2569);
  const [editSemester, setEditSemester] = useState<number>(1);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleOpenEditModal = () => {
    if (!round || round.status !== 'DRAFT') return;
    setEditName(round.name);
    setEditAcademicYear(round.academicYear);
    setEditSemester(round.semester);
    setEditError(null);
    setShowEditModal(true);
  };

  const handleSaveEditRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!round || round.status !== 'DRAFT') return;
    if (!editName.trim()) {
      setEditError('กรุณากรอกชื่อรอบทุนการศึกษา (ห้ามเว้นว่าง)');
      return;
    }
    if (editAcademicYear < 2550 || editAcademicYear > 2700) {
      setEditError('ปีการศึกษาต้องอยู่ในช่วง พ.ศ. 2550–2700 (BR-RND-01)');
      return;
    }
    try {
      setSavingEdit(true);
      setEditError(null);
      await updateRound(roundId, {
        name: editName.trim(),
        academicYear: editAcademicYear,
        semester: editSemester,
      });
      await loadData();
      setShowEditModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลรอบทุน';
      setEditError(msg);
      if (msg.includes('INVALID_ROUND_STATUS') || msg.includes('สถานะร่าง')) {
        void loadData();
        setShowEditModal(false);
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const loadData = useCallback(async () => {
    if (!roundId) return;
    try {
      setLoading(true);
      setErrorBanner(null);
      const [roundRes, criteriaRes] = await Promise.all([
        fetchRoundById(roundId),
        fetchCriteriaList({ limit: 100 }),
      ]);
      setRound(roundRes.data);
      setCriteriaList(criteriaRes.data);
      if (roundRes.data.criteriaId) {
        setSelectedCriteriaId(roundRes.data.criteriaId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลรอบทุนได้';
      setErrorBanner(msg);
      console.warn('Failed to load round:', msg);
    } finally {
      setLoading(false);
    }
  }, [roundId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleLinkCriteria = async () => {
    if (!round || round.status !== 'DRAFT') return;
    try {
      setLinkingCriteria(true);
      setErrorBanner(null);
      await linkRoundCriteria(roundId, selectedCriteriaId ? Number(selectedCriteriaId) : null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมโยงเกณฑ์';
      setErrorBanner(msg);
    } finally {
      setLinkingCriteria(false);
    }
  };

  const handleOpenCheckClick = async () => {
    try {
      setErrorBanner(null);
      const res = await checkOpenReadiness(roundId);
      setReadiness(res.data);
      setShowOpenModal(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการตรวจสอบความพร้อม';
      setErrorBanner(msg);
    }
  };

  const handleConfirmOpenRound = async () => {
    if (openingRound) return;
    try {
      setOpeningRound(true);
      setErrorBanner(null);
      await openRound(roundId);
      setShowOpenModal(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถเปิดรอบทุนได้';
      setErrorBanner(msg);
      if (msg.includes('INVALID_ROUND_STATUS') || msg.includes('สถานะร่าง')) {
        setShowOpenModal(false);
        void loadData();
      }
    } finally {
      setOpeningRound(false);
    }
  };

  const handleCloseCheckClick = async () => {
    try {
      setErrorBanner(null);
      setCloseModalError(null);
      const res = await checkCloseStatus(roundId);
      setCloseCheck(res.data);
      setAcknowledged(false);
      setShowCloseModal(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการตรวจสอบก่อนปิดรอบ';
      setErrorBanner(msg);
    }
  };

  const handleConfirmCloseRound = async () => {
    if (closingRound || !closeCheck) return;
    if (closeCheck.unsubmittedCount > 0 && !acknowledged) {
      setCloseModalError('กรุณากดยืนยันรับทราบจำนวนผู้สมัครที่ยังไม่มีผลประเมินก่อนปิดรอบ');
      return;
    }

    try {
      setClosingRound(true);
      setErrorBanner(null);
      setCloseModalError(null);
      await closeRound(roundId, {
        acknowledged,
        acknowledgedCount: acknowledged ? closeCheck.unsubmittedCount : undefined,
      });
      setShowCloseModal(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถปิดรอบทุนได้';
      if (msg.includes('ROUND_CLOSE_STATE_CHANGED') || msg.includes('เปลี่ยนแปลงไปจากที่รับทราบ')) {
        // Auto refresh unsubmitted check
        try {
          const freshCheck = await checkCloseStatus(roundId);
          setCloseCheck(freshCheck.data);
          setAcknowledged(false);
          setCloseModalError('มีผลการประเมินถูกส่งเข้ามาระหว่างนี้ ข้อมูลผู้สมัครตกค้างได้รับการอัปเดตแล้ว กรุณาตรวจสอบรายชื่อและกดยืนยันใหม่อีกครั้ง');
        } catch {
          setCloseModalError(msg);
        }
      } else if (msg.includes('INVALID_ROUND_STATUS') || msg.includes('สถานะเปิดรับสมัคร')) {
        setShowCloseModal(false);
        setErrorBanner(msg);
        void loadData();
      } else {
        setCloseModalError(msg);
      }
    } finally {
      setClosingRound(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">กำลังโหลดรายละเอียดรอบทุน...</p>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="p-12 text-center">
        <p className="text-destructive font-semibold">ไม่พบข้อมูลรอบทุนการศึกษา</p>
        <Link href="/admin/scholarship-rounds" className="mt-4 inline-block text-sm text-primary underline">
          กลับสู่หน้ารายการ
        </Link>
      </div>
    );
  }

  const hasBasicInfo = Boolean(round.name && round.academicYear && round.semester);
  const hasApplicants = round.applicantCount >= 1;
  const criteriaTotalScore = round.criteria?.subCriteria?.reduce(
    (sum, item) => sum + (Number(item.maxScore) || 0),
    0
  ) ?? 0;
  const isCriteria100 = Boolean(round.criteria) && criteriaTotalScore === 100;
  const isDraftRoundReady = hasBasicInfo && hasApplicants && isCriteria100;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-16">
      {/* Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <Link
          href="/admin/scholarship-rounds"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition hover:-translate-x-0.5"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับสู่หน้ารายการรอบทุนการศึกษา
        </Link>

        {/* State Transition Actions */}
        <div className="flex items-center gap-3">
          {round.status === 'DRAFT' && (
            <>
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 text-sm font-semibold shadow-xs hover:border-slate-300 transition-all cursor-pointer"
              >
                <Pencil className="h-4 w-4 text-slate-500" />
                แก้ไขรอบทุน
              </button>
              <button
                onClick={handleOpenCheckClick}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-5 py-2.5 text-sm font-bold shadow-md shadow-emerald-600/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all cursor-pointer ring-2 ring-emerald-600/30"
              >
                <Play className="h-4 w-4 fill-white" />
                เปิดรับประเมิน (Open Round)
              </button>
            </>
          )}

          {round.status === 'OPEN' && (
            <button
              onClick={handleCloseCheckClick}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white px-5 py-2.5 text-sm font-bold shadow-md shadow-rose-600/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all cursor-pointer ring-2 ring-rose-600/30"
            >
              <PowerOff className="h-4 w-4" />
              ปิดรอบการประเมิน (Close Round)
            </button>
          )}

          {round.status === 'CLOSED' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-300 shadow-xs">
              <Archive className="h-4 w-4 text-slate-500" />
              รอบทุนปิดการประเมินแล้ว (ถาวร)
            </span>
          )}
        </div>
      </div>

      {errorBanner && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50/90 p-4 text-sm text-rose-900 flex items-start gap-3 shadow-xs">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1">
            <h4 className="font-bold">เกิดข้อผิดพลาด</h4>
            <p className="mt-0.5 font-medium">{errorBanner}</p>
          </div>
          <button
            onClick={() => setErrorBanner(null)}
            className="text-rose-500 hover:text-rose-700 p-1 rounded-md"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Title & Status Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2.5">
            {round.status === 'OPEN' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                สถานะ: เปิดรับประเมิน (Open)
              </span>
            ) : round.status === 'CLOSED' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                <Archive className="h-3.5 w-3.5 text-slate-500" />
                สถานะ: ปิดรอบแล้ว (Closed)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                สถานะ: แบบร่าง (Draft)
              </span>
            )}
            <span className="text-xs text-slate-500 font-mono font-medium bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              รหัสรอบ #{round.id}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {round.name}
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            ปีการศึกษา {round.academicYear} | ภาคเรียนที่ {round.semester}
          </p>
        </div>

        <div className="flex items-center gap-5 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-center min-w-[90px]">
            <div className="text-xs text-slate-500 font-medium">ผู้สมัครในรอบ</div>
            <div className="text-2xl font-extrabold font-mono text-slate-900">{round.applicantCount} <span className="text-sm font-normal text-slate-500">คน</span></div>
          </div>
          <div className="h-9 w-px bg-slate-200" />
          <div className="text-center min-w-[90px]">
            <div className="text-xs text-slate-500 font-medium">แถวที่ไม่ผ่านล่าสุด</div>
            <div className={`text-2xl font-extrabold font-mono ${round.lastInvalidRowsCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              {round.lastInvalidRowsCount} <span className="text-sm font-normal text-slate-500">แถว</span>
            </div>
          </div>
        </div>
      </div>


      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Criteria Linking & Info (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                ชุดเกณฑ์การประเมินที่ผูกกับรอบทุน
              </h3>
              {round.status !== 'DRAFT' && (
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                  <Lock className="h-3 w-3" /> ล็อกการเปลี่ยนเกณฑ์
                </span>
              )}
            </div>

            {round.status === 'DRAFT' ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  คุณสามารถเปลี่ยนหรือถอดชุดเกณฑ์ได้เฉพาะในสถานะร่าง (Draft) เท่านั้น เมื่อเปิดรอบทุนแล้วจะไม่สามารถแก้ไขชุดเกณฑ์ได้ (ตามกฎ BR-RND-07)
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <select
                    value={selectedCriteriaId}
                    onChange={(e) => setSelectedCriteriaId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition cursor-pointer font-medium text-slate-800 shadow-2xs"
                  >
                    <option value="">-- ยังไม่ผูกเกณฑ์ (ไม่มีเกณฑ์) --</option>
                    {criteriaList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.totalScore} คะแนน, {c.subCriteria.length} ข้อ)
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleLinkCriteria}
                    disabled={linkingCriteria}
                    className="px-5 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-[0.98] cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    {linkingCriteria ? 'กำลังบันทึก...' : 'บันทึกเกณฑ์'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {round.criteria ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="font-bold text-sm text-slate-900">{round.criteria.name}</div>
                    <div className="text-xs text-slate-600">
                      จำนวนเกณฑ์ย่อย: {round.criteria.subCriteria.length} ข้อ
                    </div>
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl">ไม่มีชุดเกณฑ์ผูกกับรอบนี้</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Round Lifecycle Timeline & Live Readiness (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {round.status === 'DRAFT' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className={`h-5 w-5 ${isDraftRoundReady ? 'text-emerald-600' : 'text-amber-500'}`} />
                  ความพร้อมสำหรับเปิดรอบ (BR-RND-08)
                </h3>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  isDraftRoundReady 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {isDraftRoundReady ? 'พร้อมเปิดรอบ' : 'ยังไม่พร้อม'}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Condition 1: Basic Info */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-medium text-slate-800">1. ข้อมูลหลักครบถ้วน (ชื่อ, ปี, ภาคเรียน)</span>
                  {hasBasicInfo ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                </div>

                {/* Condition 2: Applicants */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="font-medium text-slate-800">2. มีผู้สมัครอย่างน้อย 1 คน</span>
                    <span className="text-slate-500 ml-1.5 font-mono">({round.applicantCount} คน)</span>
                  </div>
                  {hasApplicants ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                </div>

                {/* Condition 3: Criteria & 100 points */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="font-medium text-slate-800">3. ผูกชุดเกณฑ์ผลรวม 100 คะแนน</span>
                    <span className="text-slate-500 ml-1.5 font-mono">
                      ({round.criteria ? `${round.criteria.name} : ${criteriaTotalScore}/100` : 'ยังไม่มีเกณฑ์'})
                    </span>
                  </div>
                  {isCriteria100 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                </div>
              </div>

              {round.lastInvalidRowsCount > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium leading-relaxed">
                  ℹ️ มีแถวที่ไม่ผ่านจากการนำเข้าล่าสุด {round.lastInvalidRowsCount} แถว (รับทราบและเปิดรอบได้ตามกฎ BR-RND-09)
                </div>
              )}

              {!isDraftRoundReady && (
                <p className="text-[11px] text-slate-500 leading-relaxed italic">
                  * ต้องผ่านเงื่อนไขทั้ง 3 ข้อข้างต้น จึงจะสามารถกดยืนยันเปิดรอบการประเมินได้
                </p>
              )}
            </div>
          )}

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3">
              วงจรสถานะรอบทุน (State Machine)
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className={`p-3.5 rounded-xl border transition ${round.status === 'DRAFT' ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-400/40 shadow-xs' : 'bg-slate-50/60 border-slate-200'}`}>
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>1. ขั้นตอนแบบร่าง (DRAFT)</span>
                  {round.status === 'DRAFT' && <span className="text-[10px] bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full font-extrabold shadow-2xs">ปัจจุบัน</span>}
                </div>
                <p className="mt-1 text-slate-600 leading-relaxed">
                  แก้ไขข้อมูลรอบ, ผูกชุดเกณฑ์ที่มีผลรวม 100 คะแนน และนำเข้าข้อมูลผู้สมัคร
                </p>
              </div>

              <div className={`p-3.5 rounded-xl border transition ${round.status === 'OPEN' ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400/40 shadow-xs' : 'bg-slate-50/60 border-slate-200'}`}>
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>2. เปิดรับประเมิน (OPEN)</span>
                  {round.status === 'OPEN' && <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full font-extrabold shadow-2xs">ปัจจุบัน</span>}
                </div>
                <p className="mt-1 text-slate-600 leading-relaxed">
                  ล็อกข้อมูลรอบทุนและเกณฑ์ ผู้ประเมินสามารถเริ่มให้คะแนนผู้สมัครได้
                </p>
              </div>

              <div className={`p-3.5 rounded-xl border transition ${round.status === 'CLOSED' ? 'bg-slate-100 border-slate-300 ring-1 ring-slate-400/40 shadow-xs' : 'bg-slate-50/60 border-slate-200'}`}>
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>3. ปิดรอบการประเมิน (CLOSED)</span>
                  {round.status === 'CLOSED' && <span className="text-[10px] bg-slate-300 text-slate-900 px-2.5 py-0.5 rounded-full font-extrabold shadow-2xs">ปัจจุบัน</span>}
                </div>
                <p className="mt-1 text-slate-600 leading-relaxed">
                  สิ้นสุดการให้คะแนน นำผลคะแนนไปใช้จัดสรรทุนการศึกษาต่อไป
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Edit Round Info */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                แก้ไขข้อมูลรอบทุนการศึกษา
              </h3>
              <button 
                type="button"
                onClick={() => setShowEditModal(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditRound} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="editRoundName" className="block text-xs font-semibold text-slate-700">
                  ชื่อรอบทุนการศึกษา <span className="text-destructive">*</span>
                </label>
                <input
                  id="editRoundName"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="เช่น ทุนการศึกษาเพื่อการพัฒนาศักยภาพนักศึกษา ประจำภาคเรียนที่ 1/2569"
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="editAcademicYear" className="block text-xs font-semibold text-slate-700">
                    ปีการศึกษา (พ.ศ.) <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="editAcademicYear"
                    type="number"
                    min={2550}
                    max={2700}
                    required
                    value={editAcademicYear}
                    onChange={(e) => setEditAcademicYear(parseInt(e.target.value) || 2569)}
                    onWheel={(e) => e.currentTarget.blur()}
                    onKeyDown={(e) => {
                      if (['ArrowUp', 'ArrowDown', 'e', 'E', '+', '-'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className="w-full px-3.5 py-2.5 text-sm font-mono bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  {editAcademicYear >= 2000 && editAcademicYear <= 2150 && (
                    <div className="flex items-center gap-2 pt-1 text-xs text-amber-700 bg-amber-50 border border-amber-200/80 p-2 rounded-lg">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                      <span>
                        ตรวจพบปี ค.ศ. ({editAcademicYear}) ต้องการแปลงเป็น พ.ศ. ({editAcademicYear + 543}) หรือไม่?
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditAcademicYear(editAcademicYear + 543)}
                        className="font-semibold text-primary underline hover:text-primary/80 cursor-pointer ml-auto shrink-0"
                      >
                        แปลงทันที
                      </button>
                    </div>
                  )}
                  {editAcademicYear && (editAcademicYear < 2550 || editAcademicYear > 2700) && !(editAcademicYear >= 2000 && editAcademicYear <= 2150) && (
                    <p className="text-xs text-rose-600">ปีการศึกษาต้องอยู่ในช่วง พ.ศ. 2550–2700 (BR-RND-01)</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="editSemester" className="block text-xs font-semibold text-slate-700">
                    ภาคการศึกษา <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="editSemester"
                    value={editSemester}
                    onChange={(e) => setEditSemester(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition cursor-pointer"
                  >
                    <option value={1}>ภาคเรียนที่ 1</option>
                    <option value={2}>ภาคเรียนที่ 2</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || !editName.trim()}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm disabled:opacity-40 transition-all cursor-pointer"
                >
                  {savingEdit ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Open Round Readiness Check */}
      {showOpenModal && readiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Play className="h-5 w-5 text-emerald-600 fill-emerald-600" />
                ตรวจสอบความพร้อมก่อนเปิดรอบทุน
              </h3>
              <button 
                onClick={() => setShowOpenModal(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <p className="text-xs font-medium text-slate-600">
                ระบบจะตรวจสอบเงื่อนไขความพร้อม 3 ข้อสำคัญตามกฎธุรกิจ (FR-RND-08):
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-medium text-slate-800">ข้อมูลหลักของรอบทุนครบถ้วน</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-medium text-slate-800">มีผู้สมัครอย่างน้อย 1 คน ({readiness.applicantCount} คน)</span>
                  {readiness.applicantCount >= 1 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-medium text-slate-800">ผูกชุดเกณฑ์ผลรวมคะแนน 100 คะแนน ({readiness.criteriaName ?? 'ยังไม่มี'})</span>
                  {readiness.criteriaName ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                  )}
                </div>
              </div>

              {readiness.lastInvalidRowsCount > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium leading-relaxed">
                  ℹ️ มีแถวที่ไม่ผ่านจากการนำเข้าล่าสุด {readiness.lastInvalidRowsCount} แถว (รับทราบและเปิดรอบได้ตามกฎ FR-RND-09)
                </div>
              )}

              {!readiness.isReady && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-rose-700">
                    <AlertCircle className="h-4 w-4" />
                    ไม่ผ่านเงื่อนไขการเปิดรอบ:
                  </div>
                  <ul className="list-disc pl-5 space-y-1 font-medium">
                    {readiness.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowOpenModal(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={!readiness.isReady || openingRound}
                onClick={handleConfirmOpenRound}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-md shadow-emerald-600/25 disabled:opacity-40 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                {openingRound ? 'กำลังเปิดรอบ...' : 'ยืนยันเปิดรับประเมิน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Close Round Unsubmitted Check */}
      {showCloseModal && closeCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <PowerOff className="h-5 w-5 text-rose-600" />
                ยืนยันการปิดรอบการประเมิน
              </h3>
              <button 
                onClick={() => setShowCloseModal(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {closeModalError && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                <span className="font-medium">{closeModalError}</span>
              </div>
            )}

            <div className="space-y-4">
              {closeCheck.unsubmittedCount === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-medium leading-relaxed flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>ผู้สมัครทุกคนได้รับการประเมินและส่งผล (Submitted) ครบถ้วนแล้ว สามารถปิดรอบได้ทันที</span>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-amber-800">
                      <ShieldAlert className="h-4 w-4 text-amber-600" />
                      พบผู้สมัครที่ยังไม่มีผลประเมิน Submitted ({closeCheck.unsubmittedCount} คน)
                    </div>
                    <p className="leading-relaxed">
                      หากปิดรอบ ผู้สมัครที่ไม่มีผลประเมินจะได้รับคะแนน 0.00 และผลการประเมินแบบร่างทั้งหมดจะถูกล็อกถาวร (ตามกฎ FR-RND-12, FR-RND-13)
                    </p>
                  </div>

                  {/* Unsubmitted List preview */}
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs bg-slate-50">
                    {closeCheck.applicants.map((a) => (
                      <div key={a.applicantId} className="p-2.5 flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-800">{a.studentCode}</span>
                        <span className="text-slate-600 font-medium">{a.titlePrefix}{a.firstName} {a.lastName}</span>
                      </div>
                    ))}
                  </div>

                  <label className="flex items-start gap-2.5 pt-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acknowledged}
                      onChange={(e) => setAcknowledged(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-800 font-medium select-none group-hover:text-slate-900">
                      ข้าพเจ้ารับทราบว่ามีผู้สมัคร {closeCheck.unsubmittedCount} คนที่ยังไม่มีผลการประเมิน และยืนยันปิดรอบการประเมินนี้
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={closingRound || (closeCheck.unsubmittedCount > 0 && !acknowledged)}
                onClick={handleConfirmCloseRound}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-md shadow-rose-600/25 disabled:opacity-40 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                {closingRound ? 'กำลังปิดรอบ...' : 'ยืนยันปิดรอบทุน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
