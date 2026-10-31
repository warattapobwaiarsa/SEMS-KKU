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

// ข้อมูลรอบทุนสำหรับ Evaluator
export interface EvaluatorRound {
  id: number;
  name: string;
  academicYear: number;
  semester: number;
  status: 'DRAFT' | 'OPEN' | 'CLOSED';
  criteriaId: number | null;
  criteriaName: string | null;
  applicantCount: number;
  createdAt: string;
  openedAt: string | null;
  closedAt: string | null;
  updatedAt: string;
}

// ============================================================
// Step 9: หน้าประเมินแบบแบ่งจอ (split-screen scoring page)
// ============================================================

// ประเภทเกณฑ์ย่อย: SCORED = มีคะแนน, TEXT = ข้อความ [FR-EVL-04]
export type SubCriteriaTypeValue = 'SCORED' | 'TEXT';

// สถานะผลประเมินของฉัน (null = ยังไม่เคยเริ่มประเมิน)
export type EvaluationStatusValue = 'DRAFT' | 'SUBMITTED';

// ข้อมูลประกอบของผู้สมัคร (มุมมอง evaluator เท่านั้น) [FR-APP-03] [BR-APP-04]
// ทุกช่องเป็น string | null ค่าว่างให้แสดง "-" ที่หน้าจอ [FR-APP-04]
export interface ApplicantSupportingInfo {
  applicationDate: string | null;
  accommodation: string | null;
  rent: string | null;
  personalExpense: string | null;
  studyEquipmentCost: string | null;
  electronicDevices: string | null;
  sideIncome: string | null;
  fatherAge: string | null;
  fatherOccupation: string | null;
  fatherIncome: string | null;
  fatherStatus: string | null;
  motherAge: string | null;
  motherOccupation: string | null;
  motherIncome: string | null;
  motherStatus: string | null;
  parentsStatus: string | null;
  tuitionPayer: string | null;
  guardianRelation: string | null;
  guardianOccupation: string | null;
  guardianIncome: string | null;
  siblingsWorking: string | null;
  siblingsNotWorking: string | null;
  siblingsStudying: string | null;
  studentLoan: string | null;
  previousScholarships: string | null;
  /** ลิงก์แผนที่ หน้าจอต้องเช็ค http:// หรือ https:// ก่อนแสดงเป็นลิงก์ [FR-APP-05] */
  accommodationMapUrl: string | null;
}

// รายละเอียดผู้สมัครที่ evaluator เห็น (GET /applicants/:id)
// ไม่มีเลขบัตรประชาชน / โทรศัพท์ / อีเมล [FR-APP-03] [BR-APP-04]
export interface EvaluatorApplicantDetail {
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
  supportingInfo: ApplicantSupportingInfo | null;
}

// เกณฑ์ย่อยที่ฝังมาในแต่ละข้อของแบบประเมิน [FR-EVL-04]
export interface EmbeddedSubCriteria {
  id: number;
  title: string;
  type: SubCriteriaTypeValue;
  maxScore: number | null;
  allowComment: boolean;
  sortOrder: number;
}

// 1 ข้อของแบบประเมิน (ยังไม่กรอก = null เสมอ ไม่ใช่ 0) [FR-EVL-07]
export interface MyEvaluationItem {
  subCriteriaId: number;
  score: number | null;
  comment: string | null;
  textValue: string | null;
  subCriteria: EmbeddedSubCriteria;
}

// Response ของ GET/PUT/POST my-evaluation (รูปเดียวกันทั้งหมด)
export interface MyEvaluationView {
  evaluationId: number | null;
  applicantId: number;
  status: EvaluationStatusValue | null;
  /** true = Draft ในรอบที่ปิดแล้ว -> อ่านอย่างเดียว */
  isLocked: boolean;
  totalScore: number | null;
  submittedAt: string | null;
  updatedAt: string | null;
  items: MyEvaluationItem[];
}

// 1 ข้อใน body ของ PUT my-evaluation (ห้ามส่งฟิลด์อื่นนอกจากนี้ ไม่งั้น backend ตอบ 400)
export interface SaveEvaluationItem {
  subCriteriaId: number;
  /** ยังไม่กรอกต้องส่ง null (ไม่ใช่ 0) และต้องเป็นจำนวนเต็ม [FR-EVL-07] [BR-EVL-07] */
  score?: number | null;
  /** ส่งเฉพาะข้อที่ allowComment = true */
  comment?: string | null;
  /** ส่งเฉพาะเกณฑ์ย่อยแบบ TEXT */
  textValue?: string | null;
}

/**
 * ซอง (envelope) ที่ backend ครอบทุก response สำเร็จไว้
 * เช่น { success: true, statusCode: 200, data: {...}, meta?: {...} }
 * apiClient ไม่ได้แกะชั้นนี้ออก จึงต้อง unwrap เองใน service ก่อนใช้งาน
 */
export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  data: T;
  meta?: unknown;
}