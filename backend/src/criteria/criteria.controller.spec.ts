import { Test, TestingModule } from '@nestjs/testing';
import { CriteriaController } from './criteria.controller';
import { CriteriaService } from './criteria.service';
import { SubCriteriaType } from '@prisma/client';

describe('CriteriaController', () => {
  let controller: CriteriaController;

  const mockCriteriaService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CriteriaController],
      providers: [
        {
          provide: CriteriaService,
          useValue: mockCriteriaService,
        },
      ],
    }).compile();

    controller = module.get<CriteriaController>(CriteriaController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should call criteriaService.findAll with query parameters', async () => {
      const mockResult = {
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
      };
      mockCriteriaService.findAll.mockResolvedValueOnce(mockResult);

      const result = await controller.findAll(1, 10, 'เรียนดี');

      expect(mockCriteriaService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'เรียนดี',
      });
      expect(result).toBe(mockResult);
    });
  });

  describe('findOne', () => {
    it('should call criteriaService.findOne with id and role from header/query', async () => {
      const mockCriteria = { id: 1, name: 'เกณฑ์ชุดหลัก' };
      mockCriteriaService.findOne.mockResolvedValueOnce(mockCriteria);

      const result = await controller.findOne(1, 'ADMIN', undefined);

      expect(mockCriteriaService.findOne).toHaveBeenCalledWith(1, 'ADMIN');
      expect(result).toBe(mockCriteria);
    });
  });

  describe('create', () => {
    it('should call criteriaService.create with dto', async () => {
      const dto = {
        name: 'เกณฑ์ใหม่',
        subCriteria: [
          {
            sortOrder: 1,
            title: 'ผลการเรียน',
            type: SubCriteriaType.SCORED,
            maxScore: 100,
          },
        ],
      };
      const mockCreated = { id: 1, ...dto, totalScore: 100, isLocked: false };
      mockCriteriaService.create.mockResolvedValueOnce(mockCreated);

      const result = await controller.create(dto);

      expect(mockCriteriaService.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(mockCreated);
    });
  });

  describe('update', () => {
    it('should call criteriaService.update with id and dto', async () => {
      const dto = {
        name: 'เกณฑ์แก้ไข',
        subCriteria: [
          {
            sortOrder: 1,
            title: 'ผลการเรียน',
            type: SubCriteriaType.SCORED,
            maxScore: 100,
          },
        ],
      };
      const mockUpdated = { id: 1, ...dto, totalScore: 100, isLocked: false };
      mockCriteriaService.update.mockResolvedValueOnce(mockUpdated);

      const result = await controller.update(1, dto);

      expect(mockCriteriaService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(mockUpdated);
    });
  });
});
