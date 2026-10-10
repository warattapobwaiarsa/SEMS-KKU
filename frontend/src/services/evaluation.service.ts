/**
 * Service สำหรับเรียก API ฝั่ง Evaluator
 * ใช้ร่วมกับ frontend/src/types/evaluation.ts
 * [FR-EVL-01] [BR-EVL-01] [FR-EVL-03] [BR-SCR-01]
 */
import { apiClient } from '@/lib/api-client';
import { getEvaluatorId } from '@/lib/mock-evaluator';
import type {
  EvaluatorApplicant,
  PaginationMeta,
  EvaluatorApplicantsQuery,
} from '@/types/evaluation';

/**
 * ดึงรายชื่อผู้สมัครของรอบสำหรับ Evaluator
 * GET /scholarship-rounds/:roundId/applicants?search=&page=&limit=
 * Header: X-User-Id (mock auth, TEMPORARY จนกว่าจะมี KKU SSO [FR-AUTH-01])
 *
 * @param roundId - ID ของรอบทุน
 * @param query - query parameters (search, page, limit)
 * @returns { data: EvaluatorApplicant[], meta: PaginationMeta }
 */
export async function fetchEvaluatorApplicants(
  roundId: number,
  query: EvaluatorApplicantsQuery = {},
): Promise<{ data: EvaluatorApplicant[]; meta: PaginationMeta }> {
  const params = new URLSearchParams();

  if (query.search) params.set('search', query.search);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));

  const endpoint = `/scholarship-rounds/${roundId}/applicants${params.toString() ? `?${params.toString()}` : ''}`;

  return apiClient<{ data: EvaluatorApplicant[]; meta: { page: number; limit: number; total: number; totalPages: number } }>(
    endpoint,
    {
      method: 'GET',
      headers: {
        'X-User-Id': getEvaluatorId(),
      },
    }
  );
}