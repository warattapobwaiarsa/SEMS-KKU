/**
 * Service สำหรับเรียก API ฝั่ง Evaluator
 * ใช้ร่วมกับ frontend/src/types/evaluation.ts
 * [FR-EVL-01] [BR-EVL-01] [FR-EVL-03] [BR-SCR-01]
 */
import { apiClient } from '@/lib/api-client';
import { getEvaluatorId } from '@/lib/mock-evaluator';
import type {
  ApiEnvelope,
  EvaluatorApplicant,
  PaginationMeta,
  EvaluatorApplicantsQuery,
  EvaluatorApplicantDetail,
  MyEvaluationView,
  SaveEvaluationItem,
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

// ============================================================
// Step 9: API ของหน้าประเมินแบ่งจอ
// ทุก endpoint ต้องส่ง header X-User-Id (mock auth ชั่วคราว [FR-AUTH-01])
//
// หมายเหตุสำคัญ: backend ครอบ response สำเร็จไว้เป็น envelope
// { success, statusCode, data } แต่ apiClient "ไม่ได้แกะ .data ออก"
// จึงต้อง unwrap เองในไฟล์นี้ทุก function (ไม่งั้นหน้าจออ่าน items ไม่เจอ)
// ============================================================

/**
 * ดึงรายละเอียดผู้สมัคร (ฝั่งซ้ายของหน้าประเมิน) [FR-APP-03] [BR-APP-04]
 * GET /applicants/:id — ผ่าน RoleDispatchGuard จึงต้องส่ง X-User-Id เสมอ
 */
export async function fetchApplicantDetail(
  applicantId: number,
): Promise<EvaluatorApplicantDetail> {
  const res = await apiClient<ApiEnvelope<EvaluatorApplicantDetail>>(
    `/applicants/${applicantId}`,
    {
      method: 'GET',
      headers: {
        'X-User-Id': getEvaluatorId(),
      },
    },
  );
  // apiClient ไม่ unwrap envelope -> คืนเฉพาะ data ตรงๆ
  return res.data;
}

/**
 * ดึงผลการประเมินของตัวเอง + เกณฑ์ย่อยครบทุกข้อ (ฝั่งขวาของหน้าประเมิน) [FR-EVL-14]
 * GET /applicants/:applicantId/my-evaluation
 */
export async function fetchMyEvaluation(
  applicantId: number,
): Promise<MyEvaluationView> {
  const res = await apiClient<ApiEnvelope<MyEvaluationView>>(
    `/applicants/${applicantId}/my-evaluation`,
    {
      method: 'GET',
      headers: {
        'X-User-Id': getEvaluatorId(),
      },
    },
  );
  // apiClient ไม่ unwrap envelope -> คืนเฉพาะ data ตรงๆ
  return res.data;
}

/**
 * บันทึก Draft (auto-save / ปุ่มบันทึกร่าง) [FR-EVL-04] [FR-EVL-08]
 * PUT /applicants/:applicantId/my-evaluation
 * body: { items: [...] } — อย่างน้อย 1 ข้อ ห้ามส่งฟิลด์อื่นนอกเหนือจากนี้
 */
export async function saveMyEvaluation(
  applicantId: number,
  items: SaveEvaluationItem[],
): Promise<MyEvaluationView> {
  const res = await apiClient<ApiEnvelope<MyEvaluationView>>(
    `/applicants/${applicantId}/my-evaluation`,
    {
      method: 'PUT',
      headers: {
        'X-User-Id': getEvaluatorId(),
      },
      body: JSON.stringify({ items }),
    },
  );
  // apiClient ไม่ unwrap envelope -> คืนเฉพาะ data ตรงๆ
  return res.data;
}

/**
 * ยืนยันส่งผลการประเมิน DRAFT -> SUBMITTED [FR-EVL-11] [FR-EVL-13]
 * POST /applicants/:applicantId/my-evaluation/submit — ไม่มี body
 */
export async function submitMyEvaluation(
  applicantId: number,
): Promise<MyEvaluationView> {
  const res = await apiClient<ApiEnvelope<MyEvaluationView>>(
    `/applicants/${applicantId}/my-evaluation/submit`,
    {
      method: 'POST',
      headers: {
        'X-User-Id': getEvaluatorId(),
      },
    },
  );
  // apiClient ไม่ unwrap envelope -> คืนเฉพาะ data ตรงๆ
  return res.data;
}