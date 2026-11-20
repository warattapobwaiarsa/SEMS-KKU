import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScholarshipTypeDto } from './dto/create-scholarship-type.dto';
import { UpdateScholarshipTypeDto } from './dto/update-scholarship-type.dto';
import { QueryScholarshipTypeDto } from './dto/query-scholarship-type.dto';
import { BusinessException } from '../common/http-exception.filter';
import {
  AuditAction,
  Prisma,
  RoundStatus,
  SubCriteriaType,
} from '@prisma/client';

@Injectable()
export class ScholarshipTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: QueryScholarshipTypeDto) {
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ScholarshipTypeWhereInput = {};

    if (query?.activeOnly) {
      where.isActive = true;
    }

    if (query?.search && query.search.trim().length > 0) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.scholarshipType.count({ where }),
      this.prisma.scholarshipType.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isActive: 'desc' }, { id: 'desc' }],
        include: {
          defaultCriteria: {
            select: {
              id: true,
              name: true,
              _count: {
                select: {
                  subCriteria: true,
                },
              },
            },
          },
          _count: {
            select: {
              rounds: true,
            },
          },
          rounds: {
            where: {
              status: { in: [RoundStatus.OPEN, RoundStatus.CLOSED] },
            },
            select: { id: true },
            take: 1,
          },
        },
      }),
    ]);

    const formatted = items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      defaultCriteriaId: item.defaultCriteriaId,
      defaultCriteriaName: item.defaultCriteria?.name ?? null,
      subCriteriaCount: item.defaultCriteria?._count?.subCriteria ?? 0,
      isActive: item.isActive,
      roundsCount: item._count.rounds,
      canDelete: (item.rounds ?? []).length === 0,
      hasOpenOrClosedRounds: (item.rounds ?? []).length > 0,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return {
      data: formatted,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: number) {
    const item = await this.prisma.scholarshipType.findUnique({
      where: { id },
      include: {
        defaultCriteria: {
          select: {
            id: true,
            name: true,
            subCriteria: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                title: true,
                type: true,
                maxScore: true,
                allowComment: true,
                sortOrder: true,
              },
            },
          },
        },
        _count: {
          select: {
            rounds: true,
          },
        },
        rounds: {
          where: {
            status: { in: [RoundStatus.OPEN, RoundStatus.CLOSED] },
          },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`ไม่พบประเภททุนรหัส ${id}`);
    }

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      defaultCriteriaId: item.defaultCriteriaId,
      defaultCriteria: item.defaultCriteria,
      isActive: item.isActive,
      roundsCount: item._count.rounds,
      canDelete: (item.rounds ?? []).length === 0,
      hasOpenOrClosedRounds: (item.rounds ?? []).length > 0,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  async create(dto: CreateScholarshipTypeDto, actorId?: number | null) {
    const trimmedName = dto.name.trim();

    // Check duplicate name
    const existing = await this.prisma.scholarshipType.findFirst({
      where: {
        name: { equals: trimmedName, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new BusinessException({
        errorCode: 'SCHOLARSHIP_TYPE_NAME_EXISTS',
        statusCode: HttpStatus.CONFLICT,
        message: 'ชื่อประเภททุนนี้มีอยู่ในระบบแล้ว',
      });
    }

    // Check defaultCriteria exists if provided
    if (dto.defaultCriteriaId) {
      const criteria = await this.prisma.criteria.findUnique({
        where: { id: dto.defaultCriteriaId },
      });
      if (!criteria) {
        throw new NotFoundException(
          `ไม่พบเกณฑ์การประเมินรหัส ${dto.defaultCriteriaId}`,
        );
      }
    }

    if (dto.criteria?.subCriteria && dto.criteria.subCriteria.length > 0) {
      const scoredItems = dto.criteria.subCriteria.filter(
        (item) => item.type === SubCriteriaType.SCORED,
      );
      if (scoredItems.length === 0) {
        throw new BusinessException({
          errorCode: 'SCORED_CRITERIA_REQUIRED',
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message: 'เกณฑ์ต้องมีข้อแบบ Scored อย่างน้อย 1 ข้อ',
        });
      }

      for (const item of scoredItems) {
        if (!item.maxScore || item.maxScore < 1 || item.maxScore > 1000) {
          throw new BusinessException({
            errorCode: 'MAX_SCORE_OUT_OF_RANGE',
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            message: 'คะแนนเต็มของแต่ละข้อต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป',
          });
        }
      }

      const targetScore = dto.criteria.targetScore ?? 100;
      const totalScore = scoredItems.reduce(
        (sum, item) => sum + (Number(item.maxScore) || 0),
        0,
      );
      if (totalScore !== targetScore) {
        throw new BusinessException({
          errorCode: 'CRITERIA_SUM_NOT_100',
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message: `ผลรวมคะแนนต้องเท่ากับ ${targetScore} คะแนนพอดี (ปัจจุบัน: ${totalScore} คะแนน)`,
        });
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      let resolvedDefaultCriteriaId = dto.defaultCriteriaId ?? null;

      if (dto.criteria?.subCriteria && dto.criteria.subCriteria.length > 0) {
        const criteriaName =
          dto.criteria.name?.trim() || `เกณฑ์สำหรับ${trimmedName}`;

        const existingCrit = await tx.criteria.findUnique({
          where: { name: criteriaName },
        });
        if (existingCrit) {
          throw new BusinessException({
            errorCode: 'CRITERIA_NAME_DUPLICATE',
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            message: `ชื่อเกณฑ์ "${criteriaName}" มีอยู่แล้วในระบบ`,
          });
        }

        const createdCrit = await tx.criteria.create({
          data: {
            name: criteriaName,
            targetScore: dto.criteria.targetScore ?? 100,
            subCriteria: {
              create: dto.criteria.subCriteria.map((sub, idx) => ({
                sortOrder: sub.sortOrder ?? idx + 1,
                title: sub.title.trim(),
                type: sub.type,
                maxScore:
                  sub.type === SubCriteriaType.SCORED
                    ? (sub.maxScore ?? null)
                    : null,
                allowComment:
                  sub.type === SubCriteriaType.SCORED
                    ? (sub.allowComment ?? false)
                    : false,
              })),
            },
          },
        });
        resolvedDefaultCriteriaId = createdCrit.id;
      }

      const result = await tx.scholarshipType.create({
        data: {
          name: trimmedName,
          description: dto.description?.trim() || null,
          defaultCriteriaId: resolvedDefaultCriteriaId,
          isActive: true,
        },
        include: {
          defaultCriteria: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actorId ?? null,
          action: AuditAction.SCHOLARSHIP_TYPE_CREATE,
          entityType: 'ScholarshipType',
          entityId: String(result.id),
          newValue: {
            id: result.id,
            name: result.name,
            description: result.description,
            defaultCriteriaId: result.defaultCriteriaId,
            isActive: result.isActive,
          },
        },
      });

      return result;
    });

    return created;
  }

  async update(
    id: number,
    dto: UpdateScholarshipTypeDto,
    actorId?: number | null,
  ) {
    const existing = await this.prisma.scholarshipType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`ไม่พบประเภททุนรหัส ${id}`);
    }

    const updateData: Prisma.ScholarshipTypeUpdateInput = {};

    if (dto.name !== undefined) {
      const trimmedName = dto.name.trim();
      if (trimmedName.toLowerCase() !== existing.name.toLowerCase()) {
        const duplicate = await this.prisma.scholarshipType.findFirst({
          where: {
            name: { equals: trimmedName, mode: 'insensitive' },
            id: { not: id },
          },
        });
        if (duplicate) {
          throw new BusinessException({
            errorCode: 'SCHOLARSHIP_TYPE_NAME_EXISTS',
            statusCode: HttpStatus.CONFLICT,
            message: 'ชื่อประเภททุนนี้มีอยู่ในระบบแล้ว',
          });
        }
      }
      updateData.name = trimmedName;
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description?.trim() || null;
    }

    if (dto.defaultCriteriaId !== undefined) {
      if (dto.defaultCriteriaId === null) {
        updateData.defaultCriteria = { disconnect: true };
      } else {
        const criteria = await this.prisma.criteria.findUnique({
          where: { id: dto.defaultCriteriaId },
        });
        if (!criteria) {
          throw new NotFoundException(
            `ไม่พบเกณฑ์การประเมินรหัส ${dto.defaultCriteriaId}`,
          );
        }
        updateData.defaultCriteria = { connect: { id: dto.defaultCriteriaId } };
      }
    }

    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    if (dto.criteria?.subCriteria && dto.criteria.subCriteria.length > 0) {
      const scoredItems = dto.criteria.subCriteria.filter(
        (item) => item.type === SubCriteriaType.SCORED,
      );
      if (scoredItems.length === 0) {
        throw new BusinessException({
          errorCode: 'SCORED_CRITERIA_REQUIRED',
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message: 'เกณฑ์ต้องมีข้อแบบ Scored อย่างน้อย 1 ข้อ',
        });
      }

      for (const item of scoredItems) {
        if (!item.maxScore || item.maxScore < 1 || item.maxScore > 1000) {
          throw new BusinessException({
            errorCode: 'MAX_SCORE_OUT_OF_RANGE',
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            message: 'คะแนนเต็มของแต่ละข้อต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป',
          });
        }
      }

      const targetScore = dto.criteria.targetScore ?? 100;
      const totalScore = scoredItems.reduce(
        (sum, item) => sum + (Number(item.maxScore) || 0),
        0,
      );
      if (totalScore !== targetScore) {
        throw new BusinessException({
          errorCode: 'CRITERIA_SUM_NOT_100',
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message: `ผลรวมคะแนนต้องเท่ากับ ${targetScore} คะแนนพอดี (ปัจจุบัน: ${totalScore} คะแนน)`,
        });
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.criteria?.subCriteria && dto.criteria.subCriteria.length > 0) {
        if (existing.defaultCriteriaId) {
          const isLocked = await tx.scholarshipRound.findFirst({
            where: {
              criteriaId: existing.defaultCriteriaId,
              status: { in: [RoundStatus.OPEN, RoundStatus.CLOSED] },
            },
          });
          if (isLocked) {
            throw new BusinessException({
              errorCode: 'CRITERIA_LOCKED',
              statusCode: HttpStatus.CONFLICT,
              message: 'เกณฑ์ถูกใช้ในรอบ Open/Closed แล้ว ห้ามแก้ไข',
            });
          }

          const existingSubs = await tx.subCriteria.findMany({
            where: { criteriaId: existing.defaultCriteriaId },
          });
          const existingSubIds = new Set(existingSubs.map((s) => s.id));
          const submittedSubIds = new Set(
            dto.criteria.subCriteria
              .filter((s) => s.id)
              .map((s) => s.id as number),
          );
          const idsToDelete = [...existingSubIds].filter(
            (subId) => !submittedSubIds.has(subId),
          );

          if (idsToDelete.length > 0) {
            await tx.subCriteria.deleteMany({
              where: {
                id: { in: idsToDelete },
                criteriaId: existing.defaultCriteriaId,
              },
            });
          }

          for (let idx = 0; idx < dto.criteria.subCriteria.length; idx++) {
            const sub = dto.criteria.subCriteria[idx];
            const payload = {
              sortOrder: sub.sortOrder ?? idx + 1,
              title: sub.title.trim(),
              type: sub.type,
              maxScore:
                sub.type === SubCriteriaType.SCORED
                  ? (sub.maxScore ?? null)
                  : null,
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
                  criteriaId: existing.defaultCriteriaId,
                },
              });
            }
          }

          if (dto.criteria.name?.trim()) {
            await tx.criteria.update({
              where: { id: existing.defaultCriteriaId },
              data: { name: dto.criteria.name.trim() },
            });
          }
        } else {
          const criteriaName =
            dto.criteria.name?.trim() || `เกณฑ์สำหรับ${existing.name}`;
          const newCrit = await tx.criteria.create({
            data: {
              name: criteriaName,
              subCriteria: {
                create: dto.criteria.subCriteria.map((sub, idx) => ({
                  sortOrder: sub.sortOrder ?? idx + 1,
                  title: sub.title.trim(),
                  type: sub.type,
                  maxScore:
                    sub.type === SubCriteriaType.SCORED
                      ? (sub.maxScore ?? null)
                      : null,
                  allowComment:
                    sub.type === SubCriteriaType.SCORED
                      ? (sub.allowComment ?? false)
                      : false,
                })),
              },
            },
          });
          updateData.defaultCriteria = { connect: { id: newCrit.id } };
        }
      }

      const result = await tx.scholarshipType.update({
        where: { id },
        data: updateData,
        include: {
          defaultCriteria: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actorId ?? null,
          action: AuditAction.SCHOLARSHIP_TYPE_UPDATE,
          entityType: 'ScholarshipType',
          entityId: String(id),
          oldValue: {
            name: existing.name,
            description: existing.description,
            defaultCriteriaId: existing.defaultCriteriaId,
            isActive: existing.isActive,
          },
          newValue: {
            name: result.name,
            description: result.description,
            defaultCriteriaId: result.defaultCriteriaId,
            isActive: result.isActive,
          },
        },
      });

      return result;
    });

    return updated;
  }

  async toggleActive(id: number, isActive: boolean, actorId?: number | null) {
    const existing = await this.prisma.scholarshipType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`ไม่พบประเภททุนรหัส ${id}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.scholarshipType.update({
        where: { id },
        data: { isActive },
      });

      await tx.auditLog.create({
        data: {
          actorId: actorId ?? null,
          action: isActive
            ? AuditAction.SCHOLARSHIP_TYPE_ACTIVATE
            : AuditAction.SCHOLARSHIP_TYPE_DEACTIVATE,
          entityType: 'ScholarshipType',
          entityId: String(id),
          oldValue: { isActive: existing.isActive },
          newValue: { isActive: result.isActive },
        },
      });

      return result;
    });

    return updated;
  }

  async delete(id: number) {
    const existing = await this.prisma.scholarshipType.findUnique({
      where: { id },
      include: {
        rounds: {
          where: {
            status: { in: [RoundStatus.OPEN, RoundStatus.CLOSED] },
          },
          select: { id: true, name: true, status: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`ไม่พบประเภททุนรหัส ${id}`);
    }

    if (existing.rounds.length > 0) {
      throw new BusinessException({
        errorCode: 'CANNOT_DELETE_ACTIVE_SCHOLARSHIP_TYPE',
        statusCode: HttpStatus.CONFLICT,
        message:
          'ไม่สามารถลบประเภททุนที่ผูกกับรอบที่เปิดรับประเมินหรือปิดรอบไปแล้วได้ สามารถลบได้เฉพาะประเภททุนที่ไม่มีรอบ หรือผูกกับรอบสถานะแบบร่าง (Draft) เท่านั้น',
      });
    }

    return await this.prisma.$transaction(async (tx) => {
      // Disconnect any draft rounds from this scholarship type
      await tx.scholarshipRound.updateMany({
        where: { scholarshipTypeId: id },
        data: { scholarshipTypeId: null },
      });

      return await tx.scholarshipType.delete({
        where: { id },
      });
    });
  }
}
