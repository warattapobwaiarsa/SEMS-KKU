/**
 * Mock Evaluator ID helper (TEMPORARY จนกว่าจะมี KKU SSO [FR-AUTH-01])
 * อ่าน evaluator ID จาก env variable NEXT_PUBLIC_MOCK_EVALUATOR_ID
 * ถ้าไม่มีจะใช้ค่า default "2" (evaluator1@kku.ac.th ใน seed data)
 * ไม่ได้แตะ .env จริง — ให้ set env ในระบบ build/deploy แทน
 */
export function getEvaluatorId(): string {
  // ใช้ NEXT_PUBLIC_ prefix เพื่อให้ Next.js expose ให้ client-side ได้
  return process.env.NEXT_PUBLIC_MOCK_EVALUATOR_ID || '2';
}