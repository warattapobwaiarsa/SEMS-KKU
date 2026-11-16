import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/criteria';
import {
  ScholarshipTypeListItem,
  ScholarshipTypeDetail,
  CreateScholarshipTypePayload,
  UpdateScholarshipTypePayload,
} from '@/types/scholarship-type';

export async function fetchScholarshipTypes(query?: {
  page?: number;
  limit?: number;
  search?: string;
  activeOnly?: boolean;
}): Promise<ApiResponse<ScholarshipTypeListItem[]>> {
  const params = new URLSearchParams();
  if (query?.page) params.append('page', query.page.toString());
  if (query?.limit) params.append('limit', query.limit.toString());
  if (query?.search) params.append('search', query.search);
  if (query?.activeOnly !== undefined) params.append('activeOnly', query.activeOnly.toString());

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  return apiClient<ApiResponse<ScholarshipTypeListItem[]>>(`/scholarship-types${queryStr}`, {
    cache: 'no-store',
  });
}

export async function fetchScholarshipTypeById(id: number): Promise<ApiResponse<ScholarshipTypeDetail>> {
  return apiClient<ApiResponse<ScholarshipTypeDetail>>(`/scholarship-types/${id}`, {
    cache: 'no-store',
  });
}

export async function createScholarshipType(
  payload: CreateScholarshipTypePayload,
): Promise<ApiResponse<ScholarshipTypeDetail>> {
  return apiClient<ApiResponse<ScholarshipTypeDetail>>('/scholarship-types', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateScholarshipType(
  id: number,
  payload: UpdateScholarshipTypePayload,
): Promise<ApiResponse<ScholarshipTypeDetail>> {
  return apiClient<ApiResponse<ScholarshipTypeDetail>>(`/scholarship-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function toggleScholarshipTypeActive(
  id: number,
  isActive: boolean,
): Promise<ApiResponse<ScholarshipTypeDetail>> {
  return apiClient<ApiResponse<ScholarshipTypeDetail>>(`/scholarship-types/${id}/toggle-active`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}
