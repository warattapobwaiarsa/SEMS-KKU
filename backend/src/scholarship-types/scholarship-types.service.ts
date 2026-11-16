import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScholarshipTypeDto } from './dto/create-scholarship-type.dto';
import { UpdateScholarshipTypeDto } from './dto/update-scholarship-type.dto';
import { QueryScholarshipTypeDto } from './dto/query-scholarship-type.dto';
import { BusinessException } from '../common/http-exception.filter';
import { AuditAction, Prisma } from '@prisma/client';

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
            },
          },
          _count: {
            select: {
              rounds: true,
            },
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
      isActive: item.isActive,
      roundsCount: item._count.rounds,
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

    const created = await this.prisma.$transaction(async (tx) => {
      const result = await tx.scholarshipType.create({
        data: {
          name: trimmedName,
          description: dto.description?.trim() || null,
          defaultCriteriaId: dto.defaultCriteriaId ?? null,
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

    const updated = await this.prisma.$transaction(async (tx) => {
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
}
