/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ScholarshipTypesService } from './scholarship-types.service';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/http-exception.filter';
import { AuditAction } from '@prisma/client';

describe('ScholarshipTypesService', () => {
  let service: ScholarshipTypesService;

  const mockPrismaService = {
    scholarshipType: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    scholarshipRound: {
      updateMany: jest.fn(),
    },
    criteria: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((cb: (tx: any) => any) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScholarshipTypesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ScholarshipTypesService>(ScholarshipTypesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated scholarship types', async () => {
      mockPrismaService.scholarshipType.count.mockResolvedValue(1);
      mockPrismaService.scholarshipType.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'ทุนขาดแคลนทุนทรัพย์',
          description: 'สำหรับนักศึกษาขาดแคลน',
          defaultCriteriaId: 10,
          defaultCriteria: { id: 10, name: 'เกณฑ์ทุนขาดแคลน' },
          isActive: true,
          _count: { rounds: 2 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('ทุนขาดแคลนทุนทรัพย์');
      expect(result.data[0].roundsCount).toBe(2);
      expect(result.meta.total).toBe(1);
    });

    it('should filter active only when activeOnly is true', async () => {
      mockPrismaService.scholarshipType.count.mockResolvedValue(0);
      mockPrismaService.scholarshipType.findMany.mockResolvedValue([]);

      await service.findAll({ activeOnly: true });
      expect(mockPrismaService.scholarshipType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return the scholarship type if found', async () => {
      mockPrismaService.scholarshipType.findUnique.mockResolvedValue({
        id: 1,
        name: 'ทุนเรียนดี',
        description: 'GPA > 3.50',
        defaultCriteriaId: null,
        defaultCriteria: null,
        isActive: true,
        _count: { rounds: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.findOne(1);
      expect(result.id).toBe(1);
      expect(result.name).toBe('ทุนเรียนดี');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.scholarshipType.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a scholarship type and log audit', async () => {
      mockPrismaService.scholarshipType.findFirst.mockResolvedValue(null);
      mockPrismaService.criteria.findUnique.mockResolvedValue({
        id: 5,
        name: 'เกณฑ์ 5',
      });
      mockPrismaService.scholarshipType.create.mockResolvedValue({
        id: 1,
        name: 'ทุนกิจกรรมเด่น',
        description: 'สำหรับผู้นำกิจกรรม',
        defaultCriteriaId: 5,
        isActive: true,
      });

      const result = await service.create(
        {
          name: 'ทุนกิจกรรมเด่น',
          description: 'สำหรับผู้นำกิจกรรม',
          defaultCriteriaId: 5,
        },
        101,
      );

      expect(result.name).toBe('ทุนกิจกรรมเด่น');
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuditAction.SCHOLARSHIP_TYPE_CREATE,
          actorId: 101,
          entityType: 'ScholarshipType',
        }),
      });
    });

    it('should throw SCHOLARSHIP_TYPE_NAME_EXISTS if duplicate name', async () => {
      mockPrismaService.scholarshipType.findFirst.mockResolvedValue({
        id: 1,
        name: 'ทุนซ้ำ',
      });

      try {
        await service.create({ name: 'ทุนซ้ำ' });
        fail('Should throw');
      } catch (err: unknown) {
        const error = err as BusinessException;
        expect(error.errorCode).toBe('SCHOLARSHIP_TYPE_NAME_EXISTS');
      }
    });

    it('should throw NotFoundException if defaultCriteriaId does not exist', async () => {
      mockPrismaService.scholarshipType.findFirst.mockResolvedValue(null);
      mockPrismaService.criteria.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ name: 'ทุนใหม่', defaultCriteriaId: 999 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update scholarship type and log audit', async () => {
      mockPrismaService.scholarshipType.findUnique.mockResolvedValue({
        id: 1,
        name: 'ชื่อเดิม',
        description: 'คำอธิบายเดิม',
        defaultCriteriaId: null,
        isActive: true,
      });
      mockPrismaService.scholarshipType.findFirst.mockResolvedValue(null);
      mockPrismaService.scholarshipType.update.mockResolvedValue({
        id: 1,
        name: 'ชื่อใหม่',
        description: 'คำอธิบายใหม่',
        defaultCriteriaId: null,
        isActive: true,
      });

      const result = await service.update(
        1,
        { name: 'ชื่อใหม่', description: 'คำอธิบายใหม่' },
        101,
      );

      expect(result.name).toBe('ชื่อใหม่');
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuditAction.SCHOLARSHIP_TYPE_UPDATE,
          actorId: 101,
          entityType: 'ScholarshipType',
        }),
      });
    });

    it('should throw SCHOLARSHIP_TYPE_NAME_EXISTS if updated name belongs to another type', async () => {
      mockPrismaService.scholarshipType.findUnique.mockResolvedValue({
        id: 1,
        name: 'ชื่อเดิม',
      });
      mockPrismaService.scholarshipType.findFirst.mockResolvedValue({
        id: 2,
        name: 'ชื่อใหม่ที่คนอื่นใช้แล้ว',
      });

      try {
        await service.update(1, { name: 'ชื่อใหม่ที่คนอื่นใช้แล้ว' });
        fail('Should throw');
      } catch (err: unknown) {
        const error = err as BusinessException;
        expect(error.errorCode).toBe('SCHOLARSHIP_TYPE_NAME_EXISTS');
      }
    });
  });

  describe('toggleActive', () => {
    it('should deactivate scholarship type and log SCHOLARSHIP_TYPE_DEACTIVATE', async () => {
      mockPrismaService.scholarshipType.findUnique.mockResolvedValue({
        id: 1,
        isActive: true,
      });
      mockPrismaService.scholarshipType.update.mockResolvedValue({
        id: 1,
        isActive: false,
      });

      const result = await service.toggleActive(1, false, 101);
      expect(result.isActive).toBe(false);
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuditAction.SCHOLARSHIP_TYPE_DEACTIVATE,
          actorId: 101,
        }),
      });
    });

    it('should activate scholarship type and log SCHOLARSHIP_TYPE_ACTIVATE', async () => {
      mockPrismaService.scholarshipType.findUnique.mockResolvedValue({
        id: 1,
        isActive: false,
      });
      mockPrismaService.scholarshipType.update.mockResolvedValue({
        id: 1,
        isActive: true,
      });

      const result = await service.toggleActive(1, true, 101);
      expect(result.isActive).toBe(true);
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuditAction.SCHOLARSHIP_TYPE_ACTIVATE,
          actorId: 101,
        }),
      });
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if scholarship type not found', async () => {
      mockPrismaService.scholarshipType.findUnique.mockResolvedValue(null);
      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BusinessException if scholarship type is linked to open/closed rounds', async () => {
      mockPrismaService.scholarshipType.findUnique.mockResolvedValue({
        id: 1,
        name: 'ทุนเรียนดี',
        rounds: [{ id: 10, name: 'รอบที่ 1', status: 'OPEN' }],
      });

      await expect(service.delete(1)).rejects.toThrow(BusinessException);
    });

    it('should successfully delete scholarship type if it only has draft rounds or no rounds', async () => {
      mockPrismaService.scholarshipType.findUnique.mockResolvedValue({
        id: 1,
        name: 'ทุนเรียนดี',
        rounds: [],
      });
      mockPrismaService.scholarshipRound.updateMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.scholarshipType.delete.mockResolvedValue({
        id: 1,
        name: 'ทุนเรียนดี',
      });

      const res = await service.delete(1);
      expect(res.id).toBe(1);
      expect(
        mockPrismaService.scholarshipRound.updateMany,
      ).toHaveBeenCalledWith({
        where: { scholarshipTypeId: 1 },
        data: { scholarshipTypeId: null },
      });
      expect(mockPrismaService.scholarshipType.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
