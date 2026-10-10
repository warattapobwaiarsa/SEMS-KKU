import { Test, TestingModule } from '@nestjs/testing';
import { RoundsController } from './rounds.controller';
import { RoundsService } from './rounds.service';
import { RoundStatus } from '@prisma/client';
import { RoleDispatchGuard } from '../common/guards/role-dispatch.guard';
import { EvaluationReadService } from '../evaluation/evaluation-read.service';
import { RequestWithResolvedRole } from '../common/guards/role-dispatch.guard';

describe('RoundsController', () => {
  let controller: RoundsController;

  const mockRoundsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    linkCriteria: jest.fn(),
    checkOpenReadiness: jest.fn(),
    openRound: jest.fn(),
    checkCloseStatus: jest.fn(),
    closeRound: jest.fn(),
  };

  const mockEvaluationReadService = {
    getRoundForEvaluator: jest.fn(),
  };

  // Mock guard that always returns true
  const mockRoleDispatchGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoundsController],
      providers: [
        {
          provide: RoundsService,
          useValue: mockRoundsService,
        },
        {
          provide: EvaluationReadService,
          useValue: mockEvaluationReadService,
        },
      ],
    })
      .overrideGuard(RoleDispatchGuard)
      .useValue(mockRoleDispatchGuard)
      .compile();

    controller = module.get<RoundsController>(RoundsController);
    jest.clearAllMocks();
  });

  // Helper to create mock request with resolvedRole
  const mockRequest = (
    role: 'ADMIN' | 'EVALUATOR',
  ): RequestWithResolvedRole => ({
    resolvedRole: role,
    headers: {},
    query: {},
  });

  describe('findAll', () => {
    it('should delegate to roundsService.findAll with query parameters', async () => {
      const mockResult = {
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
      };
      mockRoundsService.findAll.mockResolvedValueOnce(mockResult);

      const result = await controller.findAll(
        1,
        10,
        'ทุน',
        2569,
        1,
        RoundStatus.DRAFT,
        'ADMIN',
        undefined,
      );

      expect(mockRoundsService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'ทุน',
        academicYear: 2569,
        semester: 1,
        status: RoundStatus.DRAFT,
        userRole: 'ADMIN',
      });
      expect(result).toBe(mockResult);
    });
  });

  describe('create', () => {
    it('should delegate to roundsService.create with dto', async () => {
      const dto = { name: 'ทุนใหม่', academicYear: 2569, semester: 1 };
      const mockCreated = {
        id: 1,
        ...dto,
        status: RoundStatus.DRAFT,
        applicantCount: 0,
      };
      mockRoundsService.create.mockResolvedValueOnce(mockCreated);

      const result = await controller.create(dto);

      expect(mockRoundsService.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(mockCreated);
    });
  });

  describe('findOne', () => {
    it('should delegate to roundsService.findOne with id and role for ADMIN', async () => {
      const mockRound = { id: 1, name: 'ทุนใหม่' };
      mockRoundsService.findOne.mockResolvedValueOnce(mockRound);

      const result = await controller.findOne(
        1,
        'EVALUATOR',
        undefined,
        mockRequest('ADMIN'),
      );

      expect(mockRoundsService.findOne).toHaveBeenCalledWith(1, 'EVALUATOR');
      expect(result).toBe(mockRound);
    });

    it('should delegate to evaluationReadService.getRoundForEvaluator for EVALUATOR', async () => {
      const mockEvaluatorRound = {
        id: 1,
        name: 'ทุนใหม่',
        status: RoundStatus.OPEN,
      };
      mockEvaluationReadService.getRoundForEvaluator.mockResolvedValueOnce(
        mockEvaluatorRound,
      );

      const result = await controller.findOne(
        1,
        'EVALUATOR',
        undefined,
        mockRequest('EVALUATOR'),
      );

      expect(
        mockEvaluationReadService.getRoundForEvaluator,
      ).toHaveBeenCalledWith(1);
      expect(result).toBe(mockEvaluatorRound);
    });
  });

  describe('update', () => {
    it('should delegate to roundsService.update with id and dto', async () => {
      const dto = { name: 'ทุนอัปเดต' };
      const mockUpdated = { id: 1, name: 'ทุนอัปเดต' };
      mockRoundsService.update.mockResolvedValueOnce(mockUpdated);

      const result = await controller.update(1, dto);

      expect(mockRoundsService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(mockUpdated);
    });
  });

  describe('linkCriteria', () => {
    it('should delegate to roundsService.linkCriteria with id and dto', async () => {
      const dto = { criteriaId: 5 };
      const mockResult = { id: 1, criteriaId: 5 };
      mockRoundsService.linkCriteria.mockResolvedValueOnce(mockResult);

      const result = await controller.linkCriteria(1, dto);

      expect(mockRoundsService.linkCriteria).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(mockResult);
    });
  });

  describe('checkOpenReadiness', () => {
    it('should delegate to roundsService.checkOpenReadiness', async () => {
      const mockCheck = { isReady: true, reasons: [] };
      mockRoundsService.checkOpenReadiness.mockResolvedValueOnce(mockCheck);

      const result = await controller.checkOpenReadiness(1);

      expect(mockRoundsService.checkOpenReadiness).toHaveBeenCalledWith(1);
      expect(result).toBe(mockCheck);
    });
  });

  describe('openRound', () => {
    it('should delegate to roundsService.openRound', async () => {
      const mockRound = { id: 1, status: RoundStatus.OPEN };
      mockRoundsService.openRound.mockResolvedValueOnce(mockRound);

      const result = await controller.openRound(1);

      expect(mockRoundsService.openRound).toHaveBeenCalledWith(1);
      expect(result).toBe(mockRound);
    });
  });

  describe('checkCloseStatus', () => {
    it('should delegate to roundsService.checkCloseStatus', async () => {
      const mockCheck = { roundId: 1, unsubmittedCount: 0, applicants: [] };
      mockRoundsService.checkCloseStatus.mockResolvedValueOnce(mockCheck);

      const result = await controller.checkCloseStatus(1);

      expect(mockRoundsService.checkCloseStatus).toHaveBeenCalledWith(1);
      expect(result).toBe(mockCheck);
    });
  });

  describe('closeRound', () => {
    it('should delegate to roundsService.closeRound with id and dto', async () => {
      const dto = { acknowledged: true, acknowledgedCount: 0 };
      const mockClosed = { id: 1, status: RoundStatus.CLOSED };
      mockRoundsService.closeRound.mockResolvedValueOnce(mockClosed);

      const result = await controller.closeRound(1, dto);

      expect(mockRoundsService.closeRound).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(mockClosed);
    });
  });
});
