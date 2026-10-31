export type SubCriteriaType = 'SCORED' | 'TEXT';
export type RoundStatus = 'DRAFT' | 'OPEN' | 'CLOSED';

export interface SubCriteria {
  id?: number;
  criteriaId?: number;
  sortOrder: number;
  title: string;
  type: SubCriteriaType;
  maxScore?: number | null;
  allowComment?: boolean;
}

export interface RoundUsageItem {
  id: number;
  name: string;
  status: RoundStatus;
}

export interface CriteriaDetail {
  id: number;
  name: string;
  isLocked: boolean;
  totalScore: number;
  usedByRounds: RoundUsageItem[];
  subCriteria: SubCriteria[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCriteriaPayload {
  name: string;
  subCriteria: {
    sortOrder: number;
    title: string;
    type: SubCriteriaType;
    maxScore?: number;
    allowComment?: boolean;
  }[];
}

export interface UpdateCriteriaPayload {
  name: string;
  subCriteria: {
    id?: number;
    sortOrder: number;
    title: string;
    type: SubCriteriaType;
    maxScore?: number;
    allowComment?: boolean;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  errorCode?: string;
  message?: string;
  params?: Record<string, unknown>;
}
