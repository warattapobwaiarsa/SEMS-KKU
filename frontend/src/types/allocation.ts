/**
 * Types สำหรับระบบการจัดสรรทุนการศึกษา (Scholarship Allocation)
 * สอดคล้องกับ Scope 1.3.2.9 และ Database Schema (AllocationSummary & Allocation)
 */

export type AllocationStatus = 'EDITING' | 'FINALIZED';

export interface AllocationApplicantItem {
  id: number;
  applicantId: number;
  studentCode: string;
  titlePrefix: string;
  firstName: string;
  lastName: string;
  faculty: string;
  major: string;
  studyYear: number;
  gpa: number;
  finalScore: number;
  rank: number;
  isAwarded: boolean;
  amount: number;
  /** เลขบัตรประชาชนแบบปิดบังบางส่วน เช่น 1-1002-xxxxx-xx-x [PDPA] */
  maskedCitizenId: string;
  /** เลขบัตรประชาชนเต็ม (แสดงเฉพาะเมื่อกดยืนยันเปิดดูใน Modal รายคน) */
  fullCitizenId?: string;
  phone: string;
  email: string;
}

export interface AllocationSummaryData {
  roundId: number;
  roundName: string;
  roundStatus: 'DRAFT' | 'OPEN' | 'CLOSED';
  totalBudget: number;
  allocatedAmount: number;
  remainingBudget: number;
  recipientsCount: number;
  status: AllocationStatus;
  statusChangedAt: string | null;
  allocations: AllocationApplicantItem[];
}

export interface SaveAllocationItemPayload {
  applicantId: number;
  isAwarded: boolean;
  amount: number;
}
