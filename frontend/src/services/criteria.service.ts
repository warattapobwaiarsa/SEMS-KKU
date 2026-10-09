import { apiClient } from '@/lib/api-client';
import { CriteriaDetail, CreateCriteriaPayload, UpdateCriteriaPayload, ApiResponse } from '@/types/criteria';

export async function fetchCriteriaList(query?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<CriteriaDetail[]>> {
  const params = new URLSearchParams();
  if (query?.page) params.append('page', query.page.toString());
  if (query?.limit) params.append('limit', query.limit.toString());
  if (query?.search) params.append('search', query.search);

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  return apiClient<ApiResponse<CriteriaDetail[]>>(`/criteria${queryStr}`, {
    cache: 'no-store',
  });
}

export async function fetchCriteriaById(id: number): Promise<ApiResponse<CriteriaDetail>> {
  return apiClient<ApiResponse<CriteriaDetail>>(`/criteria/${id}`, {
    cache: 'no-store',
  });
}

export async function createCriteria(payload: CreateCriteriaPayload): Promise<ApiResponse<CriteriaDetail>> {
  return apiClient<ApiResponse<CriteriaDetail>>('/criteria', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCriteria(id: number, payload: UpdateCriteriaPayload): Promise<ApiResponse<CriteriaDetail>> {
  return apiClient<ApiResponse<CriteriaDetail>>(`/criteria/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
