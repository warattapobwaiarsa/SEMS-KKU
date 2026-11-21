'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createRound } from '@/services/rounds.service';
import { fetchCriteriaList } from '@/services/criteria.service';
import { fetchScholarshipTypes } from '@/services/scholarship-types.service';
import {
  uploadAndPreviewExcel,
  confirmImportApplicants,
} from '@/services/applicants.service';
import { CriteriaDetail } from '@/types/criteria';
import { ScholarshipTypeListItem } from '@/types/scholarship-type';
import { ExcelPreviewResponse } from '@/types/applicants';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Layers,
  Award,
  CheckCircle2,
  Upload,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { Select, PageHeader, Button, Card } from '@/components/ui';

type WizardStep = 1 | 2 | 3;

export default function CreateScholarshipRoundPage() {
  const router = useRouter();

  // Wizard Step State
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Step 1: Basic Info & Scholarship Type
  const [name, setName] = useState('');
  const [academicYear, setAcademicYear] = useState<number>(2569);
  const [semester, setSemester] = useState<number>(1);
  const [scholarshipTypeId, setScholarshipTypeId] = useState<number | undefined>(undefined);
  const [scholarshipTypes, setScholarshipTypes] = useState<ScholarshipTypeListItem[]>([]);

  // Step 2: Criteria
  const [criteriaId, setCriteriaId] = useState<number | undefined>(undefined);
  const [criteriaList, setCriteriaList] = useState<CriteriaDetail[]>([]);

  // Step 3: Round Created & Excel Upload
  const [createdRoundId, setCreatedRoundId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [previewData, setPreviewData] = useState<ExcelPreviewResponse | null>(null);
  const [previewTab, setPreviewTab] = useState<'valid' | 'invalid'>('valid');
  const [acknowledged, setAcknowledged] = useState(false);
  const [importing, setImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Common Feedback State
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [criteriaRes, typesRes] = await Promise.all([
          fetchCriteriaList({ limit: 100 }),
          fetchScholarshipTypes({ activeOnly: true, limit: 100 }),
        ]);
        setCriteriaList(criteriaRes.data || []);
        setScholarshipTypes(typesRes.data || []);
      } catch (err: unknown) {
        console.warn('Failed to load selection data:', err);
      }
    };
    void loadInitialData();
  }, []);

  const handleTypeChange = (selectedTypeId?: number) => {
    setScholarshipTypeId(selectedTypeId);
    if (selectedTypeId) {
      setErrorMessage(null);
    }
  };

  // ดึงชุดเกณฑ์ที่ถูกเลือกอยู่ในปัจจุบัน
  const selectedCriteria = useMemo(() => {
    return criteriaList.find((c) => c.id === criteriaId) ?? null;
  }, [criteriaList, criteriaId]);

  // Validation Step 1
  const handleNextToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!name.trim()) {
      setErrorMessage('กรุณาระบุชื่อรอบทุนการศึกษา (ห้ามเว้นว่าง)');
      return;
    }
    if (academicYear < 2550 || academicYear > 2700) {
      setErrorMessage('ปีการศึกษาต้องอยู่ในช่วง พ.ศ. 2550–2700');
      return;
    }
    if (!scholarshipTypeId) {
      setErrorMessage('กรุณาเลือกประเภททุนการศึกษาก่อนดำเนินการต่อไป');
      return;
    }
    setCurrentStep(2);
  };

  // Submit สร้างรอบทุน (Transition from Step 2 to Step 3)
  const handleCreateRound = async () => {
    setErrorMessage(null);
    if (!criteriaId) {
      setErrorMessage('กรุณาเลือกชุดเกณฑ์การประเมินก่อนดำเนินการต่อไป');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        academicYear: Number(academicYear),
        semester: Number(semester),
        scholarshipTypeId: Number(scholarshipTypeId),
        criteriaId: Number(criteriaId),
      };

      const res = await createRound(payload);
      setCreatedRoundId(res.data.id);
      setCurrentStep(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างรอบทุน';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  // อัปโหลดไฟล์ Excel ใน Step 3
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!createdRoundId) return;
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        setErrorMessage('กรุณาเลือกไฟล์ที่มีนามสกุล .xlsx เท่านั้น');
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);

      try {
        setUploadingExcel(true);
        const res = await uploadAndPreviewExcel(createdRoundId, file);
        setPreviewData(res);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'ไม่สามารถอ่านไฟล์ Excel ได้');
        setSelectedFile(null);
      } finally {
        setUploadingExcel(false);
      }
    }
  };

  // ยืนยันการนำเข้าใน Step 3
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

  const validRows = useMemo(
    () => previewData?.rows.filter((r) => r.isValid) || [],
    [previewData],
  );
  const invalidRows = useMemo(
    () => previewData?.rows.filter((r) => !r.isValid) || [],
    [previewData],
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-16">
      {/* Header */}
      <PageHeader
        title="สร้างรอบทุนการศึกษาใหม่"
        backHref="/admin/scholarship-rounds"
        backLabel="กลับสู่หน้ารายการรอบทุนการศึกษา"
      />

      {/* Wizard Progress Indicator */}
      <div className="grid grid-cols-3 gap-3">
        {/* Step 1 */}
        <div
          className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
            currentStep === 1
              ? 'bg-primary/5 border-primary ring-1 ring-primary/20'
              : currentStep > 1
              ? 'bg-muted/40 border-border text-muted-foreground'
              : 'bg-muted/10 border-border/40 opacity-60'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              currentStep > 1
                ? 'bg-emerald-600 text-white'
                : currentStep === 1
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {currentStep > 1 ? '✓' : '1'}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-foreground truncate">ข้อมูลรอบทุน</div>
          </div>
        </div>

        {/* Step 2 */}
        <div
          className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
            currentStep === 2
              ? 'bg-primary/5 border-primary ring-1 ring-primary/20'
              : currentStep > 2
              ? 'bg-muted/40 border-border text-muted-foreground'
              : 'bg-muted/10 border-border/40 opacity-60'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              currentStep > 2
                ? 'bg-emerald-600 text-white'
                : currentStep === 2
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {currentStep > 2 ? '✓' : '2'}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-foreground truncate">เกณฑ์การประเมิน</div>
          </div>
        </div>

        {/* Step 3 */}
        <div
          className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
            currentStep === 3
              ? 'bg-primary/5 border-primary ring-1 ring-primary/20'
              : 'bg-muted/10 border-border/40 opacity-60'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              currentStep === 3
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            3
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-foreground truncate">นำเข้าผู้สมัคร</div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-3 shadow-xs">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-destructive" />
          <div>
            <h4 className="font-semibold">เกิดข้อผิดพลาด</h4>
            <p className="mt-0.5 text-xs text-destructive/90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Step 1 Content: Round Info */}
      {currentStep === 1 && (
        <form onSubmit={handleNextToStep2} className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
          <div className="space-y-1.5">
            <label htmlFor="roundName" className="block text-sm font-semibold text-foreground">
              ชื่อรอบทุนการศึกษา <span className="text-destructive">*</span>
            </label>
            <input
              id="roundName"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ทุนการศึกษาเพื่อการพัฒนาศักยภาพนักศึกษา ประจำภาคเรียนที่ 1/2569"
              className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="academicYear" className="block text-sm font-semibold text-foreground">
                ปีการศึกษา (พ.ศ.) <span className="text-destructive">*</span>
              </label>
              <input
                id="academicYear"
                type="number"
                min={2550}
                max={2700}
                required
                value={academicYear}
                onChange={(e) => setAcademicYear(parseInt(e.target.value) || 2569)}
                className="w-full px-4 py-2.5 text-sm font-mono bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="semester" className="block text-sm font-semibold text-foreground">
                ภาคการศึกษา <span className="text-destructive">*</span>
              </label>
              <Select
                id="semester"
                value={semester}
                onChange={(e) => setSemester(parseInt(e.target.value) || 1)}
              >
                <option value={1}>ภาคเรียนที่ 1</option>
                <option value={2}>ภาคเรียนที่ 2</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-border/60">
            <label htmlFor="typeSelect" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Award className="h-4 w-4 text-primary" />
              <span>ประเภททุนการศึกษา (Scholarship Type)</span>
              <span className="text-destructive">*</span>
            </label>
            <Select
              id="typeSelect"
              icon={Award}
              value={scholarshipTypeId ?? ''}
              onChange={(e) => handleTypeChange(e.target.value ? parseInt(e.target.value) : undefined)}
            >
              <option value="">-- กรุณาเลือกประเภททุนการศึกษา --</option>
              {scholarshipTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-border/60">
            <Link href="/admin/scholarship-rounds">
              <Button type="button" variant="ghost">
                ยกเลิก
              </Button>
            </Link>
            <Button
              type="submit"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              ต่อไป
            </Button>
          </div>
        </form>
      )}

      {/* Step 2 Content: Criteria Selection & Review */}
      {currentStep === 2 && (
        <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
          <div>
            <h3 className="text-lg font-bold text-foreground">เลือกและตรวจสอบชุดเกณฑ์การประเมิน</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              ระบบอนุญาตให้เลือกเกณฑ์ที่ผูกกับรอบทุน หรือเปลี่ยนชุดเกณฑ์ที่ต้องการก่อนดำเนินการสร้างรอบ
            </p>
          </div>

          {/* Criteria Dropdown */}
          <div className="space-y-1.5">
            <label htmlFor="criteriaSelect" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-primary" />
              <span>ชุดเกณฑ์การประเมินที่ต้องการใช้</span>
              <span className="text-destructive">*</span>
            </label>
            <Select
              id="criteriaSelect"
              icon={Layers}
              value={criteriaId ?? ''}
              onChange={(e) => {
                setCriteriaId(e.target.value ? parseInt(e.target.value) : undefined);
                setErrorMessage(null);
              }}
            >
              <option value="">-- กรุณาเลือกชุดเกณฑ์การประเมิน --</option>
              {criteriaList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (เป้าหมาย {c.targetScore || c.totalScore} คะแนน, {c.subCriteria.length} เกณฑ์ย่อย)
                </option>
              ))}
            </Select>
          </div>

          {/* Criteria Live Preview Card */}
          {selectedCriteria && (
            <div className="p-5 rounded-2xl bg-muted/30 border border-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
                <div>
                  <h4 className="font-bold text-foreground text-base">{selectedCriteria.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ชุดเกณฑ์การประเมินพร้อมใช้งาน
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 font-mono">
                    เป้าหมาย {selectedCriteria.targetScore || selectedCriteria.totalScore} คะแนน
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                    {selectedCriteria.subCriteria.length} เกณฑ์ย่อย
                  </span>
                </div>
              </div>

              {/* Subcriteria Table Preview */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  รายการเกณฑ์ย่อยในชุดนี้:
                </div>
                <div className="border border-border/80 rounded-xl overflow-hidden divide-y divide-border/60 text-xs">
                  {selectedCriteria.subCriteria.map((sub, idx) => (
                    <div key={sub.id || idx} className="p-3 flex items-start justify-between gap-4 bg-background/50 hover:bg-background transition-colors">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-muted text-center leading-5 font-mono text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span>{sub.title}</span>
                        </div>
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
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="pt-4 flex items-center justify-between border-t border-border/60">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setCurrentStep(1);
                setErrorMessage(null);
              }}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              ย้อนกลับ
            </Button>
            <Button
              type="button"
              disabled={saving}
              isLoading={saving}
              onClick={handleCreateRound}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              ต่อไป
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 Content: Excel Import & Launch */}
      {currentStep === 3 && createdRoundId && (
        <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
          {/* Upload & Preview Section */}
          <div className="space-y-4">
              <div>
                <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary" />
                  นำเข้ารายชื่อผู้สมัครจาก Excel (.xlsx)
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  นำเข้าข้อมูลนักศึกษาเพื่อเตรียมสำหรับการประเมิน
                </p>
              </div>

              {/* Upload Dropzone */}
              {!previewData && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-primary/60 rounded-2xl p-8 text-center cursor-pointer transition-all bg-muted/10 hover:bg-muted/20 space-y-3"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    {uploadingExcel ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {uploadingExcel ? 'กำลังอ่านและตรวจสอบไฟล์...' : 'คลิกเพื่อเลือกไฟล์ Excel หรือลากไฟล์มาวางที่นี่'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      รองรับเฉพาะไฟล์ .xlsx (ต้องมีคอลัมน์ รหัสนักศึกษา, ชื่อ, สกุล, คณะ, สาขา, GPAX, ข้อมูลติดต่อ)
                    </p>
                  </div>
                </div>
              )}

              {/* Preview Rows Summary & Confirmation */}
              {previewData && (
                <div className="space-y-4 border border-border rounded-2xl p-5 bg-muted/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-mono font-bold text-xs">
                        XLSX
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-sm">
                          {selectedFile?.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          พบข้อมูลทั้งหมด {previewData.totalRows} แถว
                        </div>
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

                  {/* Acknowledge Invalid Rows if any */}
                  {previewData.invalidRows > 0 && (
                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-400 cursor-pointer">
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

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPreviewData(null);
                        setSelectedFile(null);
                      }}
                    >
                      เลือกไฟล์ใหม่
                    </Button>

                    <Button
                      type="button"
                      disabled={
                        importing ||
                        previewData.validRows === 0 ||
                        (previewData.invalidRows > 0 && !acknowledged)
                      }
                      isLoading={importing}
                      onClick={handleConfirmImport}
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      ยืนยันนำเข้าผู้สมัคร ({previewData.validRows} คน)
                    </Button>
                  </div>
                </div>
              )}
            </div>
        </div>
      )}
    </div>
  );
}
