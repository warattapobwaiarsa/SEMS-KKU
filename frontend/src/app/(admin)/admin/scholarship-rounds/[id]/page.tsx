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
  linkRoundCriteria 
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
  Lock
} from 'lucide-react';

export default function RoundDetailPage() {
  const params = useParams();
  const roundId = Number(params?.id);

  const [round, setRound] = useState<ScholarshipRoundDetail | null>(null);
  const [loading, setLoading] = useState(true);

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

  const loadData = useCallback(async () => {
    if (!roundId) return;
    try {
      setLoading(true);
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
      console.warn('Failed to load round:', msg);
    } finally {
      setLoading(false);
    }
  }, [roundId]);

  useEffect(() => {
    let ignore = false;
    const fetchAsync = async () => {
      if (!roundId) return;
      try {
        setLoading(true);
        const [roundRes, criteriaRes] = await Promise.all([
          fetchRoundById(roundId),
          fetchCriteriaList({ limit: 100 }),
        ]);
        if (!ignore) {
          setRound(roundRes.data);
          setCriteriaList(criteriaRes.data);
          if (roundRes.data.criteriaId) {
            setSelectedCriteriaId(roundRes.data.criteriaId);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed';
        console.warn('Error loading round detail:', msg);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    void fetchAsync();
    return () => {
      ignore = true;
    };
  }, [roundId]);

  const handleLinkCriteria = async () => {
    if (!round || round.status !== 'DRAFT') return;
    try {
      setLinkingCriteria(true);
      await linkRoundCriteria(roundId, selectedCriteriaId ? Number(selectedCriteriaId) : null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมโยงเกณฑ์';
      alert(msg);
    } finally {
      setLinkingCriteria(false);
    }
  };

  const handleOpenCheckClick = async () => {
    try {
      const res = await checkOpenReadiness(roundId);
      setReadiness(res.data);
      setShowOpenModal(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการตรวจสอบความพร้อม';
      alert(msg);
    }
  };

  const handleConfirmOpenRound = async () => {
    if (openingRound) return;
    try {
      setOpeningRound(true);
      await openRound(roundId);
      setShowOpenModal(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถเปิดรอบทุนได้';
      alert(msg);
    } finally {
      setOpeningRound(false);
    }
  };

  const handleCloseCheckClick = async () => {
    try {
      const res = await checkCloseStatus(roundId);
      setCloseCheck(res.data);
      setAcknowledged(false);
      setShowCloseModal(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการตรวจสอบก่อนปิดรอบ';
      alert(msg);
    }
  };

  const handleConfirmCloseRound = async () => {
    if (closingRound || !closeCheck) return;
    if (closeCheck.unsubmittedCount > 0 && !acknowledged) {
      alert('กรุณากดยืนยันรับทราบจำนวนผู้สมัครที่ยังไม่มีผลประเมินก่อนปิดรอบ');
      return;
    }

    try {
      setClosingRound(true);
      await closeRound(roundId, {
        acknowledged,
        acknowledgedCount: acknowledged ? closeCheck.unsubmittedCount : undefined,
      });
      setShowCloseModal(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถปิดรอบทุนได้';
      alert(msg);
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

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-16">
      {/* Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-4">
        <Link
          href="/admin/scholarship-rounds"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition hover:translate-x-[-2px]"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับสู่หน้ารายการรอบทุนการศึกษา
        </Link>

        {/* State Transition Actions */}
        <div className="flex items-center gap-2">
          {round.status === 'DRAFT' && (
            <button
              onClick={handleOpenCheckClick}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-sm font-semibold shadow-sm hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer"
            >
              <Play className="h-4 w-4 fill-white" />
              เปิดรับประเมิน (Open Round)
            </button>
          )}

          {round.status === 'OPEN' && (
            <button
              onClick={handleCloseCheckClick}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 text-sm font-semibold shadow-sm hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer"
            >
              <PowerOff className="h-4 w-4" />
              ปิดรอบการประเมิน (Close Round)
            </button>
          )}

          {round.status === 'CLOSED' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
              <Archive className="h-4 w-4" />
              รอบทุนปิดการประเมินแล้ว (ถาวร)
            </span>
          )}
        </div>
      </div>

      {/* Title & Status Banner */}
      <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {round.status === 'OPEN' ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                สถานะ: เปิดรับประเมิน (Open)
              </span>
            ) : round.status === 'CLOSED' ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                <Archive className="h-3.5 w-3.5" />
                สถานะ: ปิดรอบแล้ว (Closed)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                <Clock className="h-3.5 w-3.5" />
                สถานะ: แบบร่าง (Draft)
              </span>
            )}
            <span className="text-xs text-muted-foreground font-mono">
              รหัสรอบ #{round.id}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {round.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ปีการศึกษา {round.academicYear} | ภาคเรียนที่ {round.semester}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-muted/40 p-4 rounded-xl border border-border/60">
          <div className="text-center">
            <div className="text-xs text-muted-foreground font-medium">ผู้สมัครในรอบ</div>
            <div className="text-2xl font-bold font-mono text-foreground">{round.applicantCount} คน</div>
          </div>
          <div className="h-8 w-px bg-border/60" />
          <div className="text-center">
            <div className="text-xs text-muted-foreground font-medium">แถวที่ไม่ผ่านล่าสุด</div>
            <div className="text-2xl font-bold font-mono text-muted-foreground">{round.lastInvalidRowsCount} แถว</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Criteria Linking & Info (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                ชุดเกณฑ์การประเมินที่ผูกกับรอบทุน
              </h3>
              {round.status !== 'DRAFT' && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" /> ล็อกการเปลี่ยนเกณฑ์
                </span>
              )}
            </div>

            {round.status === 'DRAFT' ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  คุณสามารถเปลี่ยนหรือถอดชุดเกณฑ์ได้เฉพาะในสถานะร่าง (Draft) เท่านั้น (BR-RND-07)
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <select
                    value={selectedCriteriaId}
                    onChange={(e) => setSelectedCriteriaId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition cursor-pointer"
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
                    className="w-full sm:w-auto px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition shadow-2xs cursor-pointer whitespace-nowrap"
                  >
                    {linkingCriteria ? 'กำลังบันทึก...' : 'บันทึกเกณฑ์'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {round.criteria ? (
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-2">
                    <div className="font-semibold text-sm text-foreground">{round.criteria.name}</div>
                    <div className="text-xs text-muted-foreground">
                      จำนวนเกณฑ์ย่อย: {round.criteria.subCriteria.length} ข้อ
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-destructive">ไม่มีชุดเกณฑ์ผูกกับรอบนี้</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Round Lifecycle Timeline (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-semibold text-foreground border-b border-border/60 pb-3">
              วงจรสถานะรอบทุน (State Machine)
            </h3>

            <div className="space-y-4 text-xs">
              <div className={`p-3 rounded-xl border ${round.status === 'DRAFT' ? 'bg-amber-50/60 border-amber-300' : 'bg-muted/20 border-border/50'}`}>
                <div className="font-semibold text-foreground flex items-center justify-between">
                  <span>1. ขั้นตอนแบบร่าง (DRAFT)</span>
                  {round.status === 'DRAFT' && <span className="text-[10px] bg-amber-200/80 px-2 py-0.5 rounded-full font-bold">ปัจจุบัน</span>}
                </div>
                <p className="mt-1 text-muted-foreground">
                  แก้ไขข้อมูลรอบ, ผูกชุดเกณฑ์ที่มีผลรวม 100 คะแนน และนำเข้าข้อมูลผู้สมัคร
                </p>
              </div>

              <div className={`p-3 rounded-xl border ${round.status === 'OPEN' ? 'bg-emerald-50/60 border-emerald-300' : 'bg-muted/20 border-border/50'}`}>
                <div className="font-semibold text-foreground flex items-center justify-between">
                  <span>2. เปิดรับประเมิน (OPEN)</span>
                  {round.status === 'OPEN' && <span className="text-[10px] bg-emerald-200/80 px-2 py-0.5 rounded-full font-bold">ปัจจุบัน</span>}
                </div>
                <p className="mt-1 text-muted-foreground">
                  ล็อกข้อมูลรอบทุนและเกณฑ์ ผู้ประเมินสามารถเริ่มให้คะแนนผู้สมัครได้
                </p>
              </div>

              <div className={`p-3 rounded-xl border ${round.status === 'CLOSED' ? 'bg-slate-100 border-slate-300' : 'bg-muted/20 border-border/50'}`}>
                <div className="font-semibold text-foreground flex items-center justify-between">
                  <span>3. ปิดรอบการประเมิน (CLOSED)</span>
                  {round.status === 'CLOSED' && <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full font-bold">ปัจจุบัน</span>}
                </div>
                <p className="mt-1 text-muted-foreground">
                  สิ้นสุดการให้คะแนน นำผลคะแนนไปใช้จัดสรรทุนการศึกษาต่อไป
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Open Round Readiness Check */}
      {showOpenModal && readiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Play className="h-5 w-5 text-emerald-600 fill-emerald-600" />
                ตรวจสอบความพร้อมก่อนเปิดรอบทุน
              </h3>
              <button onClick={() => setShowOpenModal(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                ระบบจะตรวจสอบเงื่อนไขความพร้อม 3 ข้อสำคัญตามกฎธุรกิจ (FR-RND-08):
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/60">
                  <span>ข้อมูลหลักของรอบทุนครบถ้วน</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/60">
                  <span>มีผู้สมัครอย่างน้อย 1 คน ({readiness.applicantCount} คน)</span>
                  {readiness.applicantCount >= 1 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/60">
                  <span>ผูกชุดเกณฑ์ผลรวมคะแนน 100 คะแนน ({readiness.criteriaName ?? 'ยังไม่มี'})</span>
                  {readiness.criteriaName ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
              </div>

              {readiness.lastInvalidRowsCount > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  ℹ️ มีแถวที่ไม่ผ่านจากการนำเข้าล่าสุด {readiness.lastInvalidRowsCount} แถว (รับทราบและเปิดรอบได้ตามกฎ FR-RND-09)
                </div>
              )}

              {!readiness.isReady && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs space-y-1">
                  <div className="font-semibold">ไม่ผ่านเงื่อนไขการเปิดรอบ:</div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {readiness.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/70">
              <button
                type="button"
                onClick={() => setShowOpenModal(false)}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={!readiness.isReady || openingRound}
                onClick={handleConfirmOpenRound}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-40 transition cursor-pointer"
              >
                {openingRound ? 'กำลังเปิดรอบ...' : 'ยืนยันเปิดรับประเมิน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Close Round Unsubmitted Check */}
      {showCloseModal && closeCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <PowerOff className="h-5 w-5 text-rose-600" />
                ยืนยันการปิดรอบการประเมิน
              </h3>
              <button onClick={() => setShowCloseModal(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {closeCheck.unsubmittedCount === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  ✅ ผู้สมัครทุกคนได้รับการประเมินและส่งผล (Submitted) ครบถ้วนแล้ว สามารถปิดรอบได้ทันที
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
                    <div className="font-semibold flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-amber-700" />
                      พบผู้สมัครที่ยังไม่มีผลประเมิน Submitted ({closeCheck.unsubmittedCount} คน)
                    </div>
                    <p>
                      หากปิดรอบ ผู้สมัครที่ไม่มีผลประเมินจะได้รับคะแนน 0.00 และผลการประเมินแบบร่างทั้งหมดจะถูกล็อกถาวร (FR-RND-12, FR-RND-13)
                    </p>
                  </div>

                  {/* Unsubmitted List preview */}
                  <div className="max-h-40 overflow-y-auto border border-border/70 rounded-xl divide-y divide-border/60 text-xs">
                    {closeCheck.applicants.map((a) => (
                      <div key={a.applicantId} className="p-2.5 flex items-center justify-between">
                        <span className="font-mono font-medium">{a.studentCode}</span>
                        <span>{a.titlePrefix}{a.firstName} {a.lastName}</span>
                      </div>
                    ))}
                  </div>

                  <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acknowledged}
                      onChange={(e) => setAcknowledged(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary cursor-pointer"
                    />
                    <span className="text-xs text-foreground font-medium select-none">
                      ข้าพเจ้ารับทราบว่ามีผู้สมัคร {closeCheck.unsubmittedCount} คนที่ยังไม่มีผลการประเมิน และยืนยันปิดรอบการประเมินนี้
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/70">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={closingRound || (closeCheck.unsubmittedCount > 0 && !acknowledged)}
                onClick={handleConfirmCloseRound}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm disabled:opacity-40 transition cursor-pointer"
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
