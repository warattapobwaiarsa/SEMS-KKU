export interface ApplicantListItem {
  id: number;
  roundId: number;
  importBatchId: number;
  legacySeq: number | null;
  studentCode: string;
  titlePrefix: string;
  firstName: string;
  lastName: string;
  faculty: string;
  major: string;
  studyYear: number;
  gpa: number;
  createdAt: string;
}

export interface ExcelPreviewRow {
  rowNumber: number;
  studentCode: string;
  titlePrefix: string;
  firstName: string;
  lastName: string;
  faculty: string;
  major: string;
  studyYear: number;
  gpa: number;
  maskedCitizenId: string;
  isValid: boolean;
  errors: string[];
}

export interface ExcelPreviewResponse {
  previewToken: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  expiresAt: string;
  rows: ExcelPreviewRow[];
}

export interface ConfirmImportPayload {
  previewToken: string;
  acknowledgedInvalidRows: boolean;
}

export interface ConfirmImportResponse {
  importBatchId: number;
  importedCount: number;
  skippedCount: number;
}

export interface ImportBatchItem {
  id: number;
  roundId: number;
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errorDetails?: Array<{
    rowNumber: number;
    studentCode?: string;
    errors: string[];
  }> | null;
  importedAt: string;
  importedBy?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface ApplicantsListResponse {
  data: ApplicantListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
