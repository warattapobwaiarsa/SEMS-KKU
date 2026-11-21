/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RoundsService } from './rounds.service';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/http-exception.filter';
import { RoundStatus, SubCriteriaType } from '@prisma/client';

describe('RoundsService', () => {
  let service: RoundsService;

  const mockPrismaService = {
    scholarshipRound: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    applicant: {
      deleteMany: jest.fn(),
    },
    applicantContact: {
      deleteMany: jest.fn(),
    },
    applicantSupportingInfo: {
      deleteMany: jest.fn(),
    },
    evaluation: {
      deleteMany: jest.fn(),
    },
    evaluationItem: {
      deleteMany: jest.fn(),
    },
    importBatch: {
      deleteMany: jest.fn(),
    },
    criteria: {
      findUnique: jest.fn(),
    },
    scholarshipType: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    allocationSummary: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    allocation: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
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

  describe('findAll', () => {
    it('should return paginated rounds with criteria and applicant count', async () => {
      mockPrismaService.scholarshipRound.count.mockResolvedValueOnce(2);
      mockPrismaService.scholarshipRound.findMany.mockResolvedValueOnce([
        {
          id: 1,
          name: 'ทุนทั่วไป 2569/1',
          academicYear: 2569,
          semester: 1,
          status: RoundStatus.DRAFT,
          criteriaId: 10,
          criteria: { name: 'เกณฑ์ทุนทั่วไป' },
          _count: { applicants: 5 },
          createdAt: new Date(),
          openedAt: null,
          closedAt: null,
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'ทุนเรียนดี 2569/1',
          academicYear: 2569,
          semester: 1,
          status: RoundStatus.OPEN,
          criteriaId: null,
          criteria: null,
          _count: { applicants: 12 },
          createdAt: new Date(),
          openedAt: new Date(),
          closedAt: null,
          updatedAt: new Date(),
        },
      ]);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        search: 'ทุน',
      });

      expect(result.data.length).toBe(2);
      expect(result.data[0].criteriaName).toBe('เกณฑ์ทุนทั่วไป');
      expect(result.data[0].applicantCount).toBe(5);
      expect(result.meta.total).toBe(2);
    });

    it('should filter only OPEN rounds for EVALUATOR role (BR-EVL-01)', async () => {
      mockPrismaService.scholarshipRound.count.mockResolvedValueOnce(1);
      mockPrismaService.scholarshipRound.findMany.mockResolvedValueOnce([
        {
          id: 2,
          name: 'ทุนเรียนดี 2569/1',
          academicYear: 2569,
          semester: 1,
          status: RoundStatus.OPEN,
          criteriaId: null,
          criteria: null,
          _count: { applicants: 12 },
          createdAt: new Date(),
          openedAt: new Date(),
          closedAt: null,
          updatedAt: new Date(),
        },
      ]);

      const result = await service.findAll({ userRole: 'EVALUATOR' });

      expect(mockPrismaService.scholarshipRound.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: RoundStatus.OPEN }),
        }),
      );
      expect(result.data.length).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return round details with criteria, applicantCount and invalid rows count', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce({
        id: 1,
        name: 'ทุนวิจัย',
        academicYear: 2569,
        semester: 1,
        status: RoundStatus.DRAFT,
        criteriaId: 5,
        criteria: {
          id: 5,
          name: 'เกณฑ์วิจัย',
          subCriteria: [{ id: 1, title: 'ข้อเสนอ', sortOrder: 1 }],
        },
        _count: { applicants: 3 },
        importBatches: [{ invalidRows: 2, importedAt: new Date() }],
        createdAt: new Date(),
        openedAt: null,
        closedAt: null,
        updatedAt: new Date(),
      });

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
      expect(result.applicantCount).toBe(3);
      expect(result.lastInvalidRowsCount).toBe(2);
      expect(result.criteria?.name).toBe('เกณฑ์วิจัย');
    });

    it('should throw NotFoundException if round does not exist', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if EVALUATOR accesses non-OPEN round', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce({
        id: 1,
        status: RoundStatus.DRAFT,
        importBatches: [],
        _count: { applicants: 0 },
      });

      await expect(service.findOne(1, 'EVALUATOR')).rejects.toThrow(
        NotFoundException,
      );
    });
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

    it('should throw SCHOLARSHIP_TYPE_INACTIVE when creating round with inactive type', async () => {
      mockPrismaService.scholarshipType.findUnique.mockResolvedValueOnce({
        id: 2,
        name: 'ทุนปิด',
        isActive: false,
      });

      try {
        await service.create({
          name: 'ทุนปิด 2569/1',
          academicYear: 2569,
          semester: 1,
          scholarshipTypeId: 2,
        });
        fail('Should throw');
      } catch (err: unknown) {
        const error = err as BusinessException;
        expect(error.errorCode).toBe('SCHOLARSHIP_TYPE_INACTIVE');
      }
    });

    it('should auto-assign defaultCriteriaId from scholarshipType when criteriaId not provided', async () => {
      mockPrismaService.scholarshipType.findUnique.mockResolvedValueOnce({
        id: 1,
        name: 'ทุนขาดแคลน',
        isActive: true,
        defaultCriteriaId: 10,
      });
      mockPrismaService.scholarshipRound.create.mockResolvedValueOnce({
        id: 2,
        name: 'ทุนขาดแคลน 2569/1',
        academicYear: 2569,
        semester: 1,
        status: RoundStatus.DRAFT,
        scholarshipTypeId: 1,
        criteriaId: 10,
        criteria: { id: 10, name: 'เกณฑ์ขาดแคลน' },
        scholarshipType: { id: 1, name: 'ทุนขาดแคลน' },
        createdAt: new Date(),
        openedAt: null,
        closedAt: null,
        updatedAt: new Date(),
      });

      const result = await service.create({
        name: 'ทุนขาดแคลน 2569/1',
        academicYear: 2569,
        semester: 1,
        scholarshipTypeId: 1,
      });

      expect(mockPrismaService.scholarshipRound.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            criteriaId: 10,
            scholarshipTypeId: 1,
          }),
        }),
      );
      expect(result.criteriaId).toBe(10);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if round does not exist', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.update(999, { name: 'ไม่มีอยู่จริง' }),
      ).rejects.toThrow(NotFoundException);
    });

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

    it('should throw ACADEMIC_YEAR_OUT_OF_RANGE on update if year is invalid', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce({
        id: 1,
        status: RoundStatus.DRAFT,
      });

      try {
        await service.update(1, { academicYear: 2026 });
      } catch (err: unknown) {
        const error = err as BusinessException;
        expect(error.errorCode).toBe('ACADEMIC_YEAR_OUT_OF_RANGE');
      }
    });

    it('should throw SEMESTER_OUT_OF_RANGE on update if semester is invalid', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce({
        id: 1,
        status: RoundStatus.DRAFT,
      });

      try {
        await service.update(1, { semester: 0 });
      } catch (err: unknown) {
        const error = err as BusinessException;
        expect(error.errorCode).toBe('SEMESTER_OUT_OF_RANGE');
      }
    });

    it('should successfully update round when in DRAFT status', async () => {
      mockPrismaService.scholarshipRound.findUnique
        .mockResolvedValueOnce({ id: 1, status: RoundStatus.DRAFT })
        // findOne(1) call
        .mockResolvedValueOnce({
          id: 1,
          name: 'ชื่อใหม่ 2569',
          academicYear: 2569,
          semester: 2,
          status: RoundStatus.DRAFT,
          criteriaId: null,
          criteria: null,
          _count: { applicants: 0 },
          importBatches: [],
          createdAt: new Date(),
          openedAt: null,
          closedAt: null,
          updatedAt: new Date(),
        });
      mockPrismaService.scholarshipRound.update.mockResolvedValueOnce({
        id: 1,
      });

      const result = await service.update(1, {
        name: 'ชื่อใหม่ 2569',
        semester: 2,
      });

      expect(mockPrismaService.scholarshipRound.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'ชื่อใหม่ 2569', semester: 2 },
      });
      expect(result.name).toBe('ชื่อใหม่ 2569');
      expect(result.semester).toBe(2);
    });

    it('should throw CRITERIA_RESET_CONFIRMATION_REQUIRED if changing scholarship type with default criteria without confirm', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce({
        id: 1,
        status: RoundStatus.DRAFT,
        scholarshipTypeId: 1,
        criteriaId: 10,
      });
      mockPrismaService.scholarshipType.findUnique.mockResolvedValueOnce({
        id: 2,
        name: 'ประเภทใหม่',
        isActive: true,
        defaultCriteriaId: 20, // Different criteria
      });

      try {
        await service.update(1, { scholarshipTypeId: 2 });
        fail('Should throw');
      } catch (err: unknown) {
        const error = err as BusinessException;
        expect(error.errorCode).toBe('CRITERIA_RESET_CONFIRMATION_REQUIRED');
      }
    });

    it('should update criteriaId to defaultCriteriaId when confirmCriteriaReset is true', async () => {
      mockPrismaService.scholarshipRound.findUnique
        .mockResolvedValueOnce({
          id: 1,
          status: RoundStatus.DRAFT,
          scholarshipTypeId: 1,
          criteriaId: 10,
        })
        .mockResolvedValueOnce({
          id: 1,
          name: 'รอบ 1',
          academicYear: 2569,
          semester: 1,
          status: RoundStatus.DRAFT,
          scholarshipTypeId: 2,
          criteriaId: 20,
          criteria: { name: 'เกณฑ์ใหม่' },
          scholarshipType: { name: 'ประเภทใหม่' },
          _count: { applicants: 0 },
          importBatches: [],
          createdAt: new Date(),
          openedAt: null,
          closedAt: null,
          updatedAt: new Date(),
        });
      mockPrismaService.scholarshipType.findUnique.mockResolvedValueOnce({
        id: 2,
        name: 'ประเภทใหม่',
        isActive: true,
        defaultCriteriaId: 20,
      });
      mockPrismaService.scholarshipRound.update.mockResolvedValueOnce({
        id: 1,
      });

      await service.update(1, {
        scholarshipTypeId: 2,
        confirmCriteriaReset: true,
      });

      expect(mockPrismaService.scholarshipRound.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            scholarshipTypeId: 2,
            criteriaId: 20,
          }),
        }),
      );
    });
  });

  describe('linkCriteria', () => {
    it('should throw NotFoundException if round does not exist', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.linkCriteria(999, { criteriaId: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

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

    it('should throw NotFoundException if target criteria does not exist', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce({
        id: 1,
        status: RoundStatus.DRAFT,
      });
      mockPrismaService.criteria.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.linkCriteria(1, { criteriaId: 999 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should link criteria to DRAFT round successfully', async () => {
      mockPrismaService.scholarshipRound.findUnique
        .mockResolvedValueOnce({ id: 1, status: RoundStatus.DRAFT })
        // findOne(1) call
        .mockResolvedValueOnce({
          id: 1,
          name: 'รอบทุน',
          academicYear: 2569,
          semester: 1,
          status: RoundStatus.DRAFT,
          criteriaId: 5,
          criteria: { id: 5, name: 'เกณฑ์ใหม่', subCriteria: [] },
          _count: { applicants: 0 },
          importBatches: [],
          createdAt: new Date(),
          openedAt: null,
          closedAt: null,
          updatedAt: new Date(),
        });
      mockPrismaService.criteria.findUnique.mockResolvedValueOnce({
        id: 5,
        name: 'เกณฑ์ใหม่',
      });
      mockPrismaService.scholarshipRound.update.mockResolvedValueOnce({
        id: 1,
      });

      const result = await service.linkCriteria(1, { criteriaId: 5 });

      expect(mockPrismaService.scholarshipRound.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { criteriaId: 5 },
      });
      expect(result.criteriaId).toBe(5);
    });
  });

  describe('checkOpenReadiness', () => {
    it('should throw NotFoundException if round does not exist', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce(null);

      await expect(service.checkOpenReadiness(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return isReady=false with reasons if preconditions fail', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce({
        id: 1,
        name: 'รอบทุน',
        academicYear: 2569,
        semester: 1,
        criteria: null, // No criteria
        _count: { applicants: 0 }, // 0 applicants
        importBatches: [{ invalidRows: 3 }],
      });

      const readiness = await service.checkOpenReadiness(1);

      expect(readiness.isReady).toBe(false);
      expect(readiness.reasons.length).toBeGreaterThanOrEqual(2);
      expect(readiness.lastInvalidRowsCount).toBe(3);
    });

    it('should return isReady=true when all 3 preconditions are met', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce({
        id: 1,
        name: 'รอบทุน 2569',
        academicYear: 2569,
        semester: 1,
        criteria: {
          name: 'เกณฑ์สมบูรณ์',
          subCriteria: [
            { type: SubCriteriaType.SCORED, maxScore: 60 },
            { type: SubCriteriaType.SCORED, maxScore: 40 },
          ],
        },
        _count: { applicants: 10 },
        importBatches: [],
      });

      const readiness = await service.checkOpenReadiness(1);

      expect(readiness.isReady).toBe(true);
      expect(readiness.reasons).toEqual([]);
      expect(readiness.applicantCount).toBe(10);
      expect(readiness.criteriaName).toBe('เกณฑ์สมบูรณ์');
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
        criteria: null,
        _count: { applicants: 0 },
        importBatches: [],
      });

      try {
        await service.openRound(1);
      } catch (err: unknown) {
        const error = err as BusinessException;
        expect(error.errorCode).toBe('ROUND_OPEN_PRECHECK_FAILED');
      }
    });

    it('should open round successfully, transition to OPEN, and log audit log', async () => {
      // 1. checkOpenReadiness call
      mockPrismaService.scholarshipRound.findUnique
        .mockResolvedValueOnce({
          id: 1,
          name: 'ทุนวิจัย 2569',
          academicYear: 2569,
          semester: 1,
          criteria: {
            name: 'เกณฑ์วิจัย',
            subCriteria: [{ type: SubCriteriaType.SCORED, maxScore: 100 }],
          },
          _count: { applicants: 5 },
          importBatches: [],
        })
        // 2. Inside transaction: lookup round
        .mockResolvedValueOnce({
          id: 1,
          status: RoundStatus.DRAFT,
        })
        // 3. findOne(1) return
        .mockResolvedValueOnce({
          id: 1,
          name: 'ทุนวิจัย 2569',
          academicYear: 2569,
          semester: 1,
          status: RoundStatus.OPEN,
          criteriaId: 1,
          criteria: null,
          _count: { applicants: 5 },
          importBatches: [],
          createdAt: new Date(),
          openedAt: new Date(),
          closedAt: null,
          updatedAt: new Date(),
        });

      mockPrismaService.scholarshipRound.update.mockResolvedValueOnce({
        id: 1,
      });
      mockPrismaService.auditLog.create.mockResolvedValueOnce({ id: 1 });

      const result = await service.openRound(1, 42);

      expect(mockPrismaService.scholarshipRound.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: RoundStatus.OPEN }),
        }),
      );
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ actorId: 42, roundId: 1 }),
        }),
      );
      expect(result.status).toBe(RoundStatus.OPEN);
    });
  });

  describe('checkCloseStatus', () => {
    it('should return unsubmitted applicants list and count', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce({
        id: 1,
        applicants: [
          {
            id: 101,
            studentCode: '653040001-1',
            titlePrefix: 'นาย',
            firstName: 'สมชาย',
            lastName: 'ใจดี',
            evaluations: [{ id: 1 }], // Submitted
          },
          {
            id: 102,
            studentCode: '653040002-2',
            titlePrefix: 'นางสาว',
            firstName: 'สมหญิง',
            lastName: 'สดใส',
            evaluations: [], // Unsubmitted
          },
        ],
      });

      const check = await service.checkCloseStatus(1);

      expect(check.roundId).toBe(1);
      expect(check.unsubmittedCount).toBe(1);
      expect(check.applicants[0].studentCode).toBe('653040002-2');
    });

    it('should throw NotFoundException if round does not exist', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce(null);

      await expect(service.checkCloseStatus(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('closeRound state transition', () => {
    it('should throw INVALID_ROUND_STATUS if round is not OPEN', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce({
        id: 1,
        status: RoundStatus.DRAFT,
        applicants: [],
      });

      try {
        await service.closeRound(1, {});
      } catch (err: unknown) {
        const error = err as BusinessException;
        expect(error.errorCode).toBe('INVALID_ROUND_STATUS');
      }
    });

    it('should throw ROUND_CLOSE_ACK_REQUIRED if unsubmitted applicants exist without acknowledge (FR-RND-12)', async () => {
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
            evaluations: [],
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

    it('should throw ROUND_CLOSE_STATE_CHANGED if acknowledged count differs from current unsubmitted count', async () => {
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
            evaluations: [], // Count is 1
          },
        ],
      });

      try {
        await service.closeRound(1, {
          acknowledged: true,
          acknowledgedCount: 2,
        });
      } catch (err: unknown) {
        const error = err as BusinessException;
        expect(error.errorCode).toBe('ROUND_CLOSE_STATE_CHANGED');
      }
    });

    it('should successfully close round and record AuditLog when unsubmitted count matches', async () => {
      mockPrismaService.scholarshipRound.findUnique
        .mockResolvedValueOnce({
          id: 1,
          status: RoundStatus.OPEN,
          applicants: [
            {
              id: 10,
              studentCode: '653040001-1',
              titlePrefix: 'นาย',
              firstName: 'สมชาย',
              lastName: 'ใจดี',
              evaluations: [],
            },
          ],
        })
        // findOne(1) return
        .mockResolvedValueOnce({
          id: 1,
          name: 'ทุนทั่วไป',
          academicYear: 2569,
          semester: 1,
          status: RoundStatus.CLOSED,
          criteriaId: null,
          criteria: null,
          _count: { applicants: 1 },
          importBatches: [],
          createdAt: new Date(),
          openedAt: new Date(),
          closedAt: new Date(),
          updatedAt: new Date(),
        });

      mockPrismaService.scholarshipRound.update.mockResolvedValueOnce({
        id: 1,
      });
      mockPrismaService.auditLog.create.mockResolvedValueOnce({ id: 1 });

      const result = await service.closeRound(
        1,
        { acknowledged: true, acknowledgedCount: 1 },
        99,
      );

      expect(mockPrismaService.scholarshipRound.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: RoundStatus.CLOSED }),
        }),
      );
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ actorId: 99, roundId: 1 }),
        }),
      );
      expect(result.status).toBe(RoundStatus.CLOSED);
    });
  });

  describe('Scholarship Allocation Methods', () => {
    it('should throw NotFoundException if round not found for getAllocationSummary', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce(null);

      await expect(service.getAllocationSummary(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should calculate allocation summary and applicant ranks correctly', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce({
        id: 1,
        name: 'รอบที่ 1',
        status: RoundStatus.CLOSED,
        allocation: {
          id: 10,
          roundId: 1,
          totalBudget: 100000,
          status: 'EDITING',
          statusChangedAt: new Date(),
          allocations: [{ applicantId: 101, isAwarded: true, amount: 20000 }],
        },
        applicants: [
          {
            id: 101,
            studentCode: '663040001-2',
            titlePrefix: 'นาย',
            firstName: 'สมชาย',
            lastName: 'เรียนดี',
            faculty: 'วิศวกรรมศาสตร์',
            major: 'คอมพิวเตอร์',
            studyYear: 3,
            gpa: 3.5,
            evaluations: [{ totalScore: 85 }],
            contact: { citizenIdMasked: '1-4099-XXXXX-XX-4' },
          },
        ],
      });

      const res = await service.getAllocationSummary(1);
      expect(res.success).toBe(true);
      expect(res.data.totalBudget).toBe(100000);
      expect(res.data.allocatedAmount).toBe(20000);
      expect(res.data.remainingBudget).toBe(80000);
      expect(res.data.recipientsCount).toBe(1);
      expect(res.data.allocations[0].isAwarded).toBe(true);
      expect(res.data.allocations[0].rank).toBe(1);
    });

    it('should reject budget < 0 in setRoundBudget', async () => {
      await expect(
        service.setRoundBudget(1, { totalBudget: -500 }),
      ).rejects.toThrow(BusinessException);
    });

    it('should reject saveAllocations when allocated amount exceeds total budget', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce({
        id: 1,
        allocation: {
          id: 10,
          roundId: 1,
          totalBudget: 10000,
          status: 'EDITING',
        },
      });

      await expect(
        service.saveAllocations(1, {
          allocations: [
            { applicantId: 101, isAwarded: true, amount: 20000 }, // 20,000 > 10,000
          ],
        }),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('deleteDraftRound', () => {
    it('should throw NotFoundException if round does not exist', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce(null);

      await expect(service.deleteDraftRound(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BusinessException if round is OPEN', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce({
        id: 1,
        status: RoundStatus.OPEN,
        _count: { applicants: 5 },
      });

      await expect(service.deleteDraftRound(1)).rejects.toThrow(
        BusinessException,
      );
    });

    it('should throw BusinessException if round is CLOSED', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce({
        id: 1,
        status: RoundStatus.CLOSED,
        _count: { applicants: 5 },
      });

      await expect(service.deleteDraftRound(1)).rejects.toThrow(
        BusinessException,
      );
    });

    it('should successfully delete DRAFT round and cascade its relations', async () => {
      mockPrismaService.scholarshipRound.findUnique.mockResolvedValueOnce({
        id: 1,
        name: 'รอบทดสอบ',
        academicYear: 2569,
        semester: 1,
        status: RoundStatus.DRAFT,
        _count: { applicants: 2 },
      });
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 99,
      });

      const res = await service.deleteDraftRound(1, 99);

      expect(res.success).toBe(true);
      expect(mockPrismaService.evaluationItem.deleteMany).toHaveBeenCalledWith({
        where: { evaluation: { applicant: { roundId: 1 } } },
      });
      expect(mockPrismaService.evaluation.deleteMany).toHaveBeenCalledWith({
        where: { applicant: { roundId: 1 } },
      });
      expect(
        mockPrismaService.applicantContact.deleteMany,
      ).toHaveBeenCalledWith({
        where: { applicant: { roundId: 1 } },
      });
      expect(
        mockPrismaService.applicantSupportingInfo.deleteMany,
      ).toHaveBeenCalledWith({
        where: { applicant: { roundId: 1 } },
      });
      expect(mockPrismaService.applicant.deleteMany).toHaveBeenCalledWith({
        where: { roundId: 1 },
      });
      expect(mockPrismaService.importBatch.deleteMany).toHaveBeenCalledWith({
        where: { roundId: 1 },
      });
      expect(mockPrismaService.scholarshipRound.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actorId: 99,
            action: 'ROUND_STATUS_CHANGE',
            detail: expect.objectContaining({ action: 'DELETE_DRAFT_ROUND' }),
          }),
        }),
      );
    });
  });
});
