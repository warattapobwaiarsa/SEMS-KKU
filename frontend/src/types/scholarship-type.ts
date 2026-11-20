export interface ScholarshipTypeListItem {
  id: number;
  name: string;
  description?: string | null;
  defaultCriteriaId?: number | null;
  defaultCriteriaName?: string | null;
  subCriteriaCount?: number;
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

export interface NestedSubCriteriaItem {
  id?: number;
  title: string;
  type: 'SCORED' | 'TEXT';
  maxScore?: number | null;
  allowComment?: boolean;
  sortOrder?: number;
}

export interface NestedCriteriaPayload {
  name?: string;
  subCriteria: NestedSubCriteriaItem[];
}

export interface CreateScholarshipTypePayload {
  name: string;
  description?: string;
  defaultCriteriaId?: number;
  criteria?: NestedCriteriaPayload;
}

export interface UpdateScholarshipTypePayload {
  name?: string;
  description?: string;
  defaultCriteriaId?: number | null;
  isActive?: boolean;
  criteria?: NestedCriteriaPayload;
}
