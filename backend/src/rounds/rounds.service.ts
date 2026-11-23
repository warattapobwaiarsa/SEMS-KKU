import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateScholarshipRoundDto,
  UpdateScholarshipRoundDto,
  LinkCriteriaDto,
  CloseRoundDto,
} from './dto/round.dto';
import { BusinessException } from '../common/http-exception.filter';
import {
  RoundStatus,
  SubCriteriaType,
  EvaluationStatus,
  AllocationStatus,
  AuditAction,
  Prisma,
} from '@prisma/client';
import { SetBudgetDto, SaveAllocationsDto } from './dto/allocation.dto';

@Injectable()
export class RoundsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: {
    page?: number;
    limit?: number;
    search?: string;
    academicYear?: number;
    semester?: number;
    status?: RoundStatus;
    userRole?: string;
  }) {
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ScholarshipRoundWhereInput = {};

    if (query?.userRole === 'EVALUATOR') {
      where.status = RoundStatus.OPEN;
    } else if (query?.status) {
      where.status = query.status;
    }

    if (query?.academicYear) {
      where.academicYear = Number(query.academicYear);
    }
    if (query?.semester) {
      where.semester = Number(query.semester);
    }
    if (query?.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [total, items] = await Promise.all([
      this.prisma.scholarshipRound.count({ where }),
      this.prisma.scholarshipRound.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          scholarshipType: {
            select: {
              id: true,
              name: true,
            },
          },
          criteria: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              applicants: true,
            },
          },
        },
      }),
    ]);

    const formatted = items.map((r) => ({
      id: r.id,
      name: r.name,
      academicYear: r.academicYear,
      semester: r.semester,
      scholarshipTypeId: r.scholarshipTypeId,
      scholarshipTypeName: r.scholarshipType?.name ?? null,
      status: r.status,
      criteriaId: r.criteriaId,
      criteriaName: r.criteria?.name ?? null,
      applicantCount: r._count.applicants,
      createdAt: r.createdAt,
      openedAt: r.openedAt,
      closedAt: r.closedAt,
      updatedAt: r.updatedAt,
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

  async findOne(id: number, userRole?: string) {
    const round = await this.prisma.scholarshipRound.findUnique({
      where: { id },
      include: {
        scholarshipType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        criteria: {
          include: {
            subCriteria: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        _count: {
          select: {
            applicants: true,
          },
        },
        importBatches: {
          orderBy: { importedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!round) {
      throw new NotFoundException({
        errorCode: 'NOT_FOUND',
        message: `ไม่พบรอบทุนการศึกษารหัส ${id}`,
      });
    }

    if (userRole === 'EVALUATOR' && round.status !== RoundStatus.OPEN) {
      throw new NotFoundException({
        errorCode: 'NOT_FOUND',
        message: 'ไม่พบรอบทุนที่เปิดรับประเมิน',
      });
    }

    const latestBatch = round.importBatches[0];

    return {
      id: round.id,
      name: round.name,
      academicYear: round.academicYear,
      semester: round.semester,
      scholarshipTypeId: round.scholarshipTypeId,
      scholarshipTypeName: round.scholarshipType?.name ?? null,
      scholarshipType: round.scholarshipType,
      status: round.status,
      criteriaId: round.criteriaId,
      criteria: round.criteria,
      applicantCount: round._count.applicants,
      lastInvalidRowsCount: latestBatch ? latestBatch.invalidRows : 0,
      createdAt: round.createdAt,
      openedAt: round.openedAt,
      closedAt: round.closedAt,
      updatedAt: round.updatedAt,
    };
  }

  async create(dto: CreateScholarshipRoundDto) {
    if (dto.academicYear < 2550 || dto.academicYear > 2700) {
      throw new BusinessException({
        errorCode: 'ACADEMIC_YEAR_OUT_OF_RANGE',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'ปีการศึกษาต้องเป็น พ.ศ. 2550–2700',
      });
    }
    if (dto.semester !== 1 && dto.semester !== 2) {
      throw new BusinessException({
        errorCode: 'SEMESTER_OUT_OF_RANGE',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'ภาคเรียนต้องเป็น 1 หรือ 2',
      });
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

    return await this.prisma.$transaction(async (tx) => {
      let criteriaId = dto.criteriaId ?? null;

      if (dto.scholarshipTypeId) {
        const scholarshipType = await tx.scholarshipType.findUnique({
          where: { id: dto.scholarshipTypeId },
        });
        if (!scholarshipType) {
          throw new NotFoundException(
            `ไม่พบประเภททุนรหัส ${dto.scholarshipTypeId}`,
          );
        }
        if (!scholarshipType.isActive) {
          throw new BusinessException({
            errorCode: 'SCHOLARSHIP_TYPE_INACTIVE',
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            message:
              'ประเภททุนนี้ถูกปิดการใช้งาน ไม่สามารถนำมาสร้างรอบทุนใหม่ได้',
          });
        }
        if (!criteriaId && !dto.criteria && scholarshipType.defaultCriteriaId) {
          criteriaId = scholarshipType.defaultCriteriaId;
        }
      }

      if (
        dto.criteria &&
        dto.criteria.subCriteria &&
        dto.criteria.subCriteria.length > 0
      ) {
        const criteriaName =
          dto.criteria.name?.trim() || `เกณฑ์สำหรับ${dto.name.trim()}`;

        const existingCrit = await tx.criteria.findUnique({
          where: { name: criteriaName },
        });
        if (existingCrit) {
          throw new BusinessException({
            errorCode: 'CRITERIA_NAME_DUPLICATE',
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            message: `ชื่อเกณฑ์ "${criteriaName}" มีอยู่แล้วในระบบ กรุณาระบุชื่อเกณฑ์อื่น`,
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
        criteriaId = createdCrit.id;
      }

      const created = await tx.scholarshipRound.create({
        data: {
          name: dto.name.trim(),
          academicYear: dto.academicYear,
          semester: dto.semester,
          status: RoundStatus.DRAFT,
          scholarshipTypeId: dto.scholarshipTypeId ?? null,
          criteriaId,
        },
        include: {
          scholarshipType: {
            select: { id: true, name: true },
          },
          criteria: {
            select: { id: true, name: true },
          },
        },
      });

      return {
        id: created.id,
        name: created.name,
        academicYear: created.academicYear,
        semester: created.semester,
        scholarshipTypeId: created.scholarshipTypeId,
        scholarshipTypeName: created.scholarshipType?.name ?? null,
        status: created.status,
        criteriaId: created.criteriaId,
        criteriaName: created.criteria?.name ?? null,
        applicantCount: 0,
        createdAt: created.createdAt,
        openedAt: created.openedAt,
        closedAt: created.closedAt,
        updatedAt: created.updatedAt,
      };
    });
  }

  async update(id: number, dto: UpdateScholarshipRoundDto) {
    const existing = await this.prisma.scholarshipRound.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException({
        errorCode: 'NOT_FOUND',
        message: `ไม่พบรอบทุนการศึกษารหัส ${id}`,
      });
    }

    if (existing.status !== RoundStatus.DRAFT) {
      throw new BusinessException({
        errorCode: 'INVALID_ROUND_STATUS',
        statusCode: HttpStatus.CONFLICT,
        message: 'แก้ไขข้อมูลรอบทุนได้เฉพาะในสถานะร่าง (Draft) เท่านั้น',
        params: { status: existing.status, action: 'update_round' },
      });
    }

    if (
      dto.academicYear !== undefined &&
      (dto.academicYear < 2550 || dto.academicYear > 2700)
    ) {
      throw new BusinessException({
        errorCode: 'ACADEMIC_YEAR_OUT_OF_RANGE',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'ปีการศึกษาต้องเป็น พ.ศ. 2550–2700',
      });
    }

    if (
      dto.semester !== undefined &&
      dto.semester !== 1 &&
      dto.semester !== 2
    ) {
      throw new BusinessException({
        errorCode: 'SEMESTER_OUT_OF_RANGE',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'ภาคเรียนต้องเป็น 1 หรือ 2',
      });
    }

    let criteriaIdToUpdate: number | undefined = undefined;

    if (
      dto.scholarshipTypeId !== undefined &&
      dto.scholarshipTypeId !== existing.scholarshipTypeId
    ) {
      if (dto.scholarshipTypeId !== null) {
        const scholarshipType = await this.prisma.scholarshipType.findUnique({
          where: { id: dto.scholarshipTypeId },
        });
        if (!scholarshipType) {
          throw new NotFoundException(
            `ไม่พบประเภททุนรหัส ${dto.scholarshipTypeId}`,
          );
        }
        if (!scholarshipType.isActive) {
          throw new BusinessException({
            errorCode: 'SCHOLARSHIP_TYPE_INACTIVE',
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            message: 'ประเภททุนนี้ถูกปิดการใช้งาน ไม่สามารถนำมาใช้กับรอบทุนได้',
          });
        }

        if (
          scholarshipType.defaultCriteriaId &&
          scholarshipType.defaultCriteriaId !== existing.criteriaId
        ) {
          if (dto.confirmCriteriaReset !== true) {
            throw new BusinessException({
              errorCode: 'CRITERIA_RESET_CONFIRMATION_REQUIRED',
              statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
              message:
                'การเปลี่ยนประเภททุนจะแทนที่เกณฑ์การประเมินด้วยเกณฑ์เริ่มต้นของประเภทใหม่ กรุณายืนยัน',
              params: {
                defaultCriteriaId: scholarshipType.defaultCriteriaId,
              },
            });
          } else {
            criteriaIdToUpdate = scholarshipType.defaultCriteriaId;
          }
        }
      }
    }

    const updated = await this.prisma.scholarshipRound.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.academicYear ? { academicYear: dto.academicYear } : {}),
        ...(dto.semester ? { semester: dto.semester } : {}),
        ...(dto.scholarshipTypeId !== undefined
          ? { scholarshipTypeId: dto.scholarshipTypeId }
          : {}),
        ...(criteriaIdToUpdate !== undefined
          ? { criteriaId: criteriaIdToUpdate }
          : {}),
      },
    });

    return this.findOne(updated.id);
  }

  async linkCriteria(id: number, dto: LinkCriteriaDto) {
    const existing = await this.prisma.scholarshipRound.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException({
        errorCode: 'NOT_FOUND',
        message: `ไม่พบรอบทุนการศึกษารหัส ${id}`,
      });
    }

    if (existing.status !== RoundStatus.DRAFT) {
      throw new BusinessException({
        errorCode: 'INVALID_ROUND_STATUS',
        statusCode: HttpStatus.CONFLICT,
        message:
          'เชื่อมหรือเปลี่ยนเกณฑ์ได้เฉพาะรอบในสถานะร่าง (Draft) เท่านั้น',
        params: { status: existing.status, action: 'link_criteria' },
      });
    }

    if (dto.criteriaId) {
      const criteria = await this.prisma.criteria.findUnique({
        where: { id: dto.criteriaId },
      });
      if (!criteria) {
        throw new NotFoundException({
          errorCode: 'NOT_FOUND',
          message: `ไม่พบเกณฑ์การประเมินรหัส ${dto.criteriaId}`,
        });
      }
    }

    await this.prisma.scholarshipRound.update({
      where: { id },
      data: { criteriaId: dto.criteriaId },
    });

    return this.findOne(id);
  }

  async checkOpenReadiness(id: number) {
    const round = await this.prisma.scholarshipRound.findUnique({
      where: { id },
      include: {
        criteria: {
          include: {
            subCriteria: true,
          },
        },
        _count: {
          select: { applicants: true },
        },
        importBatches: {
          orderBy: { importedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!round) {
      throw new NotFoundException({
        errorCode: 'NOT_FOUND',
        message: `ไม่พบรอบทุนการศึกษารหัส ${id}`,
      });
    }

    const reasons: string[] = [];

    // Condition 1: Main Info complete
    if (!round.name || !round.academicYear || !round.semester) {
      reasons.push('ข้อมูลหลักของรอบทุนไม่ครบถ้วน');
    }

    // Condition 2: Applicants >= 1
    if (round._count.applicants < 1) {
      reasons.push('ต้องมีข้อมูลผู้สมัครอย่างน้อย 1 คนในรอบทุน');
    }

    // Condition 3: Criteria linked and sum = 100
    if (!round.criteria) {
      reasons.push('ยังไม่ได้เชื่อมโยงเกณฑ์การประเมิน');
    } else {
      const scoredItems = round.criteria.subCriteria.filter(
        (s) => s.type === SubCriteriaType.SCORED,
      );
      if (scoredItems.length === 0) {
        reasons.push('เกณฑ์ที่เชื่อมโยงต้องมีหัวข้อแบบมีคะแนนอย่างน้อย 1 ข้อ');
      }
    }

    const latestBatch = round.importBatches[0];
    const isReady = reasons.length === 0;

    return {
      isReady,
      reasons,
      applicantCount: round._count.applicants,
      criteriaName: round.criteria?.name ?? null,
      targetScore: round.criteria?.targetScore ?? 100,
      lastInvalidRowsCount: latestBatch ? latestBatch.invalidRows : 0,
    };
  }

  async openRound(id: number, actorId?: number) {
    const check = await this.checkOpenReadiness(id);
    if (!check.isReady) {
      throw new BusinessException({
        errorCode: 'ROUND_OPEN_PRECHECK_FAILED',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'ไม่ผ่านเงื่อนไขการเปิดรอบทุน',
        params: { reasons: check.reasons },
      });
    }

    await this.prisma.$transaction(async (tx) => {
      const round = await tx.scholarshipRound.findUnique({
        where: { id },
      });
      if (!round || round.status !== RoundStatus.DRAFT) {
        throw new BusinessException({
          errorCode: 'INVALID_ROUND_STATUS',
          statusCode: HttpStatus.CONFLICT,
          message: 'เปิดรอบได้เฉพาะรอบในสถานะร่าง (Draft) เท่านั้น',
          params: { status: round?.status, action: 'open_round' },
        });
      }

      const openedAt = new Date();
      await tx.scholarshipRound.update({
        where: { id },
        data: {
          status: RoundStatus.OPEN,
          openedAt,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actorId ?? null,
          action: AuditAction.ROUND_STATUS_CHANGE,
          entityType: 'ScholarshipRound',
          entityId: String(id),
          roundId: id,
          oldValue: { status: RoundStatus.DRAFT },
          newValue: { status: RoundStatus.OPEN, openedAt },
          detail: { applicantCount: check.applicantCount },
        },
      });
    });

    return this.findOne(id);
  }

  async checkCloseStatus(id: number) {
    const round = await this.prisma.scholarshipRound.findUnique({
      where: { id },
      include: {
        applicants: {
          select: {
            id: true,
            studentCode: true,
            titlePrefix: true,
            firstName: true,
            lastName: true,
            evaluations: {
              where: { status: EvaluationStatus.SUBMITTED },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!round) {
      throw new NotFoundException({
        errorCode: 'NOT_FOUND',
        message: `ไม่พบรอบทุนการศึกษารหัส ${id}`,
      });
    }

    const unsubmittedApplicants = round.applicants
      .filter((a) => a.evaluations.length === 0)
      .map((a) => ({
        applicantId: a.id,
        studentCode: a.studentCode,
        titlePrefix: a.titlePrefix,
        firstName: a.firstName,
        lastName: a.lastName,
      }));

    return {
      roundId: id,
      unsubmittedCount: unsubmittedApplicants.length,
      applicants: unsubmittedApplicants,
    };
  }

  async closeRound(id: number, dto: CloseRoundDto, actorId?: number) {
    await this.prisma.$transaction(async (tx) => {
      const round = await tx.scholarshipRound.findUnique({
        where: { id },
        include: {
          applicants: {
            select: {
              id: true,
              studentCode: true,
              titlePrefix: true,
              firstName: true,
              lastName: true,
              evaluations: {
                where: { status: EvaluationStatus.SUBMITTED },
                select: { id: true },
              },
            },
          },
        },
      });

      if (!round || round.status !== RoundStatus.OPEN) {
        throw new BusinessException({
          errorCode: 'INVALID_ROUND_STATUS',
          statusCode: HttpStatus.CONFLICT,
          message: 'ปิดรอบได้เฉพาะรอบในสถานะเปิดรับสมัคร (Open) เท่านั้น',
          params: { status: round?.status, action: 'close_round' },
        });
      }

      const unsubmittedApplicants = round.applicants
        .filter((a) => a.evaluations.length === 0)
        .map((a) => ({
          applicantId: a.id,
          studentCode: a.studentCode,
          titlePrefix: a.titlePrefix,
          firstName: a.firstName,
          lastName: a.lastName,
        }));

      const unsubmittedCount = unsubmittedApplicants.length;

      if (unsubmittedCount > 0) {
        if (!dto.acknowledged || dto.acknowledgedCount === undefined) {
          throw new BusinessException({
            errorCode: 'ROUND_CLOSE_ACK_REQUIRED',
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            message:
              'มีผู้สมัครที่ยังไม่มีผลประเมิน ต้องกดยืนยันรับทราบก่อนปิดรอบ',
            params: {
              count: unsubmittedCount,
              applicants: unsubmittedApplicants,
            },
          });
        }

        if (dto.acknowledgedCount !== unsubmittedCount) {
          throw new BusinessException({
            errorCode: 'ROUND_CLOSE_STATE_CHANGED',
            statusCode: HttpStatus.CONFLICT,
            message:
              'จำนวนผู้สมัครที่ไม่มีผลประเมินเปลี่ยนแปลงไปจากที่รับทราบ กรุณาตรวจสอบใหม่',
            params: {
              count: unsubmittedCount,
              applicants: unsubmittedApplicants,
            },
          });
        }
      }

      const closedAt = new Date();
      await tx.scholarshipRound.update({
        where: { id },
        data: {
          status: RoundStatus.CLOSED,
          closedAt,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actorId ?? null,
          action: AuditAction.ROUND_STATUS_CHANGE,
          entityType: 'ScholarshipRound',
          entityId: String(id),
          roundId: id,
          oldValue: { status: RoundStatus.OPEN },
          newValue: { status: RoundStatus.CLOSED, closedAt },
          detail: {
            unsubmittedCount,
            acknowledged: dto.acknowledged ?? false,
          },
        },
      });
    });

    return this.findOne(id);
  }

  async getAllocationSummary(roundId: number) {
    const round = await this.prisma.scholarshipRound.findUnique({
      where: { id: roundId },
      include: {
        applicants: {
          include: {
            contact: true,
            evaluations: {
              where: { status: EvaluationStatus.SUBMITTED },
              select: { totalScore: true },
            },
            allocation: true,
          },
        },
        allocation: {
          include: {
            allocations: true,
          },
        },
      },
    });

    if (!round) {
      throw new NotFoundException({
        errorCode: 'NOT_FOUND',
        message: `ไม่พบรอบทุนการศึกษารหัส ${roundId}`,
      });
    }

    // Ensure summary exists
    let summary = round.allocation;
    if (!summary) {
      summary = await this.prisma.allocationSummary.create({
        data: {
          roundId,
          totalBudget: new Prisma.Decimal(0),
          status: AllocationStatus.EDITING,
        },
        include: {
          allocations: true,
        },
      });
    }

    // Calculate score and rank for each applicant
    const applicantsWithScore = round.applicants.map((app) => {
      const validScores = app.evaluations
        .map((e) => (e.totalScore !== null ? Number(e.totalScore) : null))
        .filter((s): s is number => s !== null);

      const finalScore =
        validScores.length > 0
          ? parseFloat(
              (
                validScores.reduce((sum, s) => sum + s, 0) / validScores.length
              ).toFixed(2),
            )
          : 0;

      return {
        applicant: app,
        finalScore,
      };
    });

    // Sort descending by finalScore, then gpa
    applicantsWithScore.sort((a, b) => {
      if (b.finalScore !== a.finalScore) {
        return b.finalScore - a.finalScore;
      }
      return Number(b.applicant.gpa) - Number(a.applicant.gpa);
    });

    const existingAllocationsMap = new Map<
      number,
      { isAwarded: boolean; amount: number }
    >();
    if (summary.allocations) {
      for (const al of summary.allocations) {
        existingAllocationsMap.set(al.applicantId, {
          isAwarded: al.isAwarded,
          amount: Number(al.amount),
        });
      }
    }

    let allocatedAmount = 0;
    let recipientsCount = 0;

    const applicantItems = applicantsWithScore.map((item, index) => {
      const app = item.applicant;
      const alloc = existingAllocationsMap.get(app.id);
      const isAwarded = alloc?.isAwarded ?? false;
      const amount = alloc?.amount ?? 0;

      if (isAwarded) {
        allocatedAmount += amount;
        recipientsCount++;
      }

      return {
        id: app.id,
        applicantId: app.id,
        studentCode: app.studentCode,
        titlePrefix: app.titlePrefix,
        firstName: app.firstName,
        lastName: app.lastName,
        faculty: app.faculty,
        major: app.major,
        studyYear: app.studyYear,
        gpa: Number(app.gpa),
        finalScore: item.finalScore,
        rank: index + 1,
        isAwarded,
        amount,
        maskedCitizenId: app.contact?.citizenIdMasked ?? '1-xxxx-xxxxx-xx-x',
        phone: app.contact?.phone ?? '',
        email: app.contact?.email ?? '',
      };
    });

    const totalBudget = Number(summary.totalBudget);
    const remainingBudget = totalBudget - allocatedAmount;

    return {
      success: true,
      data: {
        roundId: round.id,
        roundName: round.name,
        roundStatus: round.status,
        totalBudget,
        allocatedAmount,
        remainingBudget,
        recipientsCount,
        status: summary.status,
        statusChangedAt: summary.statusChangedAt?.toISOString() ?? null,
        allocations: applicantItems,
      },
    };
  }

  async setRoundBudget(roundId: number, dto: SetBudgetDto, actorId?: number) {
    if (dto.totalBudget < 0) {
      throw new BusinessException({
        errorCode: 'INVALID_BUDGET',
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'งบประมาณต้องไม่ต่ำกว่า 0',
      });
    }

    const round = await this.prisma.scholarshipRound.findUnique({
      where: { id: roundId },
      include: { allocation: true },
    });

    if (!round) {
      throw new NotFoundException({
        errorCode: 'NOT_FOUND',
        message: `ไม่พบรอบทุนการศึกษารหัส ${roundId}`,
      });
    }

    if (round.allocation?.status === AllocationStatus.FINALIZED) {
      throw new BusinessException({
        errorCode: 'ALLOCATION_FINALIZED',
        statusCode: HttpStatus.CONFLICT,
        message: 'ไม่สามารถแก้ไขงบประมาณของรอบที่ยืนยันผลขั้นสุดท้ายแล้ว',
      });
    }

    const isNew = !round.allocation;
    const oldBudget = round.allocation
      ? Number(round.allocation.totalBudget)
      : 0;

    await this.prisma.allocationSummary.upsert({
      where: { roundId },
      create: {
        roundId,
        totalBudget: new Prisma.Decimal(dto.totalBudget),
        status: AllocationStatus.EDITING,
        statusChangedById: actorId ?? null,
      },
      update: {
        totalBudget: new Prisma.Decimal(dto.totalBudget),
        statusChangedById: actorId ?? null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: actorId ?? null,
        action: isNew ? AuditAction.BUDGET_SET : AuditAction.BUDGET_UPDATE,
        entityType: 'AllocationSummary',
        entityId: String(roundId),
        roundId,
        oldValue: { totalBudget: oldBudget },
        newValue: { totalBudget: dto.totalBudget },
      },
    });

    return this.getAllocationSummary(roundId);
  }

  async saveAllocations(
    roundId: number,
    dto: SaveAllocationsDto,
    actorId?: number,
  ) {
    const round = await this.prisma.scholarshipRound.findUnique({
      where: { id: roundId },
      include: { allocation: true },
    });

    if (!round) {
      throw new NotFoundException({
        errorCode: 'NOT_FOUND',
        message: `ไม่พบรอบทุนการศึกษารหัส ${roundId}`,
      });
    }

    let summary = round.allocation;
    if (!summary) {
      summary = await this.prisma.allocationSummary.create({
        data: {
          roundId,
          totalBudget: new Prisma.Decimal(0),
          status: AllocationStatus.EDITING,
        },
      });
    }

    if (summary.status === AllocationStatus.FINALIZED) {
      throw new BusinessException({
        errorCode: 'ALLOCATION_FINALIZED',
        statusCode: HttpStatus.CONFLICT,
        message: 'ไม่สามารถแก้ไขผลการจัดสรรของรอบที่ยืนยันผลขั้นสุดท้ายแล้ว',
      });
    }

    // Validate amounts
    for (const item of dto.allocations) {
      if (item.amount < 0) {
        throw new BusinessException({
          errorCode: 'INVALID_AMOUNT',
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'จำนวนเงินจัดสรรต้องไม่ติดลบ',
        });
      }
    }

    // Validate that all applicants belong to this round
    if (this.prisma.applicant?.findMany && dto.allocations.length > 0) {
      const applicantIds = dto.allocations.map((it) => it.applicantId);
      const validApplicants = await this.prisma.applicant.findMany({
        where: {
          id: { in: applicantIds },
          roundId,
        },
        select: { id: true },
      });
      if (validApplicants.length !== applicantIds.length) {
        throw new BusinessException({
          errorCode: 'INVALID_APPLICANT',
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'มีผู้สมัครบางรายไม่ได้อยู่ในรอบทุนนี้',
        });
      }
    }

    const currentTotalBudget = Number(summary.totalBudget);

    // คำนวณยอดจัดสรรรวมจริง โดยนำข้อมูลเดิมใน DB มารวมกับ payload ใหม่
    const existingAllocations = this.prisma.allocation?.findMany
      ? await this.prisma.allocation.findMany({
          where: { summaryId: summary.id },
        })
      : [];
    const amountMap = new Map<number, { isAwarded: boolean; amount: number }>();
    for (const alloc of existingAllocations) {
      amountMap.set(alloc.applicantId, {
        isAwarded: alloc.isAwarded,
        amount: Number(alloc.amount),
      });
    }
    for (const item of dto.allocations) {
      amountMap.set(item.applicantId, {
        isAwarded: item.isAwarded,
        amount: item.amount,
      });
    }
    let totalAllocated = 0;
    for (const val of amountMap.values()) {
      if (val.isAwarded) {
        totalAllocated += val.amount;
      }
    }

    if (currentTotalBudget > 0 && totalAllocated > currentTotalBudget) {
      throw new BusinessException({
        errorCode: 'BUDGET_EXCEEDED',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: `ยอดเงินที่จัดสรร (${totalAllocated.toLocaleString()} บาท) เกินเพดานงบประมาณ (${currentTotalBudget.toLocaleString()} บาท)`,
      });
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.allocations) {
        await tx.allocation.upsert({
          where: { applicantId: item.applicantId },
          create: {
            summaryId: summary.id,
            applicantId: item.applicantId,
            isAwarded: item.isAwarded,
            amount: new Prisma.Decimal(item.amount),
          },
          update: {
            isAwarded: item.isAwarded,
            amount: new Prisma.Decimal(item.amount),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: actorId ?? null,
          action: AuditAction.ALLOCATION_UPDATE,
          entityType: 'AllocationSummary',
          entityId: String(roundId),
          roundId,
          detail: {
            itemsCount: dto.allocations.length,
            awardedCount: dto.allocations.filter((it) => it.isAwarded).length,
            totalAllocated,
          },
        },
      });
    });

    return this.getAllocationSummary(roundId);
  }

  async finalizeAllocation(roundId: number, actorId?: number) {
    const summary = await this.prisma.allocationSummary.findUnique({
      where: { roundId },
    });

    if (!summary) {
      throw new NotFoundException({
        errorCode: 'NOT_FOUND',
        message: 'ไม่พบข้อมูลการจัดสรรของรอบทุนนี้',
      });
    }

    const now = new Date();
    await this.prisma.allocationSummary.update({
      where: { roundId },
      data: {
        status: AllocationStatus.FINALIZED,
        statusChangedById: actorId ?? null,
        statusChangedAt: now,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: actorId ?? null,
        action: AuditAction.ALLOCATION_STATUS_CHANGE,
        entityType: 'AllocationSummary',
        entityId: String(roundId),
        roundId,
        oldValue: { status: summary.status },
        newValue: { status: AllocationStatus.FINALIZED, statusChangedAt: now },
      },
    });

    return this.getAllocationSummary(roundId);
  }

  async reopenAllocation(roundId: number, actorId?: number) {
    const summary = await this.prisma.allocationSummary.findUnique({
      where: { roundId },
    });

    if (!summary) {
      throw new NotFoundException({
        errorCode: 'NOT_FOUND',
        message: 'ไม่พบข้อมูลการจัดสรรของรอบทุนนี้',
      });
    }

    const now = new Date();
    await this.prisma.allocationSummary.update({
      where: { roundId },
      data: {
        status: AllocationStatus.EDITING,
        statusChangedById: actorId ?? null,
        statusChangedAt: now,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: actorId ?? null,
        action: AuditAction.ALLOCATION_STATUS_CHANGE,
        entityType: 'AllocationSummary',
        entityId: String(roundId),
        roundId,
        oldValue: { status: summary.status },
        newValue: { status: AllocationStatus.EDITING, statusChangedAt: now },
      },
    });

    return this.getAllocationSummary(roundId);
  }

  async deleteDraftRound(id: number, actorId?: number) {
    const round = await this.prisma.scholarshipRound.findUnique({
      where: { id },
      include: {
        _count: { select: { applicants: true } },
      },
    });

    if (!round) {
      throw new NotFoundException({
        errorCode: 'NOT_FOUND',
        message: `ไม่พบรอบทุนการศึกษารหัส ${id}`,
      });
    }

    if (round.status !== RoundStatus.DRAFT) {
      throw new BusinessException({
        errorCode: 'CANNOT_DELETE_ACTIVE_ROUND',
        statusCode: HttpStatus.CONFLICT,
        message:
          'สามารถลบได้เฉพาะรอบทุนในสถานะแบบร่าง (Draft) เท่านั้น ไม่สามารถลบรอบที่เปิดหรือปิดไปแล้ว (BR-RND-06)',
        params: { status: round.status },
      });
    }

    const applicantCount = round._count.applicants;

    let validActorId: number | null = null;
    if (actorId) {
      const actorExists = await this.prisma.user.findUnique({
        where: { id: actorId },
        select: { id: true },
      });
      if (actorExists) {
        validActorId = actorExists.id;
      }
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Delete evaluations and evaluation items linked to applicants in this round
      await tx.evaluationItem.deleteMany({
        where: {
          evaluation: {
            applicant: { roundId: id },
          },
        },
      });
      await tx.evaluation.deleteMany({
        where: {
          applicant: { roundId: id },
        },
      });

      // 2. Delete allocations and allocation summary
      await tx.allocation.deleteMany({
        where: {
          OR: [{ summary: { roundId: id } }, { applicant: { roundId: id } }],
        },
      });
      await tx.allocationSummary.deleteMany({
        where: { roundId: id },
      });

      // 3. Delete contacts and supporting info explicitly
      await tx.applicantContact.deleteMany({
        where: {
          applicant: { roundId: id },
        },
      });
      await tx.applicantSupportingInfo.deleteMany({
        where: {
          applicant: { roundId: id },
        },
      });

      // 4. Delete applicants
      await tx.applicant.deleteMany({
        where: { roundId: id },
      });

      // 5. Delete import batches
      await tx.importBatch.deleteMany({
        where: { roundId: id },
      });

      // 6. Delete the round itself
      await tx.scholarshipRound.delete({
        where: { id },
      });

      // 7. Log audit trail
      await tx.auditLog.create({
        data: {
          actorId: validActorId,
          action: AuditAction.ROUND_STATUS_CHANGE,
          entityType: 'ScholarshipRound',
          entityId: String(id),
          roundId: id,
          oldValue: {
            name: round.name,
            academicYear: round.academicYear,
            semester: round.semester,
            status: round.status,
          },
          detail: {
            action: 'DELETE_DRAFT_ROUND',
            applicantCount,
          },
        },
      });
    });

    return {
      success: true,
      message: 'ลบรอบทุนการศึกษาแบบร่างสำเร็จเรียบร้อย',
    };
  }
}
