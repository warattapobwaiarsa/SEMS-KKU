'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  updateRound,
  linkRoundCriteria 
} from '@/services/rounds.service';
import { fetchCriteriaList } from '@/services/criteria.service';
import { 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  PowerOff, 
  ShieldAlert, 
  X, 
  Pencil, 
  FileSpreadsheet, 
  Users, 
  Sliders,
} from 'lucide-react';
import { DeleteRoundModal } from '@/components/rounds/delete-round-modal';
import { ImportApplicantModal } from '@/components/applicants/import-modal';
import { 
  Modal, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Select,
  Card,
  Button,
  StatusBadge,
  Badge,
} from '@/components/ui';
import { RoundHeroHeader } from '@/components/rounds/round-hero-header';

export default function RoundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roundId = Number(params?.id);

  const [round, setRound] = useState<ScholarshipRoundDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Criteria Linking State
  const [criteriaList, setCriteriaList] = useState<CriteriaDetail[]>([]);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [selectedCriteriaId, setSelectedCriteriaId] = useState<number | null>(null);
  const [savingCriteria, setSavingCriteria] = useState(false);
  const [criteriaError, setCriteriaError] = useState<string | null>(null);

  const handleOpenCriteriaModal = () => {
    if (!round || round.status !== 'DRAFT') return;
    setSelectedCriteriaId(round.criteriaId || null);
    setCriteriaError(null);
    setShowCriteriaModal(true);
  };

  const handleSaveCriteria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!round || round.status !== 'DRAFT') return;
    if (!selectedCriteriaId) {
      setCriteriaError('กรุณาเลือกชุดเกณฑ์การประเมิน');
      return;
    }
    try {
      setSavingCriteria(true);
      setCriteriaError(null);
      await linkRoundCriteria(roundId, selectedCriteriaId);
      await loadData();
      setShowCriteriaModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกชุดเกณฑ์';
      setCriteriaError(msg);
    } finally {
      setSavingCriteria(false);
    }
  };

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

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);

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
      setEditError('ปีการศึกษาต้องอยู่ในช่วง พ.ศ. 2550–2700');
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
  const targetScore = round.criteria?.targetScore || 100;
  const hasScoredCriteria = Boolean(
    round.criteria?.subCriteria?.some((item) => item.type === 'SCORED')
  );
  const isCriteriaScoreValid = Boolean(round.criteria) && hasScoredCriteria;
  const isDraftRoundReady = hasBasicInfo && hasApplicants && isCriteriaScoreValid;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      {/* Page Header (Consistent with all other admin pages) */}
      <RoundHeroHeader
        round={round}
        isDraftRoundReady={isDraftRoundReady}
        hasBasicInfo={hasBasicInfo}
        hasApplicants={hasApplicants}
        isCriteriaScoreValid={isCriteriaScoreValid}
        criteriaTotalScore={criteriaTotalScore}
        targetScore={targetScore}
        onOpenEditModal={handleOpenEditModal}
        onOpenCheckClick={handleOpenCheckClick}
        onCloseCheckClick={handleCloseCheckClick}
        onShowDeleteModal={() => setShowDeleteModal(true)}
        onShowImportModal={() => setShowImportModal(true)}
      />

      {errorBanner && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50/90 p-4 text-sm text-rose-900 flex items-start gap-3 shadow-xs dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-300">
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

      {/* ข้อมูลของรอบทุนการศึกษา (Round Details & Information) */}
      <div className="flex flex-col gap-6">
        {/* Card 1: ข้อมูลทั่วไปของรอบทุน */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
              ข้อมูลทั่วไปของรอบทุนการศึกษา
            </h3>
            <div className="flex items-center gap-2">
              {round.status === 'DRAFT' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenEditModal}
                  leftIcon={<Pencil className="h-3.5 w-3.5 text-muted-foreground" />}
                >
                  แก้ไขข้อมูล
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
              <span className="text-xs text-muted-foreground font-medium block">ชื่อรอบทุน</span>
              <span className="font-bold text-foreground text-sm mt-1 block">{round.name}</span>
            </div>
            <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
              <span className="text-xs text-muted-foreground font-medium block">ปีการศึกษา / ภาคเรียน</span>
              <span className="font-bold text-foreground text-sm mt-1 block">
                ปีการศึกษา {round.academicYear} (ภาคเรียนที่ {round.semester})
              </span>
            </div>
            <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
              <span className="text-xs text-muted-foreground font-medium block">ประเภททุนการศึกษา</span>
              <span className="font-bold text-foreground text-sm mt-1 block">
                {round.scholarshipType?.name || 'ไม่ระบุประเภททุน'}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
              <span className="text-xs text-muted-foreground font-medium block">สถานะรอบทุน</span>
              <div className="mt-1">
                {round.status === 'OPEN' ? (
                  <StatusBadge variant="open" label="เปิดรับประเมิน" />
                ) : round.status === 'CLOSED' ? (
                  <StatusBadge variant="closed" label="ปิดรอบแล้ว" />
                ) : (
                  <StatusBadge variant="draft" label="แบบร่าง" />
                )}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
              <span className="text-xs text-muted-foreground font-medium block">จำนวนผู้สมัครในรอบ</span>
              <span className="font-bold font-mono text-foreground text-sm mt-1 block">
                {round.applicantCount} คน
              </span>
            </div>
            <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
              <span className="text-xs text-muted-foreground font-medium block">วันที่สร้าง</span>
              <span className="font-semibold text-foreground text-sm mt-1 block">
                {new Date(round.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-border/60">
            {round.status === 'DRAFT' && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowImportModal(true)}
                leftIcon={<FileSpreadsheet className="h-3.5 w-3.5 text-primary" />}
              >
                นำเข้าไฟล์ Excel เพิ่มเติม
              </Button>
            )}
            <Link href={`/admin/applicants/${roundId}`}>
              <Button size="sm" leftIcon={<Users className="h-3.5 w-3.5" />}>
                เปิดหน้ารายชื่อผู้สมัคร
              </Button>
            </Link>
          </div>
        </Card>

        {/* Card 2: ชุดเกณฑ์การประเมินที่ใช้ */}
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                ชุดเกณฑ์การประเมินที่ใช้: {round.criteria?.name || 'ยังไม่ระบุชุดเกณฑ์'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {round.criteria && (
                <>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-xs">
                    เป้าหมาย {round.criteria.targetScore || targetScore} คะแนน
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {round.criteria.subCriteria.length} เกณฑ์ย่อย
                  </Badge>
                </>
              )}
              {round.status === 'DRAFT' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenCriteriaModal}
                  leftIcon={<Pencil className="h-3.5 w-3.5 text-muted-foreground" />}
                >
                  {round.criteria ? 'เปลี่ยนชุดเกณฑ์' : 'กำหนดชุดเกณฑ์'}
                </Button>
              )}
            </div>
          </div>

          {round.criteria && round.criteria.subCriteria.length > 0 ? (
            <div className="space-y-2">
              <div className="border border-border/80 rounded-xl overflow-hidden divide-y divide-border/60 text-xs">
                {round.criteria.subCriteria.map((sub, idx) => (
                  <div key={sub.id || idx} className="p-3.5 flex items-start justify-between gap-4 bg-background/50 hover:bg-background transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-muted text-center leading-5 font-mono text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-foreground truncate">{sub.title}</span>
                    </div>
                    <div className="font-mono font-bold text-foreground shrink-0 text-sm">
                      {sub.type === 'TEXT' ? (
                        <span className="text-xs font-normal text-muted-foreground">เกณฑ์ข้อความ</span>
                      ) : sub.maxScore !== null && sub.maxScore !== undefined ? (
                        <>{sub.maxScore} <span className="text-xs font-normal text-muted-foreground">คะแนน</span></>
                      ) : (
                        <span className="text-xs font-normal text-muted-foreground">มีคะแนน</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-muted/20 rounded-xl border border-dashed border-border/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">ยังไม่มีการผูกชุดเกณฑ์การประเมินสำหรับรอบทุนนี้</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  รอบทุนนี้ถูกสร้างไว้ในสถานะร่าง (Draft) โดยยังไม่ได้กำหนดเกณฑ์ จำเป็นต้องกำหนดเกณฑ์การประเมินก่อนเปิดรับประเมิน
                </p>
              </div>
              {round.status === 'DRAFT' && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleOpenCriteriaModal}
                  leftIcon={<Layers className="h-3.5 w-3.5" />}
                >
                  เลือกหรือผูกชุดเกณฑ์การประเมิน
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Modal: Edit Round Info */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} size="lg">
        <ModalHeader
          title="แก้ไขข้อมูลรอบทุนการศึกษา"
          icon={Pencil}
          onClose={() => setShowEditModal(false)}
        />
        <form onSubmit={handleSaveEditRound}>
          <ModalBody className="space-y-4">
            {editError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                <span>{editError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="editRoundName" className="block text-xs font-semibold text-foreground">
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
                <label htmlFor="editAcademicYear" className="block text-xs font-semibold text-foreground">
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
                  <p className="text-xs text-destructive">ปีการศึกษาต้องอยู่ในช่วง พ.ศ. 2550–2700</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="editSemester" className="block text-xs font-semibold text-foreground">
                  ภาคการศึกษา <span className="text-destructive">*</span>
                </label>
                <Select
                  id="editSemester"
                  value={editSemester}
                  onChange={(e) => setEditSemester(parseInt(e.target.value) || 1)}
                >
                  <option value={1}>ภาคเรียนที่ 1</option>
                  <option value={2}>ภาคเรียนที่ 2</option>
                </Select>
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEditModal(false)}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={savingEdit || !editName.trim()}
              isLoading={savingEdit}
            >
              บันทึกการเปลี่ยนแปลง
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Modal: Open Round Readiness Check */}
      <Modal isOpen={showOpenModal && Boolean(readiness)} onClose={() => setShowOpenModal(false)} size="lg">
        {readiness && (
          <>
            <ModalHeader
              title="ตรวจสอบความพร้อมก่อนเปิดรอบทุน"
              icon={Play}
              onClose={() => setShowOpenModal(false)}
            />
            <ModalBody className="space-y-4">
              <p className="text-xs font-medium text-muted-foreground">
                ระบบจะตรวจสอบเงื่อนไขความพร้อม 3 ข้อสำคัญก่อนเปิดรอบ:
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/80">
                  <span className="font-medium text-foreground">ข้อมูลหลักของรอบทุนครบถ้วน</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/80">
                  <span className="font-medium text-foreground">มีผู้สมัครอย่างน้อย 1 คน ({readiness.applicantCount} คน)</span>
                  {readiness.applicantCount >= 1 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/80">
                  <span className="font-medium text-foreground">
                    ผูกชุดเกณฑ์ผลรวมคะแนนครบ {readiness.targetScore || 100} คะแนน ({readiness.criteriaName ?? 'ยังไม่มี'})
                  </span>
                  {readiness.criteriaName ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
              </div>

              {readiness.lastInvalidRowsCount > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-medium leading-relaxed">
                  ℹ️ มีแถวที่ไม่ผ่านจากการนำเข้าล่าสุด {readiness.lastInvalidRowsCount} แถว (สามารถเปิดรอบได้ตามปกติ)
                </div>
              )}

              {!readiness.isReady && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
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
            </ModalBody>
            <ModalFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowOpenModal(false)}
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                disabled={!readiness.isReady || openingRound}
                isLoading={openingRound}
                onClick={handleConfirmOpenRound}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                ยืนยันเปิดรับประเมิน
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>

      {/* Modal: Close Round Unsubmitted Check */}
      <Modal isOpen={showCloseModal && Boolean(closeCheck)} onClose={() => setShowCloseModal(false)} size="lg">
        {closeCheck && (
          <>
            <ModalHeader
              title="ยืนยันการปิดรอบการประเมิน"
              icon={PowerOff}
              onClose={() => setShowCloseModal(false)}
            />
            <ModalBody className="space-y-4">
              {closeModalError && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                  <span className="font-medium">{closeModalError}</span>
                </div>
              )}

              {closeCheck.unsubmittedCount === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium leading-relaxed flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>ผู้สมัครทุกคนได้รับการประเมินและส่งผล (Submitted) ครบถ้วนแล้ว สามารถปิดรอบได้ทันที</span>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-400 text-xs space-y-2">
                    <div className="font-bold flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-amber-600" />
                      พบผู้สมัครที่ยังไม่มีผลประเมิน Submitted ({closeCheck.unsubmittedCount} คน)
                    </div>
                    <p className="leading-relaxed">
                      หากปิดรอบ ผู้สมัครที่ไม่มีผลประเมินจะได้รับคะแนน 0.00 และผลการประเมินแบบร่างทั้งหมดจะถูกล็อกถาวร
                    </p>
                  </div>

                  {/* Unsubmitted List preview */}
                  <div className="max-h-40 overflow-y-auto border border-border/80 rounded-xl divide-y divide-border/60 text-xs bg-muted/30">
                    {closeCheck.applicants.map((a) => (
                      <div key={a.applicantId} className="p-2.5 flex items-center justify-between">
                        <span className="font-mono font-bold text-foreground">{a.studentCode}</span>
                        <span className="text-muted-foreground font-medium">{a.titlePrefix}{a.firstName} {a.lastName}</span>
                      </div>
                    ))}
                  </div>

                  <label className="flex items-start gap-2.5 pt-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acknowledged}
                      onChange={(e) => setAcknowledged(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-border text-destructive focus:ring-destructive cursor-pointer"
                    />
                    <span className="text-xs text-foreground font-medium select-none group-hover:text-foreground/80">
                      ข้าพเจ้ารับทราบว่ามีผู้สมัคร {closeCheck.unsubmittedCount} คนที่ยังไม่มีผลการประเมิน และยืนยันปิดรอบการประเมินนี้
                    </span>
                  </label>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCloseModal(false)}
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={closingRound || (closeCheck.unsubmittedCount > 0 && !acknowledged)}
                isLoading={closingRound}
                onClick={handleConfirmCloseRound}
              >
                ยืนยันปิดรอบทุน
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>

      {/* Import Applicants Modal */}
      {round && (
        <ImportApplicantModal
          roundId={round.id}
          roundName={round.name}
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            void loadData();
          }}
        />
      )}

      {/* Delete Draft Round Modal */}
      {round && round.status === 'DRAFT' && (
        <DeleteRoundModal
          isOpen={showDeleteModal}
          roundId={round.id}
          roundName={round.name}
          academicYear={round.academicYear}
          semester={round.semester}
          applicantCount={round.applicantCount}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => {
            setShowDeleteModal(false);
            router.push('/admin/scholarship-rounds');
          }}
        />
      )}

      {/* Modal: Link Criteria */}
      <Modal isOpen={showCriteriaModal} onClose={() => setShowCriteriaModal(false)} size="lg">
        <ModalHeader
          title="กำหนดชุดเกณฑ์การประเมินประจำรอบ"
          icon={Layers}
          onClose={() => setShowCriteriaModal(false)}
        />
        <form onSubmit={handleSaveCriteria}>
          <ModalBody className="space-y-4">
            {criteriaError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                <span>{criteriaError}</span>
              </div>
            )}

            <p className="text-xs text-muted-foreground leading-relaxed">
              เลือกชุดเกณฑ์การประเมินมาตรฐานเพื่อนำมาใช้ให้คะแนนผู้สมัครในรอบ <span className="font-semibold text-foreground">{round.name}</span>
            </p>

            <div className="space-y-1.5">
              <label htmlFor="selectCriteria" className="block text-xs font-semibold text-foreground">
                ชุดเกณฑ์การประเมิน <span className="text-destructive">*</span>
              </label>
              <Select
                id="selectCriteria"
                value={selectedCriteriaId || ''}
                onChange={(e) => setSelectedCriteriaId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">-- กรุณาเลือกชุดเกณฑ์ --</option>
                {criteriaList.map((crit) => (
                  <option key={crit.id} value={crit.id}>
                    {crit.name} (เป้าหมาย {crit.targetScore || 100} คะแนน, {crit.subCriteria?.length || 0} เกณฑ์ย่อย)
                  </option>
                ))}
              </Select>
            </div>

            {selectedCriteriaId && (
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 text-xs space-y-2">
                <span className="font-semibold text-foreground block">เกณฑ์ย่อยในชุดที่เลือก:</span>
                <div className="space-y-1">
                  {criteriaList
                    .find((c) => c.id === selectedCriteriaId)
                    ?.subCriteria?.map((sub, idx) => (
                      <div key={sub.id || idx} className="flex justify-between text-muted-foreground">
                        <span>{idx + 1}. {sub.title}</span>
                        <span className="font-mono font-medium">{sub.type === 'TEXT' ? 'ข้อความ' : `${sub.maxScore ?? '-'} คะแนน`}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCriteriaModal(false)}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={savingCriteria || !selectedCriteriaId}
              isLoading={savingCriteria}
            >
              บันทึกชุดเกณฑ์
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
