import { EvaluationStatus } from '@prisma/client';
import { EvaluationResultsService } from './evaluation-results.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EvaluationResultsService', () => {
  let service: EvaluationResultsService;
  let prismaMock: {
    scholarshipRound: { findUnique: jest.Mock };
    applicant: { findMany: jest.Mock; findUnique: jest.Mock };
  };

  beforeEach(() => {
    prismaMock = {
      scholarshipRound: { findUnique: (jest.MockedFunction = jest.fn()) },
      applicant: {
        findMany: (jest.MockedFunction = jest.fn()),
        findUnique: (jest.MockedFunction = jest.fn()),
      },
    };
    service = new EvaluationResultsService(
      prismaMock as unknown as PrismaService,
    );
  });

  describe('getRoundEvaluationResults', () => {
    it('should correctly average multi-evaluator scores and sort according to tie-break rules [BR-SCR-01..05]', async () => {
      prismaMock.scholarshipRound.findUnique.mockResolvedValue({
        id: 1,
        name: 'ทุนการศึกษาปี 2569',
        academicYear: 2569,
        semester: 1,
        status: 'OPEN',
      });

      // Mock 3 applicants with various scores:
      // Applicant 1: Two evaluators submitted (80 + 90) -> average = 85.00, GPA 3.50, code '653040001-1'
      // Applicant 2: Two evaluators submitted (85 + 85) -> average = 85.00, GPA 3.80, code '653040002-9' (Tie-break on GPA)
      // Applicant 3: One evaluator submitted (95) -> average = 95.00, GPA 3.20, code '653040003-7'
      // Applicant 4: No submitted evaluators -> average = 0.00, GPA 3.90, code '653040004-5'
      prismaMock.applicant.findMany.mockResolvedValue([
        {
          id: 1,
          studentCode: '653040001-1',
          titlePrefix: 'นาย',
          firstName: 'สมชาย',
          lastName: 'เรียนดี',
          faculty: 'วิศวกรรมศาสตร์',
          major: 'วิศวกรรมคอมพิวเตอร์',
          studyYear: 3,
          gpa: '3.50',
          evaluations: [
            { id: 101, status: EvaluationStatus.SUBMITTED, totalScore: 80 },
            { id: 102, status: EvaluationStatus.SUBMITTED, totalScore: 90 },
          ],
        },
        {
          id: 2,
          studentCode: '653040002-9',
          titlePrefix: 'นางสาว',
          firstName: 'สมหญิง',
          lastName: 'ใจมั่น',
          faculty: 'วิศวกรรมศาสตร์',
          major: 'วิศวกรรมคอมพิวเตอร์',
          studyYear: 3,
          gpa: '3.80',
          evaluations: [
            { id: 103, status: EvaluationStatus.SUBMITTED, totalScore: 85 },
            { id: 104, status: EvaluationStatus.SUBMITTED, totalScore: 85 },
          ],
        },
        {
          id: 3,
          studentCode: '653040003-7',
          titlePrefix: 'นาย',
          firstName: 'วิชัย',
          lastName: 'เก่งกล้า',
          faculty: 'วิศวกรรมศาสตร์',
          major: 'วิศวกรรมไฟฟ้า',
          studyYear: 2,
          gpa: '3.20',
          evaluations: [
            { id: 105, status: EvaluationStatus.SUBMITTED, totalScore: 95 },
          ],
        },
        {
          id: 4,
          studentCode: '653040004-5',
          titlePrefix: 'นาย',
          firstName: 'ธนากร',
          lastName: 'พยายาม',
          faculty: 'วิศวกรรมศาสตร์',
          major: 'วิศวกรรมโยธา',
          studyYear: 1,
          gpa: '3.90',
          evaluations: [],
        },
      ]);

      const result = await service.getRoundEvaluationResults(1, {
        page: 1,
        limit: 10,
      });

      // Verification:
      expect(result.data.summary.totalApplicants).toBe(4);
      expect(result.data.summary.evaluatedApplicants).toBe(3);
      expect(result.data.summary.pendingApplicants).toBe(1);
      expect(result.data.summary.totalEvaluations).toBe(5);

      // Rank 1: Applicant 3 (average 95.00)
      expect(result.data.items[0].applicantId).toBe(3);
      expect(result.data.items[0].rank).toBe(1);
      expect(result.data.items[0].finalScore.display).toBe('95.00');

      // Rank 2: Applicant 2 (average 85.00, GPA 3.80 -> higher GPA tie-break)
      expect(result.data.items[1].applicantId).toBe(2);
      expect(result.data.items[1].rank).toBe(2);
      expect(result.data.items[1].finalScore.display).toBe('85.00');
      expect(result.data.items[1].submittedCount).toBe(2);

      // Rank 3: Applicant 1 (average 85.00, GPA 3.50)
      expect(result.data.items[2].applicantId).toBe(1);
      expect(result.data.items[2].rank).toBe(3);
      expect(result.data.items[2].finalScore.display).toBe('85.00');
      expect(result.data.items[2].submittedCount).toBe(2);

      // Rank 4: Applicant 4 (average 0.00)
      expect(result.data.items[3].applicantId).toBe(4);
      expect(result.data.items[3].rank).toBe(4);
      expect(result.data.items[3].finalScore.display).toBe('0.00');
      expect(result.data.items[3].submittedCount).toBe(0);
    });
  });
});
