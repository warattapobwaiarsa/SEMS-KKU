export interface FinalScore {
  average: number;
  count: number;
  display: string;
}

export interface ApplicantResultItem {
  rank: number;
  applicantId: number;
  studentCode: string;
  titlePrefix: string;
  firstName: string;
  lastName: string;
  faculty: string;
  major: string;
  studyYear: number;
  gpa: number;
  submittedCount: number;
  finalScore: FinalScore;
}

export interface RoundEvaluationSummary {
  totalApplicants: number;
  evaluatedApplicants: number;
  pendingApplicants: number;
  totalEvaluations: number;
}

export interface RoundEvaluationResultsData {
  round: {
    id: number;
    name: string;
    academicYear: number;
    semester: number;
    status: string;
  };
  summary: RoundEvaluationSummary;
  items: ApplicantResultItem[];
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
}

export interface ApplicantEvaluationItemDetail {
  subCriteriaId: number;
  title: string;
  type: 'SCORED' | 'TEXT';
  maxScore: number | null;
  allowComment: boolean;
  score: number | null;
  comment: string | null;
  textValue: string | null;
}

export interface EvaluatorSubmissionDetail {
  evaluatorId: number;
  evaluatorName: string;
  evaluatorEmail: string;
  submittedAt: string | null;
  totalScore: number | null;
  items: ApplicantEvaluationItemDetail[];
}

export interface ApplicantEvaluationResultsResponse {
  applicant: {
    id: number;
    roundId: number;
    studentCode: string;
    titlePrefix: string;
    firstName: string;
    lastName: string;
    faculty: string;
    major: string;
    studyYear: number;
    gpa: number;
  };
  round: {
    id: number;
    name: string;
    academicYear: number;
    semester: number;
    status: string;
  };
  finalScore: FinalScore;
  evaluations: EvaluatorSubmissionDetail[];
}

export interface EvaluationResultsQuery {
  page?: number;
  limit?: number;
  search?: string;
  faculty?: string;
}
