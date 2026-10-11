/**
 * Mock Evaluator ID helper (TEMPORARY จนกว่าจะมี KKU SSO [FR-AUTH-01])
 * อ่าน evaluator ID จาก localStorage (หากมี) เพื่อรองรับการสลับกรรมการตอนทดสอบ
 * ถ้าไม่มีจะอ่านจาก env variable NEXT_PUBLIC_MOCK_EVALUATOR_ID หรือ fallback เป็น "2" (evaluator1)
 */

export interface MockEvaluatorProfile {
  id: string;
  name: string;
  email: string;
}

export const MOCK_EVALUATORS: MockEvaluatorProfile[] = [
  { id: '2', name: 'ศ.ดร. กรรมการ ประเมินทุน 1', email: 'evaluator1@kku.ac.th' },
  { id: '3', name: 'ผศ.ดร. กรรมการ ประเมินทุน 2', email: 'evaluator2@kku.ac.th' },
  { id: '4', name: 'รศ.ดร. กรรมการ ประเมินทุน 3', email: 'evaluator3@kku.ac.th' },
];

export const EVALUATOR_STORAGE_KEY = 'sems_mock_evaluator_id';

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
  return found || { id: currentId, name: `กรรมการ (ID: ${currentId})`, email: `evaluator${currentId}@kku.ac.th` };
}