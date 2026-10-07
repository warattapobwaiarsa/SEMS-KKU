import { CriteriaDetail, CreateCriteriaPayload, UpdateCriteriaPayload, ApiResponse } from '@/types/criteria';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function fetchCriteriaList(query?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<CriteriaDetail[]>> {
  const params = new URLSearchParams();
  if (query?.page) params.append('page', query.page.toString());
  if (query?.limit) params.append('limit', query.limit.toString());
  if (query?.search) params.append('search', query.search);

  const res = await fetch(`${API_BASE_URL}/criteria?${params.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.errorCode || 'Failed to fetch criteria list');
  }

  return res.json();
}

export async function fetchCriteriaById(id: number): Promise<ApiResponse<CriteriaDetail>> {
  const res = await fetch(`${API_BASE_URL}/criteria/${id}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.errorCode || `Failed to fetch criteria #${id}`);
  }

  return res.json();
}

export async function createCriteria(payload: CreateCriteriaPayload): Promise<ApiResponse<CriteriaDetail>> {
  const res = await fetch(`${API_BASE_URL}/criteria`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.errorCode || 'Failed to create criteria');
  }

  return data;
}

export async function updateCriteria(id: number, payload: UpdateCriteriaPayload): Promise<ApiResponse<CriteriaDetail>> {
  const res = await fetch(`${API_BASE_URL}/criteria/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.errorCode || 'Failed to update criteria');
  }

  return data;
}
