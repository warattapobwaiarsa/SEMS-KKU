import { Test, TestingModule } from '@nestjs/testing';
import { ApplicantsService } from './applicants.service';
import { ExcelParserService } from './excel-parser.service';
import { PrismaService } from '../prisma/prisma.service';
import { RoundStatus } from '@prisma/client';
import { BusinessException } from '../common/http-exception.filter';

describe('ApplicantsService', () => {
  let service: ApplicantsService;

  const mockPrisma = {
    scholarshipRound: {
      findUnique: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    applicant: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    importBatch: {
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockExcelParser = {
    parseBuffer: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicantsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ExcelParserService, useValue: mockExcelParser },
      ],
    }).compile();

    service = module.get<ApplicantsService>(ApplicantsService);
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.clearAllMocks();
  });

  describe('previewExcel', () => {
    it('should throw INVALID_ROUND_STATUS if round is not DRAFT (BR-IMP-01)', async () => {
      mockPrisma.scholarshipRound.findUnique.mockResolvedValue({
        id: 1,
        status: RoundStatus.OPEN,
      });

      const fakeFile = {
        originalname: 'test.xlsx',
        size: 1000,
        buffer: Buffer.from('abc'),
      } as Express.Multer.File;

      await expect(service.previewExcel(1, fakeFile)).rejects.toThrow(
        BusinessException,
      );
    });

    it('should throw FILE_TOO_LARGE if file exceeds 50MB (BR-IMP-02)', async () => {
      mockPrisma.scholarshipRound.findUnique.mockResolvedValue({
        id: 1,
        status: RoundStatus.DRAFT,
      });

      const fakeFile = {
        originalname: 'huge.xlsx',
        size: 51 * 1024 * 1024,
        buffer: Buffer.from(''),
      } as Express.Multer.File;

      await expect(service.previewExcel(1, fakeFile)).rejects.toThrow(
        BusinessException,
      );
    });

    it('should return preview token and rows for valid DRAFT round', async () => {
      mockPrisma.scholarshipRound.findUnique.mockResolvedValue({
        id: 1,
        status: RoundStatus.DRAFT,
      });

      mockExcelParser.parseBuffer.mockResolvedValue({
        totalRows: 5,
        validRows: 5,
        invalidRows: 0,
        previewRows: [],
        validApplicants: [],
        invalidRowsDetails: [],
      });

      const fakeFile = {
        originalname: 'sample.xlsx',
        size: 1000,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const result = await service.previewExcel(1, fakeFile);
      expect(result.previewToken).toBeDefined();
      expect(result.totalRows).toBe(5);
      expect(result.validRows).toBe(5);
    });
  });

  describe('getApplicantCrossRoundHistory', () => {
    it('should throw NotFoundException if no records found', async () => {
      mockPrisma.applicant.findMany.mockResolvedValueOnce([]);

      await expect(
        service.getApplicantCrossRoundHistory('653040999-9'),
      ).rejects.toThrow();
    });

    it('should return cross-round history, calculate scores, log audit, and exclude contact fields', async () => {
      mockPrisma.applicant.findMany.mockResolvedValueOnce([
        {
          id: 10,
          studentCode: '653040123-4',
          titlePrefix: 'นาย',
          firstName: 'สมหมาย',
          lastName: 'ใจดี',
          faculty: 'วิศวกรรมศาสตร์',
          major: 'วิศวกรรมคอมพิวเตอร์',
          studyYear: 2,
          gpa: 3.5,
          round: {
            id: 1,
            name: 'ทุนพัฒนา 2568/1',
            academicYear: 2568,
            semester: 1,
            status: RoundStatus.CLOSED,
            scholarshipType: { id: 1, name: 'ทุนขาดแคลน' },
            criteria: {
              id: 1,
              name: 'เกณฑ์ 1',
              subCriteria: [
                { id: 1, title: 'เกณฑ์ 1', type: 'SCORED', maxScore: 100 },
              ],
            },
            allocation: { status: 'FINALIZED', totalBudget: 100000 },
          },
          allocation: { isAwarded: true, amount: 15000 },
          evaluations: [
            {
              totalScore: 90,
              evaluator: { id: 2, name: 'อาจารย์ A' },
              items: [
                {
                  subCriteriaId: 1,
                  score: 90,
                  comment: 'ดีมาก',
                  textValue: null,
                  subCriteria: {
                    title: 'เกณฑ์ 1',
                    type: 'SCORED',
                    maxScore: 100,
                  },
                },
              ],
            },
            {
              totalScore: 80,
              evaluator: { id: 3, name: 'อาจารย์ B' },
              items: [
                {
                  subCriteriaId: 1,
                  score: 80,
                  comment: 'ดี',
                  textValue: null,
                  subCriteria: {
                    title: 'เกณฑ์ 1',
                    type: 'SCORED',
                    maxScore: 100,
                  },
                },
              ],
            },
          ],
        },
      ]);

      const result = await service.getApplicantCrossRoundHistory(
        '653040123-4',
        99,
      );

      expect(result.studentCode).toBe('653040123-4');
      expect(result.studentName).toBe('นายสมหมาย ใจดี');
      expect(result.totalRounds).toBe(1);
      expect(result.records[0].finalScore).toBe(85.0); // (90 + 80) / 2
      expect(result.records[0].allocation.awardStatus).toBe('AWARDED');
      expect(result.records[0].allocation.amount).toBe(15000);

      // Verify Audit Log
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            action: 'VIEW_APPLICANT_HISTORY',
            actorId: 99,
            entityId: '653040123-4',
          }),
        }),
      );

      // Verify PDPA: contact info is not in result
      const str = JSON.stringify(result);
      expect(str).not.toContain('citizenId');
      expect(str).not.toContain('phone');
      expect(str).not.toContain('email');
    });
  });
});
