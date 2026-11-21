/**
 * หน้าประเมินแบบแบ่งจอ (Split-screen scoring page)
 * Route: /evaluator/rounds/[id]/applicants/[applicantId]
 *
 * ฝั่งซ้าย: ข้อมูลผู้สมัคร อ่านอย่างเดียว [FR-APP-03] [BR-APP-04]
 * ฝั่งขวา: ฟอร์มคะแนน + บันทึกอัตโนมัติทุก 3 วินาที [FR-EVL-08] + ปุ่มส่งผล [FR-EVL-11]
 *
 * อัปเกรด Sprint 1:
 * - Resizable Split Pane พร้อมโหมด Focus Mode / Presets
 * - Sequential Navigation Bar สลับผู้สมัคร [คนก่อนหน้า] - [คนถัดไป] พร้อม Unsaved State Guard
 * - Cloud Auto-save indicator นุ่มนวล
 *
 * ทุก request ส่ง header X-User-Id (mock auth ชั่วคราว จนกว่าจะมี KKU SSO [FR-AUTH-01])
 * ไม่แสดงคะแนนหรือชื่อผู้ประเมินคนอื่น [BR-SCR-01]
 */
'use client';

import { use, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { ApplicantProfilePanel } from '@/components/evaluator/applicant-profile-panel';
import { ScoreFormPanel } from '@/components/evaluator/score-form-panel';
import type {
  ScoreFormValue,
  ScoreFormValues,
} from '@/components/evaluator/score-input-row';
import { Save, Send, ArrowLeft, ArrowRight } from 'lucide-react';
import {
  SaveStatusIndicator,
  type SaveStatus,
} from '@/components/evaluator/save-status-indicator';
import { SubmitConfirmModal } from '@/components/evaluator/submit-confirm-modal';
import { ResizableSplitPane } from '@/components/evaluator/resizable-split-pane';
import { SequentialNavigationBar } from '@/components/evaluator/sequential-navigation-bar';
import {
  fetchApplicantDetail,
  fetchMyEvaluation,
  saveMyEvaluation,
  submitMyEvaluation,
  fetchEvaluatorApplicants,
} from '@/services/evaluation.service';
import { ApiError } from '@/lib/api-client';
import { useDebounce } from '@/lib/use-debounce';
import type {
  EvaluatorApplicant,
  EvaluatorApplicantDetail,
  MyEvaluationItem,
  MyEvaluationView,
  SaveEvaluationItem,
} from '@/types/evaluation';

// ---------- ฟังก์ชันช่วย (แยกไว้ให้อ่านง่าย) ----------

// ค่าฟอร์มว่างของ 1 ข้อ
function emptyValue(): ScoreFormValue {
  return { score: '', comment: '', textValue: '' };
}

// สร้างค่าฟอร์มเริ่มต้นจากผลประเมินที่โหลดมา (null -> ค่าว่าง) [FR-EVL-07]
function buildInitialValues(items: MyEvaluationItem[]): ScoreFormValues {
  const result: ScoreFormValues = {};
  for (const item of items) {
    result[item.subCriteriaId] = {
      score: item.score === null ? '' : String(item.score),
      comment: item.comment ?? '',
      textValue: item.textValue ?? '',
    };
  }
  return result;
}

// ตรวจค่าคะแนนทุกข้อ: ต้องเป็นจำนวนเต็ม >= 0 (ทศนิยมไม่ได้ตาม backend) [FR-EVL-05] [BR-EVL-03]
function validateScores(
  values: ScoreFormValues,
  items: MyEvaluationItem[],
): Record<number, string> {
  const errors: Record<number, string> = {};
  for (const item of items) {
    if (item.subCriteria.type !== 'SCORED') continue;
    const raw = values[item.subCriteriaId]?.score ?? '';
    if (raw === '') continue; // ยังไม่กรอก = ยังไม่ผิด แต่ส่งผลไม่ได้
    const numberValue = Number(raw);
    if (!Number.isInteger(numberValue) || numberValue < 0) {
      errors[item.subCriteriaId] = 'คะแนนต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป';
    }
  }
  return errors;
}

// คำนวณคะแนนรวมสด: บวกเฉพาะเกณฑ์ SCORED ที่กรอกแล้ว (TEXT ไม่นับ, ว่างไม่บวกเป็น 0) [FR-SCR-02] [BR-SCR-02]
function calcTotal(
  values: ScoreFormValues,
  items: MyEvaluationItem[],
): { total: number; maxTotal: number } {
  let total = 0;
  let maxTotal = 0;
  for (const item of items) {
    if (item.subCriteria.type !== 'SCORED') continue;
    maxTotal += item.subCriteria.maxScore ?? 0;
    const raw = values[item.subCriteriaId]?.score ?? '';
    if (raw === '') continue;
    const numberValue = Number(raw);
    if (Number.isInteger(numberValue) && numberValue >= 0) {
      total += numberValue;
    }
  }
  return { total, maxTotal };
}

// สร้าง body ของ PUT — ส่งเฉพาะฟิลด์ที่ตรงกับประเภทข้อเท่านั้น
function buildPayload(
  values: ScoreFormValues,
  items: MyEvaluationItem[],
): SaveEvaluationItem[] {
  return items.map((item) => {
    const value = values[item.subCriteriaId] ?? emptyValue();
    const payload: SaveEvaluationItem = { subCriteriaId: item.subCriteriaId };
    if (item.subCriteria.type === 'SCORED') {
      payload.score = value.score === '' ? null : Number(value.score);
    } else {
      payload.textValue = value.textValue === '' ? null : value.textValue;
    }
    if (item.subCriteria.allowComment) {
      payload.comment = value.comment === '' ? null : value.comment;
    }
    return payload;
  });
}

// แปลง error เป็นข้อความไทย
function toThaiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.statusCode === 404) {
      return 'ไม่พบผู้สมัครหรือรอบนี้ยังไม่เปิดรับการประเมิน';
    }
    if (error.statusCode === 401) {
      return 'กรุณาเข้าสู่ระบบก่อนดำเนินการ';
    }
    return error.message;
  }
  if (
    error instanceof Error &&
    (error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.name === 'TypeError')
  ) {
    return 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ Failed to fetch (เซิร์ฟเวอร์ Backend อาจกำลังเริ่มต้นระบบ กรุณารอสักครู่แล้วลองใหม่)';
  }
  return 'เกิดข้อผิดพลาดในการทำรายการ';
}

