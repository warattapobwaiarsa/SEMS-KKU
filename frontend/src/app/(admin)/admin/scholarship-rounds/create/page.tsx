'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createRound } from '@/services/rounds.service';
import { fetchScholarshipTypes } from '@/services/scholarship-types.service';
import {
  uploadAndPreviewExcel,
  confirmImportApplicants,
} from '@/services/applicants.service';
import {
  ScholarshipTypeListItem,
  ScholarshipTypeDetail,
  NestedSubCriteriaItem,
} from '@/types/scholarship-type';
import { CreateRoundPayload } from '@/types/rounds';
import { ExcelPreviewResponse } from '@/types/applicants';
import {
  ArrowRight,
  AlertCircle,
  Award,
  CheckCircle2,
  Upload,
  FileSpreadsheet,
  Plus,
  Sliders,
  Check,
  X,
} from 'lucide-react';
import {
  Select,
  PageHeader,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Alert,
  Badge,
} from '@/components/ui';
import { CriteriaBuilder } from '@/components/scholarship-types/criteria-builder';
import { QuickCreateScholarshipTypeModal } from '@/components/scholarship-types/quick-create-scholarship-type-modal';

type CriteriaMode = 'DEFAULT' | 'CUSTOM';

export interface FormFieldErrors {
  scholarshipTypeId?: string;
  academicYear?: string;
  semester?: string;
  name?: string;
  customCriteriaName?: string;
  criteriaScoreSum?: string;
  subCriteriaTitles?: string;
  file?: string;
  general?: string;
}

