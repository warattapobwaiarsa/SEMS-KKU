import { ApiResponse } from '@/types/criteria';
import {
  ScholarshipRoundListItem,
  ScholarshipRoundDetail,
  CreateRoundPayload,
  UpdateRoundPayload,
  OpenReadinessCheck,
  CloseStatusCheck,
} from '@/types/rounds';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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

  const res = await fetch(`${API_BASE_URL}/scholarship-rounds?${params.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.errorCode || 'Failed to fetch rounds list');
  }

  return res.json();
}

export async function fetchRoundById(id: number): Promise<ApiResponse<ScholarshipRoundDetail>> {
  const res = await fetch(`${API_BASE_URL}/scholarship-rounds/${id}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.errorCode || `Failed to fetch round #${id}`);
  }

  return res.json();
}

export async function createRound(payload: CreateRoundPayload): Promise<ApiResponse<ScholarshipRoundListItem>> {
  const res = await fetch(`${API_BASE_URL}/scholarship-rounds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.errorCode || 'Failed to create round');
  }

  return data;
}

export async function updateRound(id: number, payload: UpdateRoundPayload): Promise<ApiResponse<ScholarshipRoundDetail>> {
  const res = await fetch(`${API_BASE_URL}/scholarship-rounds/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.errorCode || 'Failed to update round');
  }

  return data;
}

export async function linkRoundCriteria(id: number, criteriaId: number | null): Promise<ApiResponse<ScholarshipRoundDetail>> {
  const res = await fetch(`${API_BASE_URL}/scholarship-rounds/${id}/criteria`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({ criteriaId }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.errorCode || 'Failed to link criteria');
  }

  return data;
}

export async function checkOpenReadiness(id: number): Promise<ApiResponse<OpenReadinessCheck>> {
  const res = await fetch(`${API_BASE_URL}/scholarship-rounds/${id}/open-check`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.errorCode || 'Failed to check open readiness');
  }

  return data;
}

export async function openRound(id: number): Promise<ApiResponse<ScholarshipRoundDetail>> {
  const res = await fetch(`${API_BASE_URL}/scholarship-rounds/${id}/open`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.errorCode || 'Failed to open round');
  }

  return data;
}

export async function checkCloseStatus(id: number): Promise<ApiResponse<CloseStatusCheck>> {
  const res = await fetch(`${API_BASE_URL}/scholarship-rounds/${id}/close-check`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.errorCode || 'Failed to check close status');
  }

  return data;
}

export async function closeRound(
  id: number,
  payload: { acknowledged?: boolean; acknowledgedCount?: number },
): Promise<ApiResponse<ScholarshipRoundDetail>> {
  const res = await fetch(`${API_BASE_URL}/scholarship-rounds/${id}/close`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.errorCode || 'Failed to close round');
  }

  return data;
}
