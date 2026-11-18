export interface ScholarshipTypeListItem {
  id: number;
  name: string;
  description?: string | null;
  defaultCriteriaId?: number | null;
  defaultCriteriaName?: string | null;
  isActive: boolean;
  roundsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScholarshipTypeDetail {
  id: number;
  name: string;
  description?: string | null;
  defaultCriteriaId?: number | null;
  defaultCriteria?: {
    id: number;
    name: string;
    subCriteria?: {
      id: number;
      title: string;
      type: string;
      maxScore?: number | null;
      allowComment?: boolean;
      sortOrder: number;
    }[];
  } | null;
  isActive: boolean;
  roundsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScholarshipTypePayload {
  name: string;
  description?: string;
  defaultCriteriaId?: number;
}

export interface UpdateScholarshipTypePayload {
  name?: string;
  description?: string;
  defaultCriteriaId?: number | null;
  isActive?: boolean;
}
