/**
 * Mock Auth & User ID helper (TEMPORARY จนกว่าจะมี KKU SSO [FR-AUTH-01])
 * อ่าน evaluator ID / admin ID จาก localStorage (หากมี) เพื่อรองรับการสลับบัญชีตอนทดสอบ
 * ถ้าไม่มีจะอ่านจาก env variable หรือ fallback เป็นค่าเริ่มต้น
 */

export interface MockEvaluatorProfile {
  id: string;
  name: string;
  email: string;
  department?: string;
}

export interface MockAdminProfile {
  id: string;
  name: string;
  email: string;
  department?: string;
}

export const MOCK_ADMINS: MockAdminProfile[] = [
  {
    id: '1',
    name: 'นายอนุชา ผู้ดูแล (Admin)',
    email: 'admin@kku.ac.th',
    department: 'งานบริการการศึกษา',
  },
];

export const MOCK_EVALUATORS: MockEvaluatorProfile[] = [
  { id: '2', name: 'ศ.ดร. กรรมการ ประเมินทุน 1', email: 'evaluator1@kku.ac.th', department: 'สาขาวิศวกรรมคอมพิวเตอร์' },
  { id: '3', name: 'ผศ.ดร. กรรมการ ประเมินทุน 2', email: 'evaluator2@kku.ac.th', department: 'สาขาวิศวกรรมไฟฟ้า' },
  { id: '4', name: 'รศ.ดร. กรรมการ ประเมินทุน 3', email: 'evaluator3@kku.ac.th', department: 'สาขาวิศวกรรมโยธา' },
];

export const EVALUATOR_STORAGE_KEY = 'sems_mock_evaluator_id';
export const ADMIN_STORAGE_KEY = 'sems_mock_admin_id';

export function getEvaluatorId(): string {
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(EVALUATOR_STORAGE_KEY);
      if (stored) {
        return stored;
      }
    } catch {
      // Fallback if localStorage is unavailable
    }
  }
  return process.env.NEXT_PUBLIC_MOCK_EVALUATOR_ID || '2';
}

export function setEvaluatorId(id: string): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(EVALUATOR_STORAGE_KEY, id);
      window.dispatchEvent(new CustomEvent('sems_evaluator_changed', { detail: { id } }));
    } catch {
      // Ignore localStorage write error
    }
  }
}

export function getCurrentEvaluatorProfile(): MockEvaluatorProfile {
  const currentId = getEvaluatorId();
  const found = MOCK_EVALUATORS.find((ev) => ev.id === currentId);
  return found || { id: currentId, name: `กรรมการ (ID: ${currentId})`, email: `evaluator${currentId}@kku.ac.th`, department: 'คณะวิศวกรรมศาสตร์' };
}

export function getAdminId(): string {
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(ADMIN_STORAGE_KEY);
      if (stored) {
        return stored;
      }
    } catch {
      // Fallback if localStorage is unavailable
    }
  }
  return process.env.NEXT_PUBLIC_MOCK_ADMIN_ID || '1';
}

export function setAdminId(id: string): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(ADMIN_STORAGE_KEY, id);
      window.dispatchEvent(new CustomEvent('sems_admin_changed', { detail: { id } }));
    } catch {
      // Ignore localStorage write error
    }
  }
}

export function clearAuthSession(): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(EVALUATOR_STORAGE_KEY);
      window.localStorage.removeItem(ADMIN_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('sems_evaluator_changed', { detail: { id: null } }));
      window.dispatchEvent(new CustomEvent('sems_admin_changed', { detail: { id: null } }));
    } catch {
      // Ignore
    }
  }
}

export function getCurrentAdminProfile(): MockAdminProfile {
  const currentId = getAdminId();
  const found = MOCK_ADMINS.find((ad) => ad.id === currentId);
  return found || { id: currentId, name: `ผู้ดูแลระบบ (ID: ${currentId})`, email: `admin${currentId}@kku.ac.th`, department: 'งานบริการการศึกษา' };
}
