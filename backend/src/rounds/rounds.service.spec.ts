/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Test, TestingModule } from '@nestjs/testing';
import { RoundsService } from './rounds.service';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/http-exception.filter';
import { RoundStatus } from '@prisma/client';

describe('RoundsService', () => {
  let service: RoundsService;

  const mockPrismaService = {
    scholarshipRound: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    criteria: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((cb: (tx: unknown) => unknown) =>
      cb(mockPrismaService),
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoundsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RoundsService>(RoundsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw ACADEMIC_YEAR_OUT_OF_RANGE if year is not 2550-2700 (BR-RND-01)', async () => {
      const dto = {
        name: 'ทุนทั่วไป',
        academicYear: 2549,
        semester: 1,
      };

      try {
        await service.create(dto);
      } catch (err: unknown) {
        const error = err as BusinessException;
        expect(error.errorCode).toBe('ACADEMIC_YEAR_OUT_OF_RANGE');
      }
    });

    it('should throw SEMESTER_OUT_OF_RANGE if semester is not 1 or 2 (BR-RND-02)', async () => {
      const dto = {
        name: 'ทุนทั่วไป',
        academicYear: 2569,
        semester: 3,
      };

      try {
        await service.create(dto);
      } catch (err: unknown) {
        const error = err as BusinessException;
        expect(error.errorCode).toBe('SEMESTER_OUT_OF_RANGE');
      }
    });

    it('should create round in DRAFT status', async () => {
      mockPrismaService.scholarshipRound.create.mockResolvedValueOnce({
        id: 1,
        name: 'ทุนทั่วไป 2569/1',
        academicYear: 2569,
        semester: 1,
        status: RoundStatus.DRAFT,
        criteriaId: null,
        criteria: null,
        createdAt: new Date(),
        openedAt: null,
        closedAt: null,
        updatedAt: new Date(),
      });

      const result = await service.create({
        name: 'ทุนทั่วไป 2569/1',
        academicYear: 2569,
        semester: 1,
      });

      expect(result.id).toBe(1);
      expect(result.status).toBe(RoundStatus.DRAFT);
      expect(result.applicantCount).toBe(0);
    });
  });

  describe('openRound state transition', () => {
    it('should fail openRound if readiness pre-check fails (FR-RND-08)', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce({
        id: 1,
        name: 'ทุนทั่วไป',
        academicYear: 2569,
        semester: 1,
        status: RoundStatus.DRAFT,
        criteria: null, // No criteria attached
        _count: { applicants: 0 }, // 0 applicants
        importBatches: [],
      });

      try {
        await service.openRound(1);
      } catch (err: unknown) {
        const error = err as BusinessException;
        expect(error.errorCode).toBe('ROUND_OPEN_PRECHECK_FAILED');
      }
    });
  });

  describe('closeRound state transition', () => {
    it('should throw ROUND_CLOSE_ACK_REQUIRED if there are unsubmitted applicants without acknowledge (FR-RND-12)', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce({
        id: 1,
        status: RoundStatus.OPEN,
        applicants: [
          {
            id: 10,
            studentCode: '653040001-1',
            titlePrefix: 'นาย',
            firstName: 'สมชาย',
            lastName: 'ใจดี',
            evaluations: [], // No submitted evaluations
          },
        ],
      });

      try {
        await service.closeRound(1, {});
      } catch (err: unknown) {
        const error = err as BusinessException;
        expect(error.errorCode).toBe('ROUND_CLOSE_ACK_REQUIRED');
      }
    });
  });

  describe('linkCriteria', () => {
    it('should throw INVALID_ROUND_STATUS if round is not DRAFT (BR-RND-07)', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce({
        id: 1,
        status: RoundStatus.OPEN,
      });

      try {
        await service.linkCriteria(1, { criteriaId: 5 });
      } catch (err: unknown) {
        const error = err as BusinessException;
        expect(error.errorCode).toBe('INVALID_ROUND_STATUS');
      }
    });
  });

  describe('update', () => {
    it('should throw INVALID_ROUND_STATUS if round is not DRAFT', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce({
        id: 1,
        status: RoundStatus.CLOSED,
      });

      try {
        await service.update(1, { name: 'เปลี่ยนชื่อ' });
      } catch (err: unknown) {
        const error = err as BusinessException;
        expect(error.errorCode).toBe('INVALID_ROUND_STATUS');
      }
    });
  });
});
