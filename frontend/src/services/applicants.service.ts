import { apiClient } from '@/lib/api-client';
import {
  ExcelPreviewResponse,
  ConfirmImportPayload,
  ConfirmImportResponse,
  ApplicantsListResponse,
  ImportBatchItem,
} from '@/types/applicants';

export async function uploadAndPreviewExcel(
  roundId: number,
  file: File,
): Promise<ExcelPreviewResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiClient<{ data: ExcelPreviewResponse } | ExcelPreviewResponse>(
    `/scholarship-rounds/${roundId}/applicants/preview-excel`,
    {
      method: 'POST',
      body: formData,
    },
  );

  return 'data' in res ? res.data : res;
}

export async function confirmImportApplicants(
  roundId: number,
  payload: ConfirmImportPayload,
): Promise<ConfirmImportResponse> {
  const res = await apiClient<{ data: ConfirmImportResponse } | ConfirmImportResponse>(
    `/scholarship-rounds/${roundId}/applicants/import`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );

  return 'data' in res ? res.data : res;
}

export async function cancelImportPreview(
  roundId: number,
  previewToken: string,
): Promise<void> {
  await apiClient(
    `/scholarship-rounds/${roundId}/applicants/import-previews/${previewToken}`,
    {
      method: 'DELETE',
    },
  );
}

export async function fetchApplicants(
  roundId: number,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    faculty?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {},
): Promise<ApplicantsListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.faculty) query.set('faculty', params.faculty);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  const qs = query.toString();
  const endpoint = `/scholarship-rounds/${roundId}/applicants${qs ? `?${qs}` : ''}`;

  return apiClient<ApplicantsListResponse>(endpoint, {
    method: 'GET',
    headers: {
      'x-user-role': 'ADMIN',
    },
  });
}

export async function fetchImportHistory(
  roundId: number,
): Promise<ImportBatchItem[]> {
  const res = await apiClient<{ data: ImportBatchItem[] } | ImportBatchItem[]>(
    `/scholarship-rounds/${roundId}/applicants/imports`,
    {
      method: 'GET',
      headers: {
        'x-user-role': 'ADMIN',
      },
    },
  );

  return 'data' in res ? res.data : res;
}
