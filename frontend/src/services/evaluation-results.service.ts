import { apiClient } from '@/lib/api-client';
import type {
  EvaluationResultsQuery,
  RoundEvaluationResultsData,
  ApiResponse,
  ApplicantEvaluationResultsResponse,
} from '@/types/evaluation-results';

/**
 * ดึงผลการประเมินและการจัดอันดับของรอบทุนสำหรับ Admin [FR-SCR-01..05]
 */
export async function fetchRoundEvaluationResults(
  roundId: number,
  query: EvaluationResultsQuery = {},
): Promise<ApiResponse<RoundEvaluationResultsData>> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.search) params.set('search', query.search);
  if (query.faculty) params.set('faculty', query.faculty);

  const endpoint = `/scholarship-rounds/${roundId}/evaluation-results${
    params.toString() ? `?${params.toString()}` : ''
  }`;

  return apiClient<ApiResponse<RoundEvaluationResultsData>>(endpoint, {
    method: 'GET',
    headers: {
      'x-user-role': 'ADMIN',
    },
  });
}

/**
 * ดึงรายละเอียดผลคะแนนรายบุคคล แยกตามกรรมการแต่ละท่าน [FR-SCR-06]
 */
export async function fetchApplicantEvaluationResults(
  applicantId: number,
): Promise<ApplicantEvaluationResultsResponse> {
  const endpoint = `/applicants/${applicantId}/evaluation-results`;

  const res = await apiClient<ApiResponse<ApplicantEvaluationResultsResponse> | ApplicantEvaluationResultsResponse>(
    endpoint,
    {
      method: 'GET',
      headers: {
        'x-user-role': 'ADMIN',
      },
    },
  );

  if ('data' in res && res.data) {
    return res.data;
  }
  return res as ApplicantEvaluationResultsResponse;
}
