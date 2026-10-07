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
  Prisma,
} from '@prisma/client';

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

    // Evaluator can only see OPEN rounds (BR-EVL-01)
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

    // IDOR protection: Evaluator can only see OPEN rounds
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
    // Validate academic year & semester
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

    const created = await this.prisma.scholarshipRound.create({
      data: {
        name: dto.name.trim(),
        academicYear: dto.academicYear,
        semester: dto.semester,
        status: RoundStatus.DRAFT,
        criteriaId: dto.criteriaId ?? null,
      },
      include: {
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
      status: created.status,
      criteriaId: created.criteriaId,
      criteriaName: created.criteria?.name ?? null,
      applicantCount: 0,
      createdAt: created.createdAt,
      openedAt: created.openedAt,
      closedAt: created.closedAt,
      updatedAt: created.updatedAt,
    };
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

    const updated = await this.prisma.scholarshipRound.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.academicYear ? { academicYear: dto.academicYear } : {}),
        ...(dto.semester ? { semester: dto.semester } : {}),
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
      } else {
        const sum = scoredItems.reduce(
          (acc, curr) => acc + (curr.maxScore || 0),
          0,
        );
        if (sum !== 100) {
          reasons.push(
            `ผลรวมคะแนนเกณฑ์ย่อยแบบมีคะแนนไม่เท่ากับ 100 (ปัจจุบัน: ${sum})`,
          );
        }
      }
    }

    const latestBatch = round.importBatches[0];
    const isReady = reasons.length === 0;

    return {
      isReady,
      reasons,
      applicantCount: round._count.applicants,
      criteriaName: round.criteria?.name ?? null,
      lastInvalidRowsCount: latestBatch ? latestBatch.invalidRows : 0,
    };
  }

  async openRound(id: number) {
    const check = await this.checkOpenReadiness(id);
    if (!check.isReady) {
      throw new BusinessException({
        errorCode: 'ROUND_OPEN_PRECHECK_FAILED',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'ไม่ผ่านเงื่อนไขการเปิดรอบทุน',
        params: { reasons: check.reasons },
      });
    }

    const round = await this.prisma.scholarshipRound.findUnique({
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

    const updated = await this.prisma.scholarshipRound.update({
      where: { id },
      data: {
        status: RoundStatus.OPEN,
        openedAt: new Date(),
      },
    });

    return this.findOne(updated.id);
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

  async closeRound(id: number, dto: CloseRoundDto) {
    const round = await this.prisma.scholarshipRound.findUnique({
      where: { id },
    });

    if (!round || round.status !== RoundStatus.OPEN) {
      throw new BusinessException({
        errorCode: 'INVALID_ROUND_STATUS',
        statusCode: HttpStatus.CONFLICT,
        message: 'ปิดรอบได้เฉพาะรอบในสถานะเปิดรับสมัคร (Open) เท่านั้น',
        params: { status: round?.status, action: 'close_round' },
      });
    }

    const closeCheck = await this.checkCloseStatus(id);

    if (closeCheck.unsubmittedCount > 0) {
      if (!dto.acknowledged || dto.acknowledgedCount === undefined) {
        throw new BusinessException({
          errorCode: 'ROUND_CLOSE_ACK_REQUIRED',
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message:
            'มีผู้สมัครที่ยังไม่มีผลประเมิน ต้องกดยืนยันรับทราบก่อนปิดรอบ',
          params: {
            count: closeCheck.unsubmittedCount,
            applicants: closeCheck.applicants,
          },
        });
      }

      if (dto.acknowledgedCount !== closeCheck.unsubmittedCount) {
        throw new BusinessException({
          errorCode: 'ROUND_CLOSE_STATE_CHANGED',
          statusCode: HttpStatus.CONFLICT,
          message:
            'จำนวนผู้สมัครที่ไม่มีผลประเมินเปลี่ยนแปลงไปจากที่รับทราบ กรุณาตรวจสอบใหม่',
          params: {
            count: closeCheck.unsubmittedCount,
            applicants: closeCheck.applicants,
          },
        });
      }
    }

    const updated = await this.prisma.scholarshipRound.update({
      where: { id },
      data: {
        status: RoundStatus.CLOSED,
        closedAt: new Date(),
      },
    });

    return this.findOne(updated.id);
  }
}
