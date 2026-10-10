/**
 * Types สำหรับหน้าผู้ประเมิน (Evaluator)
 * ใช้ร่วมกับ frontend/src/services/evaluation.service.ts
 * [FR-EVL-01] [BR-EVL-01] [BR-SCR-01] [FR-APP-04]
 */

// สถานะการประเมินของตัวเอง [BR-EVL-01]
export type MyEvaluationStatus = 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED';

// ข้อมูลผู้สมัคร 1 แถวในหน้ารายชื่อ [FR-EVL-01] [BR-SCR-01]
export interface EvaluatorApplicant {
  id: number;
  roundId: number;
  legacySeq: number | null;
  studentCode: string;
  titlePrefix: string;
  firstName: string;
  lastName: string;
  faculty: string;
  major: string;
  studyYear: number;
  gpa: number;
  submittedCount: number;
  myStatus: MyEvaluationStatus;
  canStart: boolean;
}

// Pagination metadata [FR-EVL-01]
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Response ของ API list applicants
export interface EvaluatorApplicantsResponse {
  data: EvaluatorApplicant[];
  meta: PaginationMeta;
}

// Query parameters สำหรับ list applicants
export interface EvaluatorApplicantsQuery {
  search?: string;
  page?: number;
  limit?: number;
}