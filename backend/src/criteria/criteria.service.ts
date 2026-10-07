import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCriteriaDto } from './dto/create-criteria.dto';
import { UpdateCriteriaDto } from './dto/update-criteria.dto';
import { BusinessException } from '../common/http-exception.filter';
import {
  SubCriteriaType,
  RoundStatus,
  AuditAction,
  Prisma,
} from '@prisma/client';

@Injectable()
export class CriteriaService {
  constructor(private readonly prisma: PrismaService) {}

  private validateCriteriaRules(
    subCriteria: {
      type: SubCriteriaType;
      maxScore?: number;
    }[],
  ) {
    const scoredItems = subCriteria.filter(
      (item) => item.type === SubCriteriaType.SCORED,
    );

    // BR-CRT-04 (FR-CRT-06): Must have at least 1 SCORED item
    if (scoredItems.length === 0) {
      throw new BusinessException({
        errorCode: 'SCORED_CRITERIA_REQUIRED',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'เกณฑ์ต้องมีข้อแบบ Scored อย่างน้อย 1 ข้อ',
      });
    }

    // BR-CRT-05 (FR-CRT-04): Max score must be 1-100
    for (const item of scoredItems) {
      if (
        item.maxScore === undefined ||
        item.maxScore === null ||
        item.maxScore < 1 ||
        item.maxScore > 100
      ) {
        throw new BusinessException({
          errorCode: 'MAX_SCORE_OUT_OF_RANGE',
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message: 'คะแนนเต็มเกณฑ์ย่อยต้องเป็น 1–100',
        });
      }
    }

    // BR-CRT-06 (FR-CRT-05): Sum of SCORED items must equal exactly 100
    const sum = scoredItems.reduce(
      (acc, curr) => acc + (curr.maxScore || 0),
      0,
    );
    if (sum !== 100) {
      throw new BusinessException({
        errorCode: 'CRITERIA_SUM_NOT_100',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: `ผลรวมคะแนน Scored ไม่เท่ากับ 100 (ปัจจุบัน: ${sum})`,
        params: { sum },
      });
    }
  }

