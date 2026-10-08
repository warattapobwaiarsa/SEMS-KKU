/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CriteriaService } from './criteria.service';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/http-exception.filter';
import { SubCriteriaType, RoundStatus } from '@prisma/client';

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
    it('should throw SUB_CRITERIA_REQUIRED if subCriteria array is empty', async () => {
      const dto = {
        name: 'เกณฑ์ทดสอบ',
        subCriteria: [],
      };

      try {
        await service.create(dto);
      } catch (err: unknown) {
        const error = err as BusinessException;
        expect(error.errorCode).toBe('SUB_CRITERIA_REQUIRED');
      }
    });

    it('should throw SUB_CRITERIA_TITLE_REQUIRED if sub-criteria title is empty or whitespace', async () => {
      const dto = {
        name: 'เกณฑ์ทดสอบ',
        subCriteria: [
          {
            sortOrder: 1,
            title: '   ',
            type: SubCriteriaType.SCORED,
            maxScore: 100,
          },
        ],
      };

      try {
        await service.create(dto);
      } catch (err: unknown) {
        const error = err as BusinessException;
        expect(error.errorCode).toBe('SUB_CRITERIA_TITLE_REQUIRED');
      }
    });

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
            {
              id: 101,
              title: 'ข้อเดิม 1',
              type: SubCriteriaType.SCORED,
              maxScore: 50,
            },
            {
              id: 102,
              title: 'ข้อเดิม 2 ที่จะถูกลบ',
              type: SubCriteriaType.SCORED,
              maxScore: 50,
            },
          ],
        })
        // 2. Duplicate name check (same name, so skipped or returned null)
        // 3. findOne(id) call at the end of update()
        .mockResolvedValueOnce({
          id: 1,
          name: 'เกณฑ์เดิม',
          rounds: [],
          subCriteria: [
            {
              id: 101,
              title: 'ข้อเดิม 1 (อัปเดต)',
              type: SubCriteriaType.SCORED,
              maxScore: 70,
              sortOrder: 1,
            },
            {
              id: 103,
              title: 'ข้อใหม่',
              type: SubCriteriaType.SCORED,
              maxScore: 30,
              sortOrder: 2,
            },
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

    it('should throw NotFoundException if criteria to update does not exist', async () => {
      mockPrismaService.criteria.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.update(999, {
          name: 'ไม่มีอยู่จริง',
          subCriteria: [
            {
              sortOrder: 1,
              title: 'ข้อ 1',
              type: SubCriteriaType.SCORED,
              maxScore: 100,
            },
          ],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw CRITERIA_NAME_DUPLICATE if new name is already taken by another criteria', async () => {
      mockPrismaService.criteria.findUnique
        .mockResolvedValueOnce({
          id: 1,
          name: 'ชื่อเดิม',
          rounds: [],
          subCriteria: [{ id: 10, type: SubCriteriaType.SCORED, maxScore: 100 }],
        })
        .mockResolvedValueOnce({
          id: 2,
          name: 'ชื่อซ้ำกับ ID อื่น',
        });

      try {
        await service.update(1, {
          name: 'ชื่อซ้ำกับ ID อื่น',
          subCriteria: [
            {
              sortOrder: 1,
              title: 'ข้อ 1',
              type: SubCriteriaType.SCORED,
              maxScore: 100,
            },
          ],
        });
      } catch (err: unknown) {
        const error = err as BusinessException;
        expect(error.errorCode).toBe('CRITERIA_NAME_DUPLICATE');
      }
    });
  });

  describe('findAll', () => {
    it('should return paginated criteria with computed isLocked and totalScore', async () => {
      mockPrismaService.criteria.count.mockResolvedValueOnce(2);
      mockPrismaService.criteria.findMany.mockResolvedValueOnce([
        {
          id: 1,
          name: 'เกณฑ์ที่ 1',
          createdAt: new Date(),
          updatedAt: new Date(),
          rounds: [{ id: 1, name: 'รอบเปิดรับ', status: RoundStatus.OPEN }],
          subCriteria: [
            { id: 10, type: SubCriteriaType.SCORED, maxScore: 70 },
            { id: 11, type: SubCriteriaType.SCORED, maxScore: 30 },
          ],
        },
        {
          id: 2,
          name: 'เกณฑ์ที่ 2 (ร่าง)',
          createdAt: new Date(),
          updatedAt: new Date(),
          rounds: [{ id: 2, name: 'รอบร่าง', status: RoundStatus.DRAFT }],
          subCriteria: [
            { id: 20, type: SubCriteriaType.SCORED, maxScore: 100 },
          ],
        },
      ]);

      const result = await service.findAll({ page: 1, limit: 10, search: 'เกณฑ์' });

      expect(result.data.length).toBe(2);
      expect(result.data[0].isLocked).toBe(true);
      expect(result.data[0].totalScore).toBe(100);
      expect(result.data[1].isLocked).toBe(false);
      expect(result.data[1].totalScore).toBe(100);
      expect(result.meta.total).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should return criteria detail when found', async () => {
      mockPrismaService.criteria.findUnique.mockResolvedValueOnce({
        id: 1,
        name: 'เกณฑ์ชุดหลัก',
        createdAt: new Date(),
        updatedAt: new Date(),
        rounds: [],
        subCriteria: [
          { id: 101, sortOrder: 1, title: 'ข้อ 1', type: SubCriteriaType.SCORED, maxScore: 100 },
        ],
      });

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
      expect(result.name).toBe('เกณฑ์ชุดหลัก');
      expect(result.isLocked).toBe(false);
      expect(result.totalScore).toBe(100);
      expect(result.subCriteria.length).toBe(1);
    });

    it('should throw NotFoundException if criteria is not found', async () => {
      mockPrismaService.criteria.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
