/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { CriteriaService } from './criteria.service';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/http-exception.filter';
import { SubCriteriaType } from '@prisma/client';

describe('CriteriaService', () => {
  let service: CriteriaService;

  const mockPrismaService = {
    criteria: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    subCriteria: {
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((cb: (tx: any) => any) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CriteriaService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CriteriaService>(CriteriaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw SCORED_CRITERIA_REQUIRED if no scored sub-criteria (BR-CRT-04)', async () => {
      const dto = {
        name: 'เกณฑ์ทดสอบ',
        subCriteria: [
          {
            sortOrder: 1,
            title: 'ข้อคิดเห็นเพิ่มเติม',
            type: SubCriteriaType.TEXT,
          },
        ],
      };

      await expect(service.create(dto)).rejects.toThrow(BusinessException);
      try {
        await service.create(dto);
      } catch (err: unknown) {
        const error = err as BusinessException;
        expect(error.errorCode).toBe('SCORED_CRITERIA_REQUIRED');
      }
    });

    it('should throw MAX_SCORE_OUT_OF_RANGE if maxScore is out of 1-100 (BR-CRT-05)', async () => {
      const dto = {
        name: 'เกณฑ์ทดสอบ',
        subCriteria: [
          {
            sortOrder: 1,
            title: 'ผลการเรียน',
            type: SubCriteriaType.SCORED,
            maxScore: 105,
          },
        ],
      };

      try {
        await service.create(dto);
      } catch (err: unknown) {
        const error = err as BusinessException;
        expect(error.errorCode).toBe('MAX_SCORE_OUT_OF_RANGE');
      }
    });

    it('should throw CRITERIA_SUM_NOT_100 if sum of scored items != 100 (BR-CRT-06)', async () => {
      const dto = {
        name: 'เกณฑ์ทดสอบ',
        subCriteria: [
          {
            sortOrder: 1,
            title: 'ผลการเรียน',
            type: SubCriteriaType.SCORED,
            maxScore: 60,
          },
          {
            sortOrder: 2,
            title: 'ความประพฤติ',
            type: SubCriteriaType.SCORED,
            maxScore: 30, // Total = 90
          },
        ],
      };

      try {
        await service.create(dto);
      } catch (err: unknown) {
        const error = err as BusinessException;
        expect(error.errorCode).toBe('CRITERIA_SUM_NOT_100');
        expect(error.params).toEqual({ sum: 90 });
      }
    });

    it('should throw CRITERIA_NAME_DUPLICATE if name already exists (BR-CRT-01)', async () => {
      mockPrismaService.criteria.findUnique.mockResolvedValueOnce({
        id: 1,
        name: 'เกณฑ์ทุนซ้ำ',
      });

      const dto = {
        name: 'เกณฑ์ทุนซ้ำ',
        subCriteria: [
          {
            sortOrder: 1,
            title: 'ผลการเรียน',
            type: SubCriteriaType.SCORED,
            maxScore: 100,
          },
        ],
      };

      try {
        await service.create(dto);
      } catch (err: unknown) {
        const error = err as BusinessException;
        expect(error.errorCode).toBe('CRITERIA_NAME_DUPLICATE');
      }
    });

    it('should successfully create criteria when sum is exactly 100', async () => {
      mockPrismaService.criteria.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.criteria.create.mockResolvedValueOnce({
        id: 10,
        name: 'เกณฑ์ทุนเรียนดี 2569',
        createdAt: new Date(),
        updatedAt: new Date(),
        subCriteria: [
          {
            id: 101,
            criteriaId: 10,
            sortOrder: 1,
            title: 'ผลการเรียน',
            type: SubCriteriaType.SCORED,
            maxScore: 60,
            allowComment: false,
          },
          {
            id: 102,
            criteriaId: 10,
            sortOrder: 2,
            title: 'กิจกรรมบำเพ็ประโยชน์',
            type: SubCriteriaType.SCORED,
            maxScore: 40,
            allowComment: true,
          },
        ],
      });

      const result = await service.create({
        name: 'เกณฑ์ทุนเรียนดี 2569',
        subCriteria: [
          {
            sortOrder: 1,
            title: 'ผลการเรียน',
            type: SubCriteriaType.SCORED,
            maxScore: 60,
          },
          {
            sortOrder: 2,
            title: 'กิจกรรมบำเพ็ประโยชน์',
            type: SubCriteriaType.SCORED,
            maxScore: 40,
            allowComment: true,
          },
        ],
      });

      expect(result.id).toBe(10);
      expect(result.totalScore).toBe(100);
      expect(result.isLocked).toBe(false);
      expect(result.subCriteria.length).toBe(2);
    });
  });

  describe('update', () => {
    it('should throw CRITERIA_LOCKED if criteria is used in OPEN or CLOSED round (BR-CRT-09)', async () => {
      mockPrismaService.criteria.findUnique.mockResolvedValueOnce({
        id: 1,
        name: 'เกณฑ์ที่ถูกล็อก',
        rounds: [{ status: 'OPEN' }],
        subCriteria: [{ id: 10, type: SubCriteriaType.SCORED, maxScore: 100 }],
      });

      try {
        await service.update(1, {
          name: 'เกณฑ์แก้ไข',
          subCriteria: [
            {
              sortOrder: 1,
              title: 'ผลการเรียน',
              type: SubCriteriaType.SCORED,
              maxScore: 100,
            },
          ],
        });
      } catch (err: unknown) {
        const error = err as BusinessException;
        expect(error.errorCode).toBe('CRITERIA_LOCKED');
      }
    });

    it('should reconcile sub-criteria on successful update', async () => {
      mockPrismaService.criteria.findUnique
        // 1. Initial lookup in update()
        .mockResolvedValueOnce({
          id: 1,
          name: 'เกณฑ์เดิม',
          rounds: [],
          subCriteria: [
            { id: 101, title: 'ข้อเดิม 1', type: SubCriteriaType.SCORED, maxScore: 50 },
            { id: 102, title: 'ข้อเดิม 2 ที่จะถูกลบ', type: SubCriteriaType.SCORED, maxScore: 50 },
          ],
        })
        // 2. Duplicate name check (same name, so skipped or returned null)
        // 3. findOne(id) call at the end of update()
        .mockResolvedValueOnce({
          id: 1,
          name: 'เกณฑ์เดิม',
          rounds: [],
          subCriteria: [
            { id: 101, title: 'ข้อเดิม 1 (อัปเดต)', type: SubCriteriaType.SCORED, maxScore: 70, sortOrder: 1 },
            { id: 103, title: 'ข้อใหม่', type: SubCriteriaType.SCORED, maxScore: 30, sortOrder: 2 },
          ],
        });

      const result = await service.update(1, {
        name: 'เกณฑ์เดิม',
        subCriteria: [
          {
            id: 101,
            sortOrder: 1,
            title: 'ข้อเดิม 1 (อัปเดต)',
            type: SubCriteriaType.SCORED,
            maxScore: 70,
          },
          {
            sortOrder: 2,
            title: 'ข้อใหม่',
            type: SubCriteriaType.SCORED,
            maxScore: 30,
          },
        ],
      });

      expect(mockPrismaService.subCriteria.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [102] }, criteriaId: 1 },
      });
      expect(mockPrismaService.subCriteria.update).toHaveBeenCalled();
      expect(mockPrismaService.subCriteria.create).toHaveBeenCalled();
      expect(result.totalScore).toBe(100);
    });
  });
});