  async findAll(query?: { page?: number; limit?: number; search?: string }) {
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CriteriaWhereInput = {};
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        {
          subCriteria: {
            some: { title: { contains: query.search, mode: 'insensitive' } },
          },
        },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.criteria.count({ where }),
      this.prisma.criteria.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          subCriteria: {
            orderBy: { sortOrder: 'asc' },
          },
          rounds: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      }),
    ]);

    const formattedData = items.map((criteria) => {
      const isLocked = criteria.rounds.some(
        (r) => r.status === RoundStatus.OPEN || r.status === RoundStatus.CLOSED,
      );
      const totalScore = criteria.subCriteria
        .filter((s) => s.type === SubCriteriaType.SCORED)
        .reduce((sum, s) => sum + (s.maxScore || 0), 0);

      return {
        id: criteria.id,
        name: criteria.name,
        isLocked,
        totalScore,
        usedByRounds: criteria.rounds,
        subCriteria: criteria.subCriteria,
        createdAt: criteria.createdAt,
        updatedAt: criteria.updatedAt,
      };
    });

    return {
      data: formattedData,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: number, userRole?: string) {
    const criteria = await this.prisma.criteria.findUnique({
      where: { id },
      include: {
        subCriteria: {
          orderBy: { sortOrder: 'asc' },
        },
        rounds: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!criteria) {
      throw new NotFoundException({
        errorCode: 'NOT_FOUND',
        message: `ไม่พบเกณฑ์การประเมินรหัส ${id}`,
      });
    }

    // BR-CRT-10: Evaluator can only view if linked to at least one OPEN round
    const isOpenInAnyRound = criteria.rounds.some(
      (r) => r.status === RoundStatus.OPEN,
    );
    if (userRole === 'EVALUATOR' && !isOpenInAnyRound) {
      throw new NotFoundException({
        errorCode: 'NOT_FOUND',
        message: 'ไม่พบเกณฑ์ที่เปิดให้ประเมิน',
      });
    }

    const isLocked = criteria.rounds.some(
      (r) => r.status === RoundStatus.OPEN || r.status === RoundStatus.CLOSED,
    );
    const totalScore = criteria.subCriteria
      .filter((s) => s.type === SubCriteriaType.SCORED)
      .reduce((sum, s) => sum + (s.maxScore || 0), 0);

    return {
      id: criteria.id,
      name: criteria.name,
      isLocked,
      totalScore,
      usedByRounds: criteria.rounds,
      subCriteria: criteria.subCriteria,
      createdAt: criteria.createdAt,
      updatedAt: criteria.updatedAt,
    };
  }

  async create(dto: CreateCriteriaDto) {
    // 1. Validate rules (BR-CRT-04, 05, 06)
    this.validateCriteriaRules(dto.subCriteria);

    // 2. Check duplicate name (BR-CRT-01)
    const existing = await this.prisma.criteria.findUnique({
      where: { name: dto.name.trim() },
    });
    if (existing) {
      throw new BusinessException({
        errorCode: 'CRITERIA_NAME_DUPLICATE',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'ชื่อเกณฑ์การประเมินซ้ำ กรุณาระบุชื่ออื่น',
      });
    }

    // 3. Create Criteria with SubCriteria in a transaction
    const created = await this.prisma.$transaction(async (tx) => {
      const item = await tx.criteria.create({
        data: {
          name: dto.name.trim(),
          subCriteria: {
            create: dto.subCriteria.map((sub) => ({
              sortOrder: sub.sortOrder,
              title: sub.title.trim(),
              type: sub.type,
              maxScore:
                sub.type === SubCriteriaType.SCORED ? sub.maxScore : null,
              allowComment:
                sub.type === SubCriteriaType.SCORED
                  ? (sub.allowComment ?? false)
                  : false,
            })),
          },
        },
        include: {
          subCriteria: {
            orderBy: { sortOrder: 'asc' },
          },
          rounds: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: null,
          action: AuditAction.CRITERIA_CREATE,
          entityType: 'Criteria',
          entityId: String(item.id),
          newValue: {
            name: item.name,
            subCriteriaCount: item.subCriteria.length,
          },
        },
      });

      return item;
    });

    const totalScore = created.subCriteria
      .filter((s) => s.type === SubCriteriaType.SCORED)
      .reduce((sum, s) => sum + (s.maxScore || 0), 0);

    return {
      id: created.id,
      name: created.name,
      isLocked: false,
      totalScore,
      usedByRounds: [],
      subCriteria: created.subCriteria,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async update(id: number, dto: UpdateCriteriaDto) {
    // 1. Check if criteria exists and check locked status (BR-CRT-09)
    const existing = await this.prisma.criteria.findUnique({
      where: { id },
      include: {
        rounds: {
          select: { status: true },
        },
        subCriteria: true,
      },
    });

    if (!existing) {
      throw new NotFoundException({
        errorCode: 'NOT_FOUND',
        message: `ไม่พบเกณฑ์การประเมินรหัส ${id}`,
      });
    }

    const isLocked = existing.rounds.some(
      (r) => r.status === RoundStatus.OPEN || r.status === RoundStatus.CLOSED,
    );
    if (isLocked) {
      throw new BusinessException({
        errorCode: 'CRITERIA_LOCKED',
        statusCode: HttpStatus.CONFLICT,
        message: 'เกณฑ์ถูกใช้ในรอบ Open/Closed แล้ว ห้ามแก้ไข',
      });
    }

    // 2. Validate rules
    this.validateCriteriaRules(dto.subCriteria);

    // 3. Check duplicate name if changed
    if (dto.name.trim() !== existing.name) {
      const duplicate = await this.prisma.criteria.findUnique({
        where: { name: dto.name.trim() },
      });
      if (duplicate && duplicate.id !== id) {
        throw new BusinessException({
          errorCode: 'CRITERIA_NAME_DUPLICATE',
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message: 'ชื่อเกณฑ์การประเมินซ้ำ กรุณาระบุชื่ออื่น',
        });
      }
    }

    // 4. In-place SubCriteria Update & Reconcile
    const existingSubIds = new Set(existing.subCriteria.map((s) => s.id));
    const submittedSubIds = new Set(
      dto.subCriteria.filter((s) => s.id).map((s) => s.id as number),
    );

    const idsToDelete = [...existingSubIds].filter(
      (subId) => !submittedSubIds.has(subId),
    );

    await this.prisma.$transaction(async (tx) => {
      // Delete removed sub-criteria
      if (idsToDelete.length > 0) {
        await tx.subCriteria.deleteMany({
          where: { id: { in: idsToDelete }, criteriaId: id },
        });
      }

      // Update existing or create new sub-criteria
      for (const sub of dto.subCriteria) {
        const payload = {
          sortOrder: sub.sortOrder,
          title: sub.title.trim(),
          type: sub.type,
          maxScore: sub.type === SubCriteriaType.SCORED ? sub.maxScore : null,
          allowComment:
            sub.type === SubCriteriaType.SCORED
              ? (sub.allowComment ?? false)
              : false,
        };

        if (sub.id && existingSubIds.has(sub.id)) {
          await tx.subCriteria.update({
            where: { id: sub.id },
            data: payload,
          });
        } else {
          await tx.subCriteria.create({
            data: {
              ...payload,
              criteriaId: id,
            },
          });
        }
      }

      // Update parent criteria name
      await tx.criteria.update({
        where: { id },
        data: { name: dto.name.trim() },
      });

      await tx.auditLog.create({
        data: {
          actorId: null,
          action: AuditAction.CRITERIA_UPDATE,
          entityType: 'Criteria',
          entityId: String(id),
          oldValue: { name: existing.name },
          newValue: { name: dto.name.trim() },
          detail: {
            subCriteriaCount: dto.subCriteria.length,
          },
        },
      });
    });

    return this.findOne(id);
  }
}