export default function CreateScholarshipRoundPage() {
  const router = useRouter();

  // Basic Info State
  const [name, setName] = useState('');
  const [academicYear, setAcademicYear] = useState<number>(2569);
  const [semester, setSemester] = useState<number>(1);
  const [scholarshipTypeId, setScholarshipTypeId] = useState<number | undefined>(undefined);
  const [scholarshipTypes, setScholarshipTypes] = useState<ScholarshipTypeListItem[]>([]);

  // Criteria Configuration State
  const [criteriaMode, setCriteriaMode] = useState<CriteriaMode>('DEFAULT');
  const [customCriteriaName, setCustomCriteriaName] = useState('');
  const [customTargetScore, setCustomTargetScore] = useState<number>(100);
  const [customSubCriteria, setCustomSubCriteria] = useState<NestedSubCriteriaItem[]>([
    { sortOrder: 1, title: 'รายได้เฉลี่ยต่อครอบครัวต่อปี', type: 'SCORED', maxScore: 40, allowComment: true },
    { sortOrder: 2, title: 'ภาระหนี้สินและความจำเป็นเร่งด่วน', type: 'SCORED', maxScore: 30, allowComment: true },
    { sortOrder: 3, title: 'ผลการเรียนเฉลี่ยและความประพฤติ', type: 'SCORED', maxScore: 30, allowComment: true },
    { sortOrder: 4, title: 'ความคิดเห็นเพิ่มเติมของคณะกรรมการ', type: 'TEXT', maxScore: null, allowComment: false },
  ]);

  // Modal State
  const [isQuickTypeModalOpen, setIsQuickTypeModalOpen] = useState(false);

  // Applicant Import State (Optional in Draft)
  const [createdRoundId, setCreatedRoundId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState<ExcelPreviewResponse | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Common Feedback State & Field-Level Error Map
  const [saving, setSaving] = useState(false);
  const [savingStepMessage, setSavingStepMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [emptyRowIndices, setEmptyRowIndices] = useState<number[]>([]);

  const clearFieldError = (fieldName: keyof FormFieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const scrollToFirstError = (errors: FormFieldErrors, emptyIndices?: number[]) => {
    // Priority: If specific subcriteria rows have empty titles, scroll & focus to the first empty row directly!
    if (errors.subCriteriaTitles && emptyIndices && emptyIndices.length > 0) {
      const rowInput = document.getElementById(`subcriteria-title-${emptyIndices[0]}`);
      if (rowInput) {
        rowInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        rowInput.focus();
        return;
      }
    }

    const priorityList: Array<{ key: keyof FormFieldErrors; elementId: string }> = [
      { key: 'scholarshipTypeId', elementId: 'field-scholarshipTypeId' },
      { key: 'academicYear', elementId: 'field-academicYear' },
      { key: 'name', elementId: 'field-name' },
      { key: 'customCriteriaName', elementId: 'criteriaName' },
      { key: 'criteriaScoreSum', elementId: 'field-criteriaScore' },
      { key: 'subCriteriaTitles', elementId: 'field-criteriaScore' },
      { key: 'file', elementId: 'field-applicantFile' },
    ];

    for (const item of priorityList) {
      if (errors[item.key]) {
        const el = document.getElementById(item.elementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) {
            el.focus();
          }
          break;
        }
      }
    }
  };

  const validateForm = (): { isValid: boolean; errors: FormFieldErrors; emptyIndices: number[] } => {
    const errors: FormFieldErrors = {};
    const emptyIndices: number[] = [];

    if (!scholarshipTypeId) {
      errors.scholarshipTypeId = 'กรุณาเลือกประเภททุนการศึกษาก่อนดำเนินการต่อ';
    }

    if (!academicYear) {
      errors.academicYear = 'กรุณาระบุปีการศึกษา (พ.ศ.)';
    } else if (academicYear < 2550 || academicYear > 2700) {
      errors.academicYear = 'ปีการศึกษาต้องอยู่ในช่วง พ.ศ. 2550–2700';
    }

    if (!name.trim()) {
      errors.name = 'กรุณาระบุชื่อรอบทุนการศึกษา (ห้ามเว้นว่าง)';
    }

    if (criteriaMode === 'CUSTOM') {
      if (!customCriteriaName.trim()) {
        errors.customCriteriaName = 'กรุณาระบุชื่อชุดเกณฑ์เฉพาะรอบนี้';
      }

      const scoredItems = customSubCriteria.filter((s) => s.type === 'SCORED');
      if (scoredItems.length === 0) {
        errors.criteriaScoreSum = 'เกณฑ์การประเมินต้องมีเกณฑ์ย่อยแบบมีคะแนนอย่างน้อย 1 ข้อ';
      } else {
        const sum = scoredItems.reduce((acc, c) => acc + (Number(c.maxScore) || 0), 0);
        if (sum !== customTargetScore) {
          errors.criteriaScoreSum = `ผลรวมคะแนนย่อย (${sum} คะแนน) ต้องเท่ากับคะแนนเป้าหมาย (${customTargetScore} คะแนน) พอดี (ปัจจุบันขาด/เกิน ${Math.abs(customTargetScore - sum)} คะแนน)`;
        }
      }

      customSubCriteria.forEach((s, idx) => {
        if (!s.title.trim()) {
          emptyIndices.push(idx);
        }
      });

      if (emptyIndices.length > 0) {
        errors.subCriteriaTitles = 'กรุณากรอกชื่อเกณฑ์ย่อยให้ครบทุกข้อ (ห้ามเว้นว่าง)';
        setEmptyRowIndices(emptyIndices);
      } else {
        setEmptyRowIndices([]);
      }
    } else {
      setEmptyRowIndices([]);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      emptyIndices,
    };
  };

  // Load initial scholarship types
  const loadTypes = useCallback(async () => {
    try {
      const typesRes = await fetchScholarshipTypes({ activeOnly: true, limit: 100 });
      setScholarshipTypes(typesRes.data || []);
    } catch (err: unknown) {
      console.warn('Failed to load scholarship types:', err);
    }
  }, []);

  useEffect(() => {
    void loadTypes();
  }, [loadTypes]);

  // Selected scholarship type detail
  const selectedType = useMemo(() => {
    return scholarshipTypes.find((t) => t.id === scholarshipTypeId) ?? null;
  }, [scholarshipTypes, scholarshipTypeId]);

  // Handle scholarship type change with smart auto-fill
  const handleTypeChange = (selectedTypeId?: number) => {
    setScholarshipTypeId(selectedTypeId);
    setErrorMessage(null);

    if (selectedTypeId) {
      const typeItem = scholarshipTypes.find((t) => t.id === selectedTypeId);
      if (typeItem) {
        // Auto-suggest round name if empty or default format
        if (!name.trim() || name.includes('ประจำภาคเรียนที่')) {
          setName(`${typeItem.name} ประจำภาคเรียนที่ ${semester}/${academicYear}`);
        }
        // Auto-name custom criteria
        setCustomCriteriaName(`เกณฑ์เฉพาะรอบ ${typeItem.name} (${semester}/${academicYear})`);
      }
    }
  };

  // Re-generate suggested name when year or semester changes
  const handleSemesterOrYearChange = (newSem: number, newYear: number) => {
    setSemester(newSem);
    setAcademicYear(newYear);
    if (selectedType && (!name.trim() || name.includes('ประจำภาคเรียนที่'))) {
      setName(`${selectedType.name} ประจำภาคเรียนที่ ${newSem}/${newYear}`);
    }
  };

  // Handle Quick Create Scholarship Type Success
  const handleQuickTypeSuccess = async (createdType: ScholarshipTypeDetail) => {
    await loadTypes();
    setScholarshipTypeId(createdType.id);
    setName(`${createdType.name} ประจำภาคเรียนที่ ${semester}/${academicYear}`);
    setCustomCriteriaName(`เกณฑ์เฉพาะรอบ ${createdType.name} (${semester}/${academicYear})`);
    if (createdType.defaultCriteria?.subCriteria) {
      setCustomSubCriteria(createdType.defaultCriteria.subCriteria.map(s => ({
        sortOrder: s.sortOrder,
        title: s.title,
        type: s.type as 'SCORED' | 'TEXT',
        maxScore: s.maxScore,
        allowComment: s.allowComment,
      })));
    }
    setErrorMessage(null);
  };

  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Drag and Drop & File Processing
  const processSelectedFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setErrorMessage('กรุณาเลือกไฟล์ที่มีนามสกุล .xlsx เท่านั้น (ตามกฎ BR-IMP-02)');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('ขนาดไฟล์ต้องไม่เกิน 50 MB (ตามกฎ BR-IMP-02)');
      return;
    }
    setSelectedFile(file);
    setPreviewData(null);
    setAcknowledged(false);
    setErrorMessage(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Submit Handler: Orchestrates Round Creation + Optional Applicant Import with Inline Errors & Auto-scroll
  const handleSaveRound = async (importFileIfPresent: boolean = true) => {
    setErrorMessage(null);

    // 1. Validate Form on Client-side
    const { isValid, errors, emptyIndices } = validateForm();
    if (!isValid) {
      setFieldErrors(errors);
      scrollToFirstError(errors, emptyIndices);
      return;
    }

    try {
      setSaving(true);
      setSavingStepMessage('กำลังสร้างรอบทุนการศึกษา...');

      const payload: CreateRoundPayload = {
        name: name.trim(),
        academicYear: Number(academicYear),
        semester: Number(semester),
        scholarshipTypeId: Number(scholarshipTypeId),
      };

      if (criteriaMode === 'DEFAULT') {
        // Backend auto-links scholarshipType.defaultCriteriaId
      } else if (criteriaMode === 'CUSTOM') {
        // Contextual auto-naming to avoid CRITERIA_NAME_DUPLICATE (BR-CRT-01)
        const finalCriteriaName = customCriteriaName.trim() || `เกณฑ์เฉพาะรอบ ${name.trim()}`;
        payload.criteria = {
          name: finalCriteriaName,
          targetScore: customTargetScore,
          subCriteria: customSubCriteria,
        };
      }

      // 1. Create the scholarship round
      const res = await createRound(payload);
      const newId = res.data.id;
      setCreatedRoundId(newId);

      // 2. If a file is selected and should be imported
      if (importFileIfPresent && selectedFile) {
        setSavingStepMessage('กำลังตรวจสอบและอ่านไฟล์ Excel...');
        try {
          const previewRes = await uploadAndPreviewExcel(newId, selectedFile);
          setPreviewData(previewRes);

          // If no invalid rows, confirm import automatically!
          if (previewRes.invalidRows === 0) {
            setSavingStepMessage('กำลังบันทึกรายชื่อผู้สมัคร...');
            await confirmImportApplicants(newId, {
              previewToken: previewRes.previewToken,
              acknowledgedInvalidRows: false,
            });
            router.push(`/admin/scholarship-rounds/${newId}`);
            return;
          } else {
            // If there are invalid rows, stop and let user acknowledge in UI
            setSaving(false);
            setSavingStepMessage(null);
            return;
          }
        } catch (excelErr: unknown) {
          const msg = excelErr instanceof Error ? excelErr.message : 'ไม่สามารถประมวลผลไฟล์ Excel ได้';
          setErrorMessage(`สร้างรอบทุนสำเร็จแล้ว แต่เกิดข้อผิดพลาดกับไฟล์ผู้สมัคร: ${msg}`);
          setSaving(false);
          setSavingStepMessage(null);
          return;
        }
      }

      // No file to import -> redirect immediately
      router.push(`/admin/scholarship-rounds/${newId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างรอบทุน';
      const newBackendErrors: FormFieldErrors = {};

      if (msg.includes('CRITERIA_NAME_DUPLICATE') || (msg.includes('ชื่อเกณฑ์') && msg.includes('มีอยู่แล้ว'))) {
        newBackendErrors.customCriteriaName = msg;
        setFieldErrors((prev) => ({ ...prev, ...newBackendErrors }));
        scrollToFirstError(newBackendErrors);
      } else if (msg.includes('SCHOLARSHIP_TYPE_INACTIVE') || msg.includes('ประเภททุนนี้ถูกปิดการใช้งาน')) {
        newBackendErrors.scholarshipTypeId = msg;
        setFieldErrors((prev) => ({ ...prev, ...newBackendErrors }));
        scrollToFirstError(newBackendErrors);
      } else if (msg.includes('CRITERIA_SUM_NOT_100') || msg.includes('ผลรวมคะแนนต้องเท่ากับ')) {
        newBackendErrors.criteriaScoreSum = msg;
        setFieldErrors((prev) => ({ ...prev, ...newBackendErrors }));
        scrollToFirstError(newBackendErrors);
      } else {
        setErrorMessage(msg);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      setSaving(false);
      setSavingStepMessage(null);
    }
  };

  // Secondary Confirm Import Handler (used when file had invalid rows and required acknowledgment)
  const handleConfirmImport = async () => {
    if (!createdRoundId || !previewData) return;
    try {
      setImporting(true);
      setErrorMessage(null);
      await confirmImportApplicants(createdRoundId, {
        previewToken: previewData.previewToken,
        acknowledgedInvalidRows: previewData.invalidRows > 0 ? acknowledged : false,
      });
      router.push(`/admin/scholarship-rounds/${createdRoundId}`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการนำเข้าผู้สมัคร');
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        title="สร้างรอบทุนการศึกษาใหม่"
        backHref="/admin/scholarship-rounds"
        backLabel="กลับสู่หน้ารายการรอบทุนการศึกษา"
      />

      {/* Global Error Alert */}
      {errorMessage && (
        <Alert variant="destructive">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">เกิดข้อผิดพลาด</span>
              <span className="text-xs">{errorMessage}</span>
            </div>
          </div>
        </Alert>
      )}

      {/* Main Single-Page Form */}
      <div className="space-y-6">

        {/* Card 1: ข้อมูลหลักและประเภททุนการศึกษา */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>1. ข้อมูลรอบทุนและประเภททุนการศึกษา</CardTitle>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Scholarship Type Dropdown + Quick Add */}
            <div className="space-y-1.5" id="field-scholarshipTypeId">
              <div className="flex items-center justify-between">
                <label htmlFor="typeSelect" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span>ประเภททุนการศึกษา</span>
                  <span className="text-destructive">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsQuickTypeModalOpen(true)}
                  className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>สร้างประเภททุนใหม่</span>
                </button>
              </div>

              <div className={fieldErrors.scholarshipTypeId ? 'ring-2 ring-destructive/30 rounded-xl' : ''}>
                <Select
                  id="typeSelect"
                  value={scholarshipTypeId ?? ''}
                  onChange={(e) => {
                    handleTypeChange(e.target.value ? parseInt(e.target.value) : undefined);
                    clearFieldError('scholarshipTypeId');
                  }}
                >
                  <option value="">-- กรุณาเลือกประเภททุนการศึกษา --</option>
                  {scholarshipTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>

              {fieldErrors.scholarshipTypeId && (
                <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.scholarshipTypeId}</span>
                </p>
              )}

              {selectedType && (
                <p className="text-xs text-muted-foreground italic mt-1">
                  คำอธิบาย: {selectedType.description || 'ไม่มีคำอธิบายระบุไว้'}
                </p>
              )}
            </div>

            {/* Academic Year & Semester */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5" id="field-academicYear">
                <label htmlFor="academicYear" className="block text-xs font-semibold text-foreground">
                  ปีการศึกษา (พ.ศ.) <span className="text-destructive">*</span>
                </label>
                <input
                  id="academicYear"
                  type="number"
                  min={2550}
                  max={2700}
                  required
                  value={academicYear}
                  onChange={(e) => {
                    handleSemesterOrYearChange(semester, parseInt(e.target.value) || 2569);
                    clearFieldError('academicYear');
                  }}
                  className={`w-full px-3.5 py-2.5 text-sm font-mono bg-background border rounded-xl focus:outline-none focus:ring-2 transition ${
                    fieldErrors.academicYear
                      ? 'border-destructive focus:ring-destructive/20'
                      : 'border-border focus:ring-primary/20 focus:border-primary'
                  }`}
                />
                {academicYear >= 2000 && academicYear <= 2150 && (
                  <div className="flex items-center gap-2 pt-1 text-xs text-amber-700 bg-amber-50 border border-amber-200/80 p-2 rounded-lg">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>
                      ตรวจพบปี ค.ศ. ({academicYear}) ต้องการแปลงเป็น พ.ศ. ({academicYear + 543}) หรือไม่?
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSemesterOrYearChange(semester, academicYear + 543)}
                      className="font-semibold text-primary underline hover:text-primary/80 cursor-pointer ml-auto shrink-0"
                    >
                      แปลงทันที
                    </button>
                  </div>
                )}
                {fieldErrors.academicYear && (
                  <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.academicYear}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="semester" className="block text-xs font-semibold text-foreground">
                  ภาคการศึกษา <span className="text-destructive">*</span>
                </label>
                <Select
                  id="semester"
                  value={semester}
                  onChange={(e) => handleSemesterOrYearChange(parseInt(e.target.value) || 1, academicYear)}
                >
                  <option value={1}>ภาคเรียนที่ 1</option>
                  <option value={2}>ภาคเรียนที่ 2</option>
                </Select>
              </div>
            </div>

            {/* Round Name */}
            <div className="space-y-1.5" id="field-name">
              <label htmlFor="roundName" className="block text-xs font-semibold text-foreground">
                ชื่อรอบทุนการศึกษา <span className="text-destructive">*</span>
              </label>
              <input
                id="roundName"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearFieldError('name');
                }}
                placeholder="เช่น ทุนช่วยเหลือนักศึกษาขาดแคลนทุนทรัพย์ ประจำภาคเรียนที่ 1/2569"
                className={`w-full px-3.5 py-2.5 text-sm bg-background border rounded-xl focus:outline-none focus:ring-2 transition ${
                  fieldErrors.name
                    ? 'border-destructive focus:ring-destructive/20'
                    : 'border-border focus:ring-primary/20 focus:border-primary'
                }`}
              />
              {fieldErrors.name && (
                <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.name}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: กำหนดเกณฑ์การประเมินประจำรอบ */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>2. กำหนดเกณฑ์การประเมินประจำรอบ</CardTitle>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {criteriaMode === 'DEFAULT' && (
                  <Badge variant="outline" className="text-xs font-mono font-bold bg-blue-50 text-blue-700 border-blue-200">
                    เกณฑ์มาตรฐานประจำประเภททุน
                  </Badge>
                )}
                {criteriaMode === 'CUSTOM' && (
                  <Badge variant="outline" className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                    เกณฑ์เฉพาะรอบ (เป้าหมาย {customTargetScore} คะแนน)
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* 2 Modes Radio Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Mode 1: Default */}
              <label
                className={`flex flex-col justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  criteriaMode === 'DEFAULT'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border bg-background hover:bg-muted/30'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">ใช้เกณฑ์มาตรฐาน</span>
                    <input
                      type="radio"
                      name="criteriaMode"
                      value="DEFAULT"
                      checked={criteriaMode === 'DEFAULT'}
                      onChange={() => setCriteriaMode('DEFAULT')}
                      className="text-primary focus:ring-primary"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    ดึงเกณฑ์แม่แบบเริ่มต้นที่ผูกไว้กับประเภททุนมาใช้งานทันที
                  </p>
                </div>
              </label>

              {/* Mode 2: Custom / Clone */}
              <label
                className={`flex flex-col justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  criteriaMode === 'CUSTOM'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border bg-background hover:bg-muted/30'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">ปรับแต่งเฉพาะรอบนี้</span>
                    <input
                      type="radio"
                      name="criteriaMode"
                      value="CUSTOM"
                      checked={criteriaMode === 'CUSTOM'}
                      onChange={() => setCriteriaMode('CUSTOM')}
                      className="text-primary focus:ring-primary"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    ปรับคะแนนเต็มเป้าหมาย สลับข้อความ/มีคะแนน หรือแก้ไขเกณฑ์ย่อยเฉพาะรอบนี้
                  </p>
                </div>
              </label>
            </div>

            {/* Custom Mode: Render Reusable CriteriaBuilder */}
            {criteriaMode === 'CUSTOM' && (
              <div className="pt-4 border-t border-border/80 space-y-4 animate-in fade-in">
                {/* Reused CriteriaBuilder Component with inline error container */}
                <div id="field-criteriaScore" className="space-y-3">
                  {fieldErrors.criteriaScoreSum && (
                    <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2 shadow-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{fieldErrors.criteriaScoreSum}</span>
                    </div>
                  )}
                  {fieldErrors.subCriteriaTitles && (
                    <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2 shadow-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{fieldErrors.subCriteriaTitles}</span>
                    </div>
                  )}

                  <CriteriaBuilder
                    scholarshipTypeName={selectedType?.name || 'ทุนการศึกษา'}
                    criteriaName={customCriteriaName}
                    nameError={fieldErrors.customCriteriaName}
                    emptyTitleIndices={emptyRowIndices}
                    onCriteriaNameChange={(newName) => {
                      setCustomCriteriaName(newName);
                      clearFieldError('customCriteriaName');
                    }}
                    targetScore={customTargetScore}
                    onTargetScoreChange={(score) => {
                      setCustomTargetScore(score);
                      clearFieldError('criteriaScoreSum');
                    }}
                    subCriteria={customSubCriteria}
                    onSubCriteriaChange={(items) => {
                      setCustomSubCriteria(items);
                      clearFieldError('criteriaScoreSum');
                      clearFieldError('subCriteriaTitles');
                      setEmptyRowIndices([]);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Mode 1 Preview: Default Rubric Summary */}
            {criteriaMode === 'DEFAULT' && (
              <div className="p-4 rounded-xl bg-muted/20 border border-border/80 text-xs text-muted-foreground space-y-1">
                {selectedType && !selectedType.defaultCriteriaId ? (
                  <div className="space-y-1 text-amber-800 dark:text-amber-300">
                    <div className="font-semibold flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>ประเภททุนนี้ยังไม่มีเกณฑ์แม่แบบเริ่มต้น</span>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                      กรุณาเลือก &ldquo;ปรับแต่งเฉพาะรอบนี้&rdquo; เพื่อกำหนดเกณฑ์การประเมินสำหรับรอบทุนนี้
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>ระบบจะใช้เกณฑ์แม่แบบเริ่มต้นประจำประเภททุนโดยอัตโนมัติ</span>
                    </div>
                    <p className="text-[11px]">
                      เมื่อบันทึกรอบทุน เกณฑ์การประเมินจะถูกผูกกับรอบนี้ทันทีโดยไม่ต้องตั้งค่าเพิ่มเติม
                    </p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 3: รายชื่อผู้สมัคร (Optional — นำเข้าทันทีหรือภายหลังได้) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>3. รายชื่อผู้สมัคร </CardTitle>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Case A: File has been submitted and previewed with invalid rows waiting for acknowledgment */}
            {previewData ? (
              <div className="space-y-4 border border-amber-500/40 rounded-2xl p-5 bg-amber-500/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-primary" />
                      <span>{selectedFile?.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      พบข้อมูลทั้งหมด {previewData.totalRows} แถว
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      แถวที่ถูกต้อง {previewData.validRows} แถว
                    </span>
                    {previewData.invalidRows > 0 && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                        แถวที่ไม่ผ่าน {previewData.invalidRows} แถว
                      </span>
                    )}
                  </div>
                </div>

                {previewData.invalidRows > 0 && (
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acknowledged}
                      onChange={(e) => setAcknowledged(e.target.checked)}
                      className="mt-0.5 rounded border-amber-400 text-primary focus:ring-primary"
                    />
                    <span>
                      รับทราบว่ามีแถวที่ไม่ผ่านเกณฑ์ {previewData.invalidRows} แถว และต้องการนำเข้าเฉพาะแถวที่ถูกต้อง ({previewData.validRows} คน)
                    </span>
                  </label>
                )}

                <div className="flex items-center justify-between pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (createdRoundId) {
                        router.push(`/admin/scholarship-rounds/${createdRoundId}`);
                      }
                    }}
                  >
                    ข้ามการนำเข้าไฟล์นี้ แล้วไปหน้ารายละเอียดรอบทุน
                  </Button>
                  <Button
                    type="button"
                    disabled={importing || previewData.validRows === 0 || (previewData.invalidRows > 0 && !acknowledged)}
                    isLoading={importing}
                    onClick={handleConfirmImport}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    ยืนยันนำเข้าผู้สมัคร ({previewData.validRows} คน)
                  </Button>
                </div>
              </div>
            ) : selectedFile ? (
              /* Case B: File is selected and staged, ready to be created with round */
              <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between gap-4 transition-all">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-foreground truncate">{selectedFile.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span className="font-mono">{formatFileSize(selectedFile.size)}</span>
                      <span>•</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 inline text-emerald-600" /> พร้อมนำเข้าอัตโนมัติเมื่อกดสร้างรอบทุน
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    เปลี่ยนไฟล์
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              /* Case C: Active Direct Dropzone (Default view) */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20 scale-[1.005]'
                    : 'border-border hover:border-primary/60 bg-muted/10 hover:bg-muted/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="space-y-1 mt-2.5">
                  <p className="text-xs font-semibold text-foreground">
                    คลิกเพื่อเลือกไฟล์ หรือลากไฟล์รายชื่อผู้สมัคร (.xlsx) มาวางที่นี่
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    ขนาดไฟล์ไม่เกิน 50 MB
                  </p>
                </div>
              </div>
            )}

            {fieldErrors.file && (
              <p className="text-xs text-destructive font-medium mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.file}</span>
              </p>
            )}
          </CardContent>

          {/* Form Actions Footer */}
          <CardFooter className="flex items-center justify-between pt-4 border-t border-border/80">
            <Link href="/admin/scholarship-rounds">
              <Button type="button" variant="ghost">
                ยกเลิก
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              {selectedFile ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => handleSaveRound(false)}
                  >
                    บันทึกร่าง (ไม่นำเข้าไฟล์)
                  </Button>
                  <Button
                    type="button"
                    disabled={saving}
                    isLoading={saving}
                    onClick={() => handleSaveRound(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    rightIcon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    {saving && savingStepMessage ? savingStepMessage : 'สร้างรอบทุนพร้อมนำเข้าผู้สมัคร'}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  disabled={saving}
                  isLoading={saving}
                  onClick={() => handleSaveRound(false)}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  {saving && savingStepMessage ? savingStepMessage : 'สร้างรอบทุนการศึกษา (บันทึกร่าง)'}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>

      </div>

      {/* Quick Create Scholarship Type Modal */}
      <QuickCreateScholarshipTypeModal
        isOpen={isQuickTypeModalOpen}
        onClose={() => setIsQuickTypeModalOpen(false)}
        onSuccess={handleQuickTypeSuccess}
      />
    </div>
  );
}