// ---------- Component ----------

export default function EvaluatorScoringPage({
  params,
}: {
  params: Promise<{ id: string; applicantId: string }>;
}) {
  const router = useRouter();

  // อ่านค่าจาก URL: roundId + applicantId (params เป็น Promise ใน Next 16 ต้องใช้ use())
  const routeParams = use(params);
  const roundId = parseInt(routeParams.id, 10);
  const applicantId = parseInt(routeParams.applicantId, 10);

  // ข้อมูลหลัก
  const [detail, setDetail] = useState<EvaluatorApplicantDetail | null>(null);
  const [evaluation, setEvaluation] = useState<MyEvaluationView | null>(null);
  const [values, setValues] = useState<ScoreFormValues>({});
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // รายชื่อผู้สมัครทั้งหมดในรอบนี้ (สำหรับ Sequential Navigation)
  const [roundApplicants, setRoundApplicants] = useState<EvaluatorApplicant[]>([]);

  // สถานะบันทึกอัตโนมัติ
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // สถานะส่งผล
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [missingItems, setMissingItems] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // refs สำหรับ auto-save
  const dirtyRef = useRef(false);
  const valuesRef = useRef<ScoreFormValues>({});
  const saveFnRef = useRef<() => Promise<boolean>>(async () => true);

  // ค่าที่ debounce 3 วินาที -> ใช้เป็นตัวกระตุ้น auto-save [FR-EVL-08]
  const debouncedValues = useDebounce(values, 3000);

  // โหลดรายชื่อผู้สมัครทั้งรอบ (ทำครั้งเดียวเมื่อ roundId พร้อม)
  useEffect(() => {
    let cancelled = false;
    fetchEvaluatorApplicants(roundId, { limit: 100 })
      .then((res) => {
        if (!cancelled && res.data) {
          setRoundApplicants(res.data);
        }
      })
      .catch((err) => {
        console.warn('Cannot load applicant list for sequential navigation:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [roundId]);

  // ค่าที่โหลดมาเริ่มต้นของ applicant คนนี้
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    dirtyRef.current = false;
    setSaveStatus('idle');
    setSubmitError(null);
    setMissingItems([]);
    setSuccessMessage(null);

    Promise.all([fetchApplicantDetail(applicantId), fetchMyEvaluation(applicantId)])
      .then(([applicantDetail, myEvaluation]) => {
        if (cancelled) return;
        setDetail(applicantDetail);
        setEvaluation(myEvaluation);
        const initialValues = buildInitialValues(myEvaluation.items);
        setValues(initialValues);
        valuesRef.current = initialValues;
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setPageError(toThaiError(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applicantId]);

  // โหมดอ่านอย่างเดียว: ส่งผลแล้ว หรือ Draft ในรอบที่ปิดแล้ว
  const readOnly = evaluation !== null && (evaluation.status === 'SUBMITTED' || evaluation.isLocked);
  const items = useMemo(() => evaluation?.items ?? [], [evaluation]);
  const scoreErrors = validateScores(values, items);
  const hasErrors = Object.keys(scoreErrors).length > 0;
  const { total: totalScore, maxTotal } = calcTotal(values, items);

  // บันทึก (PUT) — คืน true ถ้าผ่าน (รวมกรณีไม่ต้องบันทึก)
  const doSave = useCallback(async (): Promise<boolean> => {
    if (readOnly || !dirtyRef.current) return true;
    if (hasErrors) return true;

    const snapshot = valuesRef.current;
    setSaveStatus('saving');
    setSaveError(null);
    try {
      const result = await saveMyEvaluation(applicantId, buildPayload(snapshot, items));
      setEvaluation(result);
      setSavedAt(
        new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      );
      if (valuesRef.current === snapshot) {
        dirtyRef.current = false;
        setSaveStatus('saved');
      } else {
        setSaveStatus('dirty');
      }
      return true;
    } catch (error) {
      setSaveStatus('error');
      setSaveError(toThaiError(error));
      return false;
    }
  }, [applicantId, items, readOnly, hasErrors]);

  useEffect(() => {
    saveFnRef.current = doSave;
  });

  // Auto-save: เรียก PUT เมื่อค่าหยุดเปลี่ยน 3 วินาที [FR-EVL-08]
  useEffect(() => {
    saveFnRef.current();
  }, [debouncedValues]);

  // เตือนก่อนปิดหน้า ถ้ายังมีของที่ยังไม่ได้บันทึก
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        event.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ผู้ใช้พิมพ์ค่าใหม่ -> อัปเดตฟอร์ม + เตรียม auto-save
  const handleChange = (
    subCriteriaId: number,
    field: keyof ScoreFormValue,
    value: string,
  ) => {
    const next: ScoreFormValues = {
      ...values,
      [subCriteriaId]: { ...(values[subCriteriaId] ?? emptyValue()), [field]: value },
    };
    setValues(next);
    valuesRef.current = next;
    dirtyRef.current = true;
    if (!readOnly) {
      setSaveStatus('dirty');
      setSaveError(null);
    }
    setSubmitError(null);
    setMissingItems([]);
    setSuccessMessage(null);
  };

  // ปุ่ม "บันทึกร่าง" — บันทึกทันที
  const handleSaveNow = () => {
    void saveFnRef.current();
  };

  // ปุ่ม "ส่งผลการประเมิน"
  const handleSubmitClick = async () => {
    setSubmitError(null);
    setMissingItems([]);
    if (hasErrors) {
      setSubmitError('กรอกคะแนนไม่ถูกต้อง กรุณาแก้ไขก่อนส่งผลการประเมิน');
      return;
    }
    if (dirtyRef.current) {
      const saved = await doSave();
      if (!saved) return;
    }
    setModalOpen(true);
  };

  // ยืนยันใน modal -> เรียก POST submit
  const handleConfirmSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await submitMyEvaluation(applicantId);
      setEvaluation(result);
      dirtyRef.current = false;
      setSaveStatus('idle');
      setModalOpen(false);
      // นำทางกลับสู่หน้ารายชื่อผู้สมัคร เพื่อให้ผู้ประเมินเลือกรายชื่อถัดไปด้วยตนเอง
      router.push(`/evaluator/rounds/${roundId}/applicants`);
    } catch (error) {
      setModalOpen(false);
      if (error instanceof ApiError && error.errorCode === 'SCORES_INCOMPLETE') {
        const rawItems = error.params?.items;
        setMissingItems(Array.isArray(rawItems) ? (rawItems as string[]) : []);
        setSubmitError(error.message);
      } else {
        setSubmitError(toThaiError(error));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // สลับไปยังผู้สมัครเป้าหมาย พร้อม Unsaved Guard [FR-EVL-08]
  const handleNavigateApplicant = useCallback(
    async (targetId: number): Promise<boolean> => {
      if (hasErrors) {
        setSubmitError('คะแนนในข้อที่ระบุไม่ถูกต้อง กรุณาแก้ไขก่อนเปลี่ยนหน้าผู้สมัคร');
        return false;
      }
      if (dirtyRef.current) {
        const saved = await doSave();
        if (!saved) {
          setSubmitError('ไม่สามารถบันทึกร่างข้อมูลได้ กรุณาลองใหม่อีกครั้งก่อนเปลี่ยนหน้า');
          return false;
        }
      }
      router.push(`/evaluator/rounds/${roundId}/applicants/${targetId}`);
      return true;
    },
    [doSave, hasErrors, roundId, router],
  );

  // ป้ายสถานะของฉันบนหัวหน้าจอ
  const statusBadge = !evaluation
    ? { label: 'ยังไม่ประเมิน', variant: 'neutral' as const }
    : evaluation.status === 'SUBMITTED'
      ? { label: 'ส่งแล้ว', variant: 'success' as const }
      : { label: 'ฉบับร่าง', variant: 'draft' as const };

  // ---------- สถานะโหลด ----------
  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <PageHeader
          title="กำลังโหลดข้อมูล..."
          backHref={`/evaluator/rounds/${roundId}/applicants`}
          backLabel="กลับหน้ารายชื่อผู้สมัคร"
        />
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="animate-pulse h-8 w-2/3 bg-slate-200 rounded" />
            <div className="animate-pulse h-32 bg-slate-200 rounded-xl" />
            <div className="animate-pulse h-64 bg-slate-200 rounded-xl" />
          </div>
          <div className="lg:col-span-3 space-y-3">
            <div className="animate-pulse h-8 w-1/2 bg-slate-200 rounded" />
            <div className="animate-pulse h-24 bg-slate-200 rounded-xl" />
            <div className="animate-pulse h-24 bg-slate-200 rounded-xl" />
            <div className="animate-pulse h-24 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // ---------- สถานะข้อผิดพลาด (เช่น 404) ----------
  if (pageError !== null || detail === null || evaluation === null) {
    return (
      <div className="flex-1 flex flex-col">
        <PageHeader
          title="หน้าประเมินผล"
          backHref={`/evaluator/rounds/${roundId}/applicants`}
          backLabel="กลับหน้ารายชื่อผู้สมัคร"
        />
        <div className="mt-6 p-6 rounded-xl bg-rose-50 border border-rose-200 text-center">
          <p className="text-sm font-semibold text-rose-700">
            {pageError ?? 'เกิดข้อผิดพลาดในการทำรายการ'}
          </p>
          <a
            href={`/evaluator/rounds/${roundId}/applicants`}
            className="mt-4 inline-flex px-4 py-2 text-sm font-medium rounded-xl border border-rose-300 bg-white text-rose-700 hover:bg-rose-100 transition"
          >
            กลับหน้ารายชื่อผู้สมัคร
          </a>
        </div>
      </div>
    );
  }

  const fullName = `${detail.titlePrefix}${detail.firstName} ${detail.lastName}`.trim();
  const currIdx = roundApplicants.findIndex((a) => a.id === applicantId);
  const nextApplicant =
    currIdx >= 0 && currIdx < roundApplicants.length - 1 ? roundApplicants[currIdx + 1] : null;

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-2 select-none">
      {/* ส่วนหัวหน้าจอประเมินแบบกะทัดรัด (Compact Studio Header Ribbon) */}
      <div className="shrink-0 space-y-2">
        <div className="bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl p-2.5 sm:p-3 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
          {/* ซ้าย: ปุ่มย้อนกลับ + ข้อมูลผู้สมัคร */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={async () => {
                if (dirtyRef.current) {
                  const saved = await doSave();
                  if (!saved) {
                    const leave = window.confirm('การบันทึกร่างยังไม่สำเร็จ ต้องการกลับหน้ารายชื่อหรือไม่?');
                    if (!leave) return;
                  }
                }
                router.push(`/evaluator/rounds/${roundId}/applicants`);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition shrink-0 shadow-2xs btn-interactive cursor-pointer"
              title="กลับหน้ารายชื่อผู้สมัคร"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">รายชื่อ</span>
            </button>

            <div className="h-5 w-px bg-border/80 hidden sm:block" />

            <div className="min-w-0 truncate">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold text-foreground truncate">
                  {fullName}
                </h1>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
                  {detail.studentCode}
                </span>
                <span className="text-xs text-muted-foreground truncate hidden md:inline">
                  คณะ{detail.faculty}
                </span>
              </div>
            </div>
          </div>

          {/* ขวา: Studio Status Capsule (Auto-Save, Live Score, Status) */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end shrink-0">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/80 shadow-2xs backdrop-blur-sm">
              {/* 1. สถานะการบันทึกอัตโนมัติ */}
              {!readOnly && saveStatus !== 'idle' && (
                <>
                  <SaveStatusIndicator status={saveStatus} savedAt={savedAt} />
                  <div className="h-3.5 w-px bg-border/80" />
                </>
              )}

              {/* 2. คะแนนรวม */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground font-medium">คะแนนรวม:</span>
                <span className="font-mono font-bold text-sm sm:text-base text-primary">
                  {readOnly && evaluation.status === 'SUBMITTED' && evaluation.totalScore !== null
                    ? evaluation.totalScore
                    : totalScore}
                </span>
                <span className="font-mono text-muted-foreground text-xs">/ {maxTotal}</span>
              </div>

              {/* เส้นคั่น */}
              <div className="h-3.5 w-px bg-border/80" />

              {/* 3. ฉบับ (ฉบับร่าง / ส่งแล้ว) */}
              <StatusBadge label={statusBadge.label} variant={statusBadge.variant} />
            </div>
          </div>
        </div>

        {/* แถบนำทางต่อเนื่องระหว่างผู้สมัคร (Sequential Navigation Bar) */}
        <SequentialNavigationBar
          roundId={roundId}
          currentApplicantId={applicantId}
          applicants={roundApplicants}
          onNavigate={handleNavigateApplicant}
          isSaving={saveStatus === 'saving'}
        />

        {/* แบนเนอร์แจ้งเตือนสถานะต่าง ๆ */}
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 flex items-center justify-between gap-3 flex-wrap animate-spring-pop">
            <div className="space-y-0.5">
              <span className="font-semibold">✓ {successMessage}</span>
              {evaluation.submittedAt && (
                <span className="block text-xs text-emerald-600">
                  ส่งผลเมื่อ {new Date(evaluation.submittedAt).toLocaleString('th-TH')}
                </span>
              )}
            </div>
            {nextApplicant && (
              <button
                type="button"
                onClick={() => void handleNavigateApplicant(nextApplicant.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition shadow-2xs cursor-pointer btn-interactive"
              >
                <span>ประเมินคนถัดไป: {nextApplicant.firstName}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {readOnly && evaluation.status === 'SUBMITTED' && (
          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-xs sm:text-sm text-slate-700">
            🔒 ส่งผลการประเมินแล้ว
            {evaluation.submittedAt &&
              ` เมื่อ ${new Date(evaluation.submittedAt).toLocaleString('th-TH')}`}{' '}
            ไม่สามารถแก้ไขได้
          </div>
        )}

        {readOnly && evaluation.isLocked && (
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-800">
            ⚠ รอบทุนนี้ปิดการประเมินแล้ว ไม่สามารถแก้ไขหรือส่งผลการประเมินเพิ่มเติมได้
          </div>
        )}

        {saveError && saveStatus === 'error' && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700">
            บันทึกไม่สำเร็จ: {saveError}
          </div>
        )}

        {submitError && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border-2 border-red-400 dark:border-red-700 text-xs sm:text-sm text-red-800 dark:text-red-200 space-y-2 shadow-xs animate-spring-pop">
            <p className="font-bold text-red-700 dark:text-red-300 flex items-center gap-1.5">
              <span>⚠</span> {submitError}
            </p>
            {missingItems.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs text-red-600/90 dark:text-red-300/90 font-medium block">
                  คลิกที่ปุ่มเพื่อเลื่อนไปยังข้อที่ยังไม่ได้กรอก:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {missingItems.map((title) => {
                    const matchedItem = items.find((it) => it.subCriteria.title === title);
                    return (
                      <button
                        key={title}
                        type="button"
                        onClick={() => {
                          if (matchedItem) {
                            const el = document.getElementById(`criteria-row-${matchedItem.subCriteriaId}`);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              el.classList.add('ring-2', 'ring-red-500', 'bg-red-50/60');
                              setTimeout(() => {
                                el.classList.remove('ring-2', 'ring-red-500', 'bg-red-50/60');
                              }, 2500);
                            }
                          }
                        }}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-2xs transition cursor-pointer"
                      >
                        • {title}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Studio Workspace: Resizable Split Pane พร้อม Focus Mode */}
      <div className="flex-1 min-h-0 flex flex-col">
        <ResizableSplitPane
          leftTitle="ข้อมูลผู้สมัคร"
          rightTitle="แบบประเมินคะแนน"
          leftContent={<ApplicantProfilePanel detail={detail} />}
          rightContent={
            <div className="h-full flex flex-col min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 lg:pr-2 space-y-4 custom-scrollbar">
                <ScoreFormPanel
                  items={items}
                  values={values}
                  scoreErrors={scoreErrors}
                  readOnly={readOnly}
                  totalScore={totalScore}
                  maxTotal={maxTotal}
                  onChange={handleChange}
                />

                {/* คะแนนรวมสุดท้ายหลังส่งผล */}
                {readOnly && evaluation.status === 'SUBMITTED' && evaluation.totalScore !== null && (
                  <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
                    <span className="font-semibold text-emerald-800">คะแนนรวมสุดท้าย</span>
                    <span className="font-bold font-mono text-emerald-800">
                      {evaluation.totalScore}{' '}
                      <span className="text-sm font-normal">/ {maxTotal}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* แถบปุ่มบันทึก/ส่งผล (ตรึงล่างฝั่งขวา) */}
              {!readOnly && (
                <div className="shrink-0 pt-2.5">
                  <div className="p-3 bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-sm flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      ระบบบันทึกร่างให้อัตโนมัติทุก 3 วินาที หรือคลิกปุ่มเพื่อดำเนินการ
                    </span>
                    <div className="flex items-center gap-2.5 ml-auto">
                      <button
                        type="button"
                        onClick={handleSaveNow}
                        disabled={saveStatus === 'saving'}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-border bg-background hover:bg-muted text-foreground transition disabled:opacity-50 cursor-pointer shadow-2xs btn-interactive"
                      >
                        <Save className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>บันทึกร่างทันที</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitClick}
                        disabled={submitting || saveStatus === 'saving'}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer btn-interactive"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>ส่งผลการประเมิน</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          }
        />
      </div>

      {/* Modal ยืนยันส่งผล */}
      <SubmitConfirmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmSubmit}
        applicantName={fullName}
        studentCode={detail.studentCode}
        faculty={detail.faculty}
        totalScore={totalScore}
        maxTotal={maxTotal}
        submitting={submitting}
        items={items}
        values={values}
        onJumpToCriteria={(id) => {
          const el = document.getElementById(`criteria-row-${id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-red-500', 'bg-red-50/60');
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-red-500', 'bg-red-50/60');
            }, 2500);
          }
        }}
      />
    </div>
  );
}
