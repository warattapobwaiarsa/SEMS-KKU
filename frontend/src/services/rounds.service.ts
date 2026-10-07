import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/criteria';
import {
  ScholarshipRoundListItem,
  ScholarshipRoundDetail,
  CreateRoundPayload,
  UpdateRoundPayload,
  OpenReadinessCheck,
  CloseStatusCheck,
} from '@/types/rounds';

export async function fetchRoundsList(query?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<ApiResponse<ScholarshipRoundListItem[]>> {
  const params = new URLSearchParams();
  if (query?.page) params.append('page', query.page.toString());
  if (query?.limit) params.append('limit', query.limit.toString());
  if (query?.search) params.append('search', query.search);
  if (query?.status) params.append('status', query.status);

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  return apiClient<ApiResponse<ScholarshipRoundListItem[]>>(`/scholarship-rounds${queryStr}`, {
    cache: 'no-store',
  });
}

export async function fetchRoundById(id: number): Promise<ApiResponse<ScholarshipRoundDetail>> {
  return apiClient<ApiResponse<ScholarshipRoundDetail>>(`/scholarship-rounds/${id}`, {
    cache: 'no-store',
  });
}

export async function createRound(payload: CreateRoundPayload): Promise<ApiResponse<ScholarshipRoundListItem>> {
  return apiClient<ApiResponse<ScholarshipRoundListItem>>('/scholarship-rounds', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateRound(id: number, payload: UpdateRoundPayload): Promise<ApiResponse<ScholarshipRoundDetail>> {
  return apiClient<ApiResponse<ScholarshipRoundDetail>>(`/scholarship-rounds/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function linkRoundCriteria(id: number, criteriaId: number | null): Promise<ApiResponse<ScholarshipRoundDetail>> {
  return apiClient<ApiResponse<ScholarshipRoundDetail>>(`/scholarship-rounds/${id}/criteria`, {
    method: 'PATCH',
    body: JSON.stringify({ criteriaId }),
  });
}

export async function checkOpenReadiness(id: number): Promise<ApiResponse<OpenReadinessCheck>> {
  return apiClient<ApiResponse<OpenReadinessCheck>>(`/scholarship-rounds/${id}/open-check`, {
    cache: 'no-store',
  });
}

export async function openRound(id: number): Promise<ApiResponse<ScholarshipRoundDetail>> {
  return apiClient<ApiResponse<ScholarshipRoundDetail>>(`/scholarship-rounds/${id}/open`, {
    method: 'POST',
  });
}

export async function checkCloseStatus(id: number): Promise<ApiResponse<CloseStatusCheck>> {
  return apiClient<ApiResponse<CloseStatusCheck>>(`/scholarship-rounds/${id}/close-check`, {
    cache: 'no-store',
  });
}

export async function closeRound(
  id: number,
  payload: { acknowledged?: boolean; acknowledgedCount?: number },
): Promise<ApiResponse<ScholarshipRoundDetail>> {
  return apiClient<ApiResponse<ScholarshipRoundDetail>>(`/scholarship-rounds/${id}/close`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
