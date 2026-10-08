'use client';

import React, { useState, useRef, useMemo } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  ArrowLeft,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui';
import { 
  uploadAndPreviewExcel, 
  confirmImportApplicants, 
  cancelImportPreview 
} from '@/services/applicants.service';
import { ExcelPreviewResponse, ConfirmImportResponse } from '@/types/applicants';

interface ImportApplicantModalProps {
  roundId: number;
  roundName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportApplicantModal({
  roundId,
  roundName,
  isOpen,
  onClose,
  onSuccess,
}: ImportApplicantModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<ExcelPreviewResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'valid' | 'invalid'>('valid');
  const [acknowledged, setAcknowledged] = useState(false);
  const [importing, setImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ConfirmImportResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tablePage, setTablePage] = useState(1);
  const PAGE_SIZE = 20;

  const validRows = useMemo(() => previewData?.rows.filter((r) => r.isValid) || [], [previewData]);
  const invalidRows = useMemo(() => previewData?.rows.filter((r) => !r.isValid) || [], [previewData]);

  const currentList = activeTab === 'valid' ? validRows : invalidRows;
  const totalPages = Math.ceil(currentList.length / PAGE_SIZE) || 1;
  const paginatedRows = useMemo(() => {
    const start = (tablePage - 1) * PAGE_SIZE;
    return currentList.slice(start, start + PAGE_SIZE);
  }, [currentList, tablePage]);

  const currentStep = importResult ? 3 : previewData ? 2 : 1;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        setErrorMessage('กรุณาเลือกไฟล์ที่มีนามสกุล .xlsx เท่านั้น (ตามกฎ BR-IMP-02)');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setErrorMessage('ขนาดไฟล์ต้องไม่เกิน 50 MB (ตามกฎ BR-IMP-02)');
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  const handleUploadAndPreview = async () => {
    if (!selectedFile) return;
    try {
      setUploading(true);
      setErrorMessage(null);
      const res = await uploadAndPreviewExcel(roundId, selectedFile);
      setPreviewData(res);
      if (res.validRows === 0 && res.invalidRows > 0) {
        setActiveTab('invalid');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('เกิดข้อผิดพลาดในการตรวจสอบไฟล์ Excel');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCancelPreview = async () => {
    if (previewData?.previewToken) {
      try {
        await cancelImportPreview(roundId, previewData.previewToken);
      } catch {
        // Silently ignore cancel errors
      }
    }
    setPreviewData(null);
    setSelectedFile(null);
    setAcknowledged(false);
    setErrorMessage(null);
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;
    if (previewData.invalidRows > 0 && !acknowledged) {
      setErrorMessage('กรุณากดรับทราบข้อมูลที่ไม่ผ่านเกณฑ์ก่อนยืนยันนำเข้า (ตามกฎ BR-IMP-11)');
      return;
    }
    try {
      setImporting(true);
      setErrorMessage(null);
      const res = await confirmImportApplicants(roundId, {
        previewToken: previewData.previewToken,
        acknowledgedInvalidRows: acknowledged,
      });
      setImportResult(res);
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('เกิดข้อผิดพลาดในการบันทึกข้อมูลนำเข้า');
      }
    } finally {
      setImporting(false);
    }
  };

  const handleModalClose = () => {
    if (previewData && !importResult) {
      void handleCancelPreview();
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      size="2xl"
      preventCloseOnBackdrop={importing}
    >
      <ModalHeader
        title="นำเข้าข้อมูลผู้สมัคร (Excel Import)"
        subtitle={
          <span>
            รอบทุน: <strong className="text-foreground">{roundName}</strong>
          </span>
        }
        icon={FileSpreadsheet}
        onClose={handleModalClose}
      >
        {/* Stepper Progress Bar */}
        <div className="flex items-center gap-2 pt-1 text-xs font-medium">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
            currentStep === 1 
              ? 'bg-primary text-primary-foreground font-bold shadow-2xs' 
              : currentStep > 1 
              ? 'bg-muted text-foreground' 
              : 'text-muted-foreground'
          }`}>
            <span className="w-4 h-4 rounded-full bg-background/30 text-center text-[10px] leading-4 font-bold inline-block">1</span>
            <span>อัปโหลดไฟล์</span>
          </div>

          <div className="h-px w-6 bg-border" />

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
            currentStep === 2 
              ? 'bg-primary text-primary-foreground font-bold shadow-2xs' 
              : currentStep > 2 
              ? 'bg-muted text-foreground' 
              : 'text-muted-foreground'
          }`}>
            <span className="w-4 h-4 rounded-full bg-background/30 text-center text-[10px] leading-4 font-bold inline-block">2</span>
            <span>ตรวจสอบและพรีวิว</span>
          </div>

          <div className="h-px w-6 bg-border" />

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
            currentStep === 3 
              ? 'bg-emerald-600 text-white font-bold shadow-2xs' 
              : 'text-muted-foreground'
          }`}>
            <span className="w-4 h-4 rounded-full bg-background/30 text-center text-[10px] leading-4 font-bold inline-block">3</span>
            <span>นำเข้าสำเร็จ</span>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        {errorMessage && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3 text-destructive text-sm animate-in fade-in">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Step 3: Success Completed State */}
        {importResult ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-bold text-foreground">นำเข้าข้อมูลผู้สมัครสำเร็จเรียบร้อย</h4>
              <p className="text-sm text-muted-foreground">
                บันทึกข้อมูลแล้ว <span className="font-bold text-foreground font-mono">{importResult.importedCount}</span> รายการ
                {importResult.skippedCount > 0 && (
                  <span className="text-destructive font-medium"> (ข้าม {importResult.skippedCount} รายการที่ไม่ผ่านเกณฑ์)</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground/80 pt-1">
                ระบบได้เข้ารหัสเลขประจำตัวประชาชน (AES-256-GCM) และบันทึก Audit Log เรียบร้อยแล้ว (BR-PDP-06)
              </p>
            </div>
          </div>
        ) : !previewData ? (
          /* Step 1: Upload Zone */
          <div className="space-y-5">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                selectedFile
                  ? 'border-primary bg-primary/5'
                  : 'border-border/80 hover:border-primary/60 hover:bg-muted/20 bg-muted/10'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 border border-primary/20">
                <Upload className="h-6 w-6" />
              </div>
              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    ขนาดไฟล์: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB (คลิกเพื่อเปลี่ยนไฟล์)
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                  </p>
                  <p className="text-xs text-muted-foreground">
                    รองรับเฉพาะไฟล์ Excel (.xlsx) ขนาดไม่เกิน 50 MB (ตามกฎ BR-IMP-02)
                  </p>
                </div>
              )}
            </div>

            {/* Requirement Notes & Guidelines Card */}
            <div className="p-4 bg-muted/30 border border-border/70 rounded-2xl space-y-2.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <Info className="h-4 w-4 text-primary shrink-0" />
                <span>ข้อกำหนดและโครงสร้างของไฟล์นำเข้า (BR-IMP-03 ถึง BR-IMP-23)</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1 text-muted-foreground leading-relaxed">
                <li>ระบบจะอ่านเฉพาะชีตชื่อ <strong className="text-foreground">&quot;Data&quot;</strong> โดยเริ่มอ่านข้อมูลตั้งแต่แถวที่ 3 (BR-IMP-18)</li>
                <li><strong className="text-foreground">คอลัมน์บังคับ 11 คอลัมน์:</strong> รหัสนักศึกษา, คำนำหน้า, ชื่อ, สกุล, คณะ, สาขา, ชั้นปี, GPA, โทรศัพท์, อีเมล, เลขบัตรประชาชน (ห้ามเว้นว่าง BR-IMP-03)</li>
                <li>รหัสนักศึกษาห้ามซ้ำกันภายในไฟล์เดียวกัน (BR-IMP-04)</li>
                <li>GPA ต้องอยู่ในช่วง 0.00–4.00 (BR-IMP-05) และเลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก (BR-IMP-06)</li>
                <li>เบอร์โทรศัพท์ 9 หลักที่เลข 0 นำหน้าหาย ระบบจะเติม 0 ให้อัตโนมัติ (BR-IMP-08)</li>
                <li><strong className="text-destructive">คำเตือน:</strong> การนำเข้าจะ <strong className="text-destructive">แทนที่ (Replace)</strong> ข้อมูลผู้สมัครเดิมทั้งหมดของรอบนี้ (BR-IMP-13)</li>
              </ul>
            </div>
          </div>
        ) : (
          /* Step 2: Preview & Validation Results */
          <div className="space-y-5">
            {/* Metric Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-muted/30 border border-border/70 rounded-xl text-center">
                <p className="text-xs text-muted-foreground font-medium">จำนวนทั้งหมดในไฟล์</p>
                <p className="text-2xl font-extrabold font-mono text-foreground mt-0.5">
                  {previewData.totalRows}
                </p>
              </div>

              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  ผ่านเกณฑ์ (Valid)
                </p>
                <p className="text-2xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {previewData.validRows}
                </p>
              </div>

              <div className={`p-4 border rounded-xl text-center ${
                previewData.invalidRows > 0 
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400' 
                  : 'bg-muted/20 border-border/50 text-muted-foreground'
              }`}>
                <p className={`text-xs font-semibold flex items-center justify-center gap-1.5 ${
                  previewData.invalidRows > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-muted-foreground'
                }`}>
                  <AlertTriangle className={`h-3.5 w-3.5 ${
                    previewData.invalidRows > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
                  }`} />
                  ไม่ผ่านเกณฑ์ (Invalid)
                </p>
                <p className="text-2xl font-extrabold font-mono mt-0.5">
                  {previewData.invalidRows}
                </p>
              </div>
            </div>

            {/* Tabs Toggle */}
            <div className="flex border-b border-border/80 text-sm">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('valid');
                  setTablePage(1);
                }}
                className={`pb-2.5 px-4 font-semibold transition-colors border-b-2 cursor-pointer ${
                  activeTab === 'valid'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                รายการที่ผ่านเกณฑ์ ({previewData.validRows})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('invalid');
                  setTablePage(1);
                }}
                className={`pb-2.5 px-4 font-semibold transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'invalid'
                    ? 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                รายการที่มีข้อผิดพลาด ({previewData.invalidRows})
                {previewData.invalidRows > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse" />
                )}
              </button>
            </div>

            {/* Preview Table or Error Details List */}
            <div className="border border-border/80 rounded-xl overflow-hidden max-h-64 overflow-y-auto bg-card">
              {activeTab === 'valid' ? (
                previewData.validRows > 0 ? (
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground sticky top-0 border-b border-border/60">
                      <tr>
                        <th className="py-2.5 px-3 w-14 text-center">แถว</th>
                        <th className="py-2.5 px-3 w-32">รหัสนักศึกษา</th>
                        <th className="py-2.5 px-3">ชื่อ - สกุล</th>
                        <th className="py-2.5 px-3">คณะ / สาขาวิชา</th>
                        <th className="py-2.5 px-3 text-center w-16">ชั้นปี</th>
                        <th className="py-2.5 px-3 text-center w-16">GPA</th>
                        <th className="py-2.5 px-3 w-40">เลขบัตร (Masked)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {paginatedRows.map((row) => (
                        <tr key={row.rowNumber} className="hover:bg-muted/20 transition-colors">
                          <td className="py-2 px-3 text-center font-mono text-muted-foreground">
                            {row.rowNumber}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-foreground">
                            {row.studentCode}
                          </td>
                          <td className="py-2 px-3 text-foreground font-medium">
                            {row.titlePrefix}{row.firstName} {row.lastName}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">
                            {row.faculty} ({row.major})
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-semibold text-foreground">
                            {row.studyYear}
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-foreground">
                            {row.gpa.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 font-mono text-muted-foreground text-[11px]">
                            {row.maskedCitizenId}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    ไม่มีแถวที่ผ่านการตรวจสอบในไฟล์นี้
                  </div>
                )
              ) : (
                previewData.invalidRows > 0 ? (
                  <div className="divide-y divide-border/40">
                    {paginatedRows.map((row) => (
                      <div key={row.rowNumber} className="p-3.5 text-xs bg-rose-500/5 flex items-start gap-3">
                        <span className="font-mono bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-bold shrink-0">
                          แถว {row.rowNumber}
                        </span>
                        <div className="space-y-1">
                          {row.studentCode && (
                            <p className="font-bold text-foreground">
                              รหัส: <span className="font-mono">{row.studentCode}</span> ({row.firstName || '-'} {row.lastName || '-'})
                            </p>
                          )}
                          <ul className="list-disc list-inside space-y-0.5 text-rose-700 dark:text-rose-400">
                            {row.errors.map((err, idx) => (
                              <li key={idx}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-emerald-600 dark:text-emerald-400 text-sm flex items-center justify-center gap-2 font-semibold">
                    <CheckCircle2 className="h-5 w-5" /> ทุกแถวผ่านการตรวจสอบอย่างสมบูรณ์
                  </div>
                )
              )}
            </div>

            {/* Pagination Controls */}
            {currentList.length > PAGE_SIZE && (
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pt-0.5">
                <span>
                  แสดงแถวที่ {(tablePage - 1) * PAGE_SIZE + 1} - {Math.min(tablePage * PAGE_SIZE, currentList.length)} จาก {currentList.length} แถว
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={tablePage === 1}
                    onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded-lg border border-border/80 bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-medium font-mono px-1.5">
                    {tablePage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={tablePage >= totalPages}
                    onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))}
                    className="p-1 rounded-lg border border-border/80 bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Replace Warning & Acknowledgement Area (BR-IMP-11, BR-IMP-13) */}
            <div className="space-y-3 pt-1">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>การยืนยันนำเข้าจะ <strong className="underline">แทนที่ (Replace)</strong> ข้อมูลผู้สมัครเดิมทั้งหมดของรอบนี้ (BR-IMP-13)</span>
              </div>

              {previewData.invalidRows > 0 && (
                <label className="flex items-start gap-2.5 cursor-pointer select-none p-3.5 bg-muted/30 border border-border/80 rounded-xl hover:bg-muted/40 transition">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className="text-xs text-foreground leading-relaxed font-medium">
                    ข้าพเจ้ารับทราบว่ามีข้อมูลที่ไม่ผ่านเกณฑ์จำนวน <strong className="text-rose-600 dark:text-rose-400 font-mono">{previewData.invalidRows}</strong> รายการ ซึ่งจะไม่ถูกนำเข้า และยืนยันนำเข้าเฉพาะข้อมูลที่ผ่านเกณฑ์ (BR-IMP-11)
                  </span>
                </label>
              )}
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        {importResult ? (
          <button
            type="button"
            onClick={handleModalClose}
            className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 shadow-sm transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            เสร็จสิ้นและปิดหน้าต่าง
          </button>
        ) : !previewData ? (
          <>
            <button
              type="button"
              onClick={handleModalClose}
              className="px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={!selectedFile || uploading}
              onClick={handleUploadAndPreview}
              className="px-5 py-2.5 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2 cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังตรวจสอบไฟล์...
                </>
              ) : (
                'อัปโหลดและตรวจสอบข้อมูล'
              )}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleCancelPreview}
              disabled={importing}
              className="px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              เลือกไฟล์ใหม่
            </button>
            <button
              type="button"
              disabled={
                previewData.validRows === 0 ||
                (previewData.invalidRows > 0 && !acknowledged) ||
                importing
              }
              onClick={handleConfirmImport}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2 cursor-pointer"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังนำเข้าข้อมูล...
                </>
              ) : (
                `ยืนยันนำเข้า (${previewData.validRows} รายการ)`
              )}
            </button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
