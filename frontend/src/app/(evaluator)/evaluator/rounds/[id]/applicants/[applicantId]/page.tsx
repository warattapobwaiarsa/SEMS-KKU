/**
 * หน้าประเมินแบบแบ่งจอ (Split-screen scoring page)
 * Route: /evaluator/rounds/[id]/applicants/[applicantId]
 *
 * ฝั่งซ้าย: ข้อมูลผู้สมัคร อ่านอย่างเดียว [FR-APP-03] [BR-APP-04]
 * ฝั่งขวา: ฟอร์มคะแนน + บันทึกอัตโนมัติทุก 3 วินาที [FR-EVL-08] + ปุ่มส่งผล [FR-EVL-11]
 *
 * ทุก request ส่ง header X-User-Id (mock auth ชั่วคราว จนกว่าจะมี KKU SSO [FR-AUTH-01])
 * ไม่แสดงคะแนนหรือชื่อผู้ประเมินคนอื่น [BR-SCR-01]
 */
'use client';

import { use, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { ApplicantProfilePanel } from '@/components/evaluator/applicant-profile-panel';
import { ScoreFormPanel } from '@/components/evaluator/score-form-panel';
import type {
  ScoreFormValue,
  ScoreFormValues,
} from '@/components/evaluator/score-input-row';
import { Save, Send } from 'lucide-react';
import {
  SaveStatusIndicator,
  type SaveStatus,
} from '@/components/evaluator/save-status-indicator';
import { SubmitConfirmModal } from '@/components/evaluator/submit-confirm-modal';
import {
  fetchApplicantDetail,
  fetchMyEvaluation,
  saveMyEvaluation,
  submitMyEvaluation,
} from '@/services/evaluation.service';
import { ApiError } from '@/lib/api-client';
import { useDebounce } from '@/lib/use-debounce';
import type {
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

// ตรวจค่าคะแนนทุกข้อ: ต้องเป็นจำนวนเต็ม 0 ถึง maxScore (ทศนิยมไม่ได้ตาม backend) [FR-EVL-05] [BR-EVL-03]
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
    const max = item.subCriteria.maxScore;
    if (!Number.isInteger(numberValue) || numberValue < 0 || max === null || numberValue > max) {
      errors[item.subCriteriaId] = `คะแนนต้องเป็นจำนวนเต็มตั้งแต่ 0 ถึง ${max ?? '-'}`;
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

// สร้าง body ของ PUT — ส่งเฉพาะฟิลด์ที่ตรงกับประเภทข้อเท่านั้น (ผิด types -> backend ตอบ 400)
// คะแนนที่ยังไม่กรอกต้องเป็น null ห้ามเป็น 0 [FR-EVL-07] [BR-EVL-07]
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

// แปลง error เป็นข้อความไทย (404/401 ใช้ข้อความของหน้านี้ ส่วนที่เหลือ error-messages.ts แปลงไว้แล้ว)
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
  return 'เกิดข้อผิดพลาดในการทำรายการ';
}

// ---------- Component ----------

export default function EvaluatorScoringPage({
  params,
}: {
  params: Promise<{ id: string; applicantId: string }>;
}) {
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

  // refs สำหรับ auto-save: ใช้ค่าล่าสุดโดยไม่ต้องรอ re-render
  const dirtyRef = useRef(false); // มีการแก้ไขที่ยังไม่ได้บันทึก
  const valuesRef = useRef<ScoreFormValues>({}); // ค่าฟอร์มล่าสุด
  const saveFnRef = useRef<() => Promise<boolean>>(async () => true);

  // ค่าที่ debounce 3 วินาที -> ใช้เป็นตัวกระตุ้น auto-save [FR-EVL-08]
  const debouncedValues = useDebounce(values, 3000);

  // ค่าที่โหลดมาเริ่มต้น (ใช้ตอน mount ครั้งเดียว)
  useEffect(() => {
    let cancelled = false;
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
  // useMemo กัน object ใหม่ทุก render ซึ่งทำให้ useCallback ข้างล่างไม่เสถียร
  const items = useMemo(() => evaluation?.items ?? [], [evaluation]);
  const scoreErrors = validateScores(values, items);
  const hasErrors = Object.keys(scoreErrors).length > 0;
  const { total: totalScore, maxTotal } = calcTotal(values, items);

  // บันทึก (PUT) — คืน true ถ้าผ่าน (รวมกรณีไม่ต้องบันทึก)
  const doSave = useCallback(async (): Promise<boolean> => {
    // ไม่ต้องบันทึก: อ่านอย่างเดียว / ไม่มีอะไรแก้ / ค่ายังไม่ถูกต้อง
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
        // ไม่มีใครพิมพ์เพิ่มระหว่างรอ -> ถือว่าบันทึกจบแล้ว
        dirtyRef.current = false;
        setSaveStatus('saved');
      } else {
        // มีการพิมพ์ระหว่างรอ -> ยังถือว่ามีของที่ยังไม่บันทึก
        setSaveStatus('dirty');
      }
      return true;
    } catch (error) {
      setSaveStatus('error');
      setSaveError(toThaiError(error));
      return false;
    }
  }, [applicantId, items, readOnly, hasErrors]);

  // เก็บฟังก์ชัน save ล่าสุดไว้ใน ref เพื่อให้ effect เรียกค่าล่าสุดได้
  useEffect(() => {
    saveFnRef.current = doSave;
  });

  // Auto-save: เรียก PUT เมื่อค่าหยุดเปลี่ยน 3 วินาที (ข้ามตอน mount เพราะยังไม่มีแก้ไข) [FR-EVL-08]
  useEffect(() => {
    saveFnRef.current();
  }, [debouncedValues]);

  // เตือนก่อนปิดหน้า ถ้ายังมีของที่ยังไม่ได้บันทึก (แบบง่าย ๆ)
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
    // แก้ฟอร์มแล้ว -> ล้างข้อความผิดพลาดเดิมของการส่งผล
    setSubmitError(null);
    setMissingItems([]);
    setSuccessMessage(null);
  };

  // ปุ่ม "บันทึกร่าง" — บันทึกทันที
  const handleSaveNow = () => {
    void saveFnRef.current();
  };

  // ปุ่ม "ส่งผลการประเมิน" — บันทึกของที่ค้างอยู่ก่อน แล้วค่อยเปิด modal ยืนยัน
  const handleSubmitClick = async () => {
    setSubmitError(null);
    setMissingItems([]);
    if (hasErrors) {
      setSubmitError('กรอกคะแนนไม่ถูกต้อง กรุณาแก้ไขก่อนส่งผลการประเมิน');
      return;
    }
    if (dirtyRef.current) {
      const saved = await doSave();
      if (!saved) return; // บันทึกไม่ผ่าน -> ไม่เปิด modal
    }
    setModalOpen(true);
  };

  // ยืนยันใน modal -> เรียก POST submit
  const handleConfirmSubmit = async () => {
    if (submitting) return; // กันกดซ้ำ (double-click)
    setSubmitting(true);
    try {
      const result = await submitMyEvaluation(applicantId);
      setEvaluation(result);
      dirtyRef.current = false;
      setSaveStatus('idle');
      setModalOpen(false);
      setSuccessMessage('ส่งผลการประเมินสำเร็จ ไม่สามารถแก้ไขได้อีก');
    } catch (error) {
      setModalOpen(false);
      if (error instanceof ApiError && error.errorCode === 'SCORES_INCOMPLETE') {
        // คะแนนไม่ครบ -> แสดงหัวข้อที่ขาด แล้วให้แก้ฟอร์มต่อ
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

  return (
    <div className="flex-1 flex flex-col lg:h-[calc(100vh-5rem)] lg:overflow-hidden -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-6 space-y-3 sm:space-y-4">
      <div className="shrink-0 space-y-3">
        <PageHeader
          title={`ประเมินผล: ${fullName}`}
          description={`รหัสนักศึกษา: ${detail.studentCode}`}
          backHref={`/evaluator/rounds/${roundId}/applicants`}
          backLabel="กลับหน้ารายชื่อผู้สมัคร"
          action={
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap justify-end">
              {/* Unified Studio Status Capsule Bar */}
              <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-card border border-border/80 shadow-2xs backdrop-blur-sm">
                {/* 1. สถานะการบันทึกอัตโนมัติ (แสดงเมื่อมีสถานะ) */}
                {!readOnly && saveStatus !== 'idle' && (
                  <>
                    <SaveStatusIndicator status={saveStatus} savedAt={savedAt} />
                    <div className="h-4 w-px bg-border/80" />
                  </>
                )}

                {/* 2. คะแนนรวม */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground font-medium">คะแนน:</span>
                  <span className="font-mono font-bold text-sm sm:text-base text-primary">
                    {readOnly && evaluation.status === 'SUBMITTED' && evaluation.totalScore !== null
                      ? evaluation.totalScore
                      : totalScore}
                  </span>
                  <span className="font-mono text-muted-foreground text-[11px]">/ {maxTotal}</span>
                </div>

                {/* เส้นคั่น */}
                <div className="h-4 w-px bg-border/80" />

                {/* 3. ฉบับ (ฉบับร่าง / ส่งแล้ว) */}
                <StatusBadge label={statusBadge.label} variant={statusBadge.variant} />
              </div>
            </div>
          }
        />

        {/* แบนเนอร์: ส่งผลสำเร็จ */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
            ✓ {successMessage}
            {evaluation.submittedAt && (
              <span className="block mt-0.5 text-xs text-emerald-600">
                ส่งผลเมื่อ {new Date(evaluation.submittedAt).toLocaleString('th-TH')}
              </span>
            )}
          </div>
        )}

        {/* แบนเนอร์: อ่านอย่างเดียว (ส่งผลแล้ว) */}
        {readOnly && evaluation.status === 'SUBMITTED' && (
          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-300 text-sm text-slate-700">
            🔒 ส่งผลการประเมินแล้ว
            {evaluation.submittedAt &&
              ` เมื่อ ${new Date(evaluation.submittedAt).toLocaleString('th-TH')}`}{' '}
            ไม่สามารถแก้ไขได้
          </div>
        )}

        {/* แบนเนอร์: อ่านอย่างเดียว (รอบปิดระหว่างเขียน Draft) */}
        {readOnly && evaluation.isLocked && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
            ⚠ รอบทุนนี้ปิดการประเมินแล้ว ไม่สามารถแก้ไขหรือส่งผลการประเมินเพิ่มเติมได้
          </div>
        )}

        {/* แบนเนอร์: บันทึกไม่สำเร็จ */}
        {saveError && saveStatus === 'error' && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
            บันทึกไม่สำเร็จ: {saveError}
          </div>
        )}

        {/* แบนเนอร์: ส่งผลไม่สำเร็จ (เช่น คะแนนไม่ครบ) */}
        {submitError && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive space-y-2">
            <p className="font-semibold flex items-center gap-1.5">
              <span>⚠</span> {submitError}
            </p>
            {missingItems.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground block">
                  คลิกที่หัวข้อเพื่อเลื่อนไปยังข้อที่ยังกรอกไม่ครบ:
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
                            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-destructive/15 hover:bg-destructive/25 text-destructive transition cursor-pointer"
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

      {/* Main Studio Workspace: 2 คอลัมน์แยก scroll อิสระบน desktop */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
        {/* ฝั่งซ้าย: ข้อมูลผู้สมัคร (อ่านอย่างเดียว) สัดส่วน 5/12 */}
        <div className="lg:col-span-5 h-full overflow-y-auto pr-1 lg:pr-2 custom-scrollbar">
          <ApplicantProfilePanel detail={detail} />
        </div>

        {/* ฝั่งขวา: ฟอร์มคะแนน สัดส่วน 7/12 */}
        <div className="lg:col-span-7 h-full flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto pr-1 lg:pr-2 space-y-4 custom-scrollbar">
            <ScoreFormPanel
              items={items}
              values={values}
              scoreErrors={scoreErrors}
              readOnly={readOnly}
              totalScore={totalScore}
              maxTotal={maxTotal}
              onChange={handleChange}
            />

            {/* คะแนนรวมสุดท้าย (ฝั่ง server) หลังส่งผลแล้ว */}
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
            <div className="shrink-0 pt-3">
              <div className="p-3.5 bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-sm flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleSaveNow}
                  disabled={saveStatus === 'saving'}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-border bg-background hover:bg-muted text-foreground transition disabled:opacity-50 cursor-pointer shadow-2xs btn-interactive"
                >
                  <Save className="w-3.5 h-3.5 text-muted-foreground" />
                  บันทึกร่างทันที
                </button>
                <button
                  type="button"
                  onClick={handleSubmitClick}
                  disabled={submitting || saveStatus === 'saving'}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer btn-interactive"
                >
                  <Send className="w-3.5 h-3.5" />
                  ส่งผลการประเมิน
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal ยืนยันส่งผล */}
      <SubmitConfirmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmSubmit}
        applicantName={fullName}
        studentCode={detail.studentCode}
        totalScore={totalScore}
        maxTotal={maxTotal}
        submitting={submitting}
      />
    </div>
  );
}
