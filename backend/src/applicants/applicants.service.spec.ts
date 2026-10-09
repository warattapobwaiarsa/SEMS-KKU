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
});
