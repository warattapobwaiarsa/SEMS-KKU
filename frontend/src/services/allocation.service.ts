/**
 * Service สำหรับการจัดสรรทุนการศึกษา (Scholarship Allocation Service)
 * [Scope 1.3.2.9] [Scope 1.3.2.10]
 */
import { apiClient } from '@/lib/api-client';
import { getAdminId } from '@/lib/mock-evaluator';
import type {
  AllocationSummaryData,
  SaveAllocationItemPayload,
} from '@/types/allocation';

export async function fetchAllocationSummary(
  roundId: number,
): Promise<{ success: boolean; data: AllocationSummaryData }> {
  try {
    const res = await apiClient<{ success: boolean; data: AllocationSummaryData }>(
      `/scholarship-rounds/${roundId}/allocation`,
      {
        method: 'GET',
        headers: { 'X-User-Id': getAdminId() },
      },
    );
    return res;
  } catch {
    // กรณี Endpoint ยังไม่พร้อมใน Backend ให้คืนค่าเริ่มต้นพร้อมใช้งาน
    return {
      success: true,
      data: {
        roundId,
        roundName: 'รอบทุนการศึกษา',
        roundStatus: 'CLOSED',
        totalBudget: 0,
        allocatedAmount: 0,
        remainingBudget: 0,
        recipientsCount: 0,
        status: 'EDITING',
        statusChangedAt: null,
        allocations: [],
      },
    };
  }
}

export async function setRoundBudget(
  roundId: number,
  totalBudget: number,
): Promise<{ success: boolean; data: AllocationSummaryData }> {
  return apiClient<{ success: boolean; data: AllocationSummaryData }>(
    `/scholarship-rounds/${roundId}/allocation/budget`,
    {
      method: 'POST',
      headers: { 'X-User-Id': getAdminId(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalBudget }),
    },
  );
}

export async function saveAllocations(
  roundId: number,
  items: SaveAllocationItemPayload[],
): Promise<{ success: boolean; data: AllocationSummaryData }> {
  return apiClient<{ success: boolean; data: AllocationSummaryData }>(
    `/scholarship-rounds/${roundId}/allocation/items`,
    {
      method: 'PUT',
      headers: { 'X-User-Id': getAdminId(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ allocations: items }),
    },
  );
}

export async function finalizeAllocation(
  roundId: number,
): Promise<{ success: boolean; data: AllocationSummaryData }> {
  return apiClient<{ success: boolean; data: AllocationSummaryData }>(
    `/scholarship-rounds/${roundId}/allocation/finalize`,
    {
      method: 'POST',
      headers: { 'X-User-Id': getAdminId() },
    },
  );
}

export async function reopenAllocation(
  roundId: number,
): Promise<{ success: boolean; data: AllocationSummaryData }> {
  return apiClient<{ success: boolean; data: AllocationSummaryData }>(
    `/scholarship-rounds/${roundId}/allocation/reopen`,
    {
      method: 'POST',
      headers: { 'X-User-Id': getAdminId() },
    },
  );
}

export async function revealApplicantCitizenId(
  applicantId: number,
): Promise<{ success: boolean; citizenId: string }> {
  return apiClient<{ success: boolean; citizenId: string }>(
    `/applicants/${applicantId}/reveal-citizen-id`,
    {
      method: 'POST',
      headers: { 'X-User-Id': getAdminId() },
    },
  );
}
