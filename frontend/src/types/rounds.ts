import { RoundStatus } from './criteria';

export interface ScholarshipRoundListItem {
  id: number;
  name: string;
  academicYear: number;
  semester: number;
  status: RoundStatus;
  criteriaId?: number | null;
  criteriaName?: string | null;
  applicantCount: number;
  createdAt: string;
  openedAt?: string | null;
  closedAt?: string | null;
  updatedAt: string;
}

export interface ScholarshipRoundDetail extends ScholarshipRoundListItem {
  criteria?: {
    id: number;
    name: string;
    subCriteria: {
      id: number;
      title: string;
      type: string;
      maxScore?: number | null;
      allowComment?: boolean;
    }[];
  } | null;
  lastInvalidRowsCount: number;
}

export interface CreateRoundPayload {
  name: string;
  academicYear: number;
  semester: number;
  criteriaId?: number;
}

export interface UpdateRoundPayload {
  name?: string;
  academicYear?: number;
  semester?: number;
}

export interface OpenReadinessCheck {
  isReady: boolean;
  reasons: string[];
  applicantCount: number;
  criteriaName?: string | null;
  lastInvalidRowsCount: number;
}

export interface CloseStatusCheck {
  roundId: number;
  unsubmittedCount: number;
  applicants: {
    applicantId: number;
    studentCode: string;
    titlePrefix: string;
    firstName: string;
    lastName: string;
  }[];
}
