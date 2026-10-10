import { HttpStatus, Injectable } from '@nestjs/common';
import { EvaluationStatus, Prisma, RoundStatus, User } from '@prisma/client';
import { AppException } from '../common/exceptions/app.exception';
import { PrismaService } from '../prisma/prisma.service';
import { ListApplicantsQueryDto } from './dto/list-applicants-query.dto';

/** สถานะการประเมิน "ของตัวเอง" ที่ส่งให้ Evaluator ดู (ตาม spec: myStatus) */
export type MyEvaluationStatus = 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED';

/**
 * ข้อมูลผู้สมัคร 1 แถวที่ Evaluator เห็นในหน้ารายชื่อ
 * ชื่อฟิลด์ตาม OpenAPI `ApplicantListItemDto`
 * ไม่มีเลขบัตรประชาชน / โทรศัพท์ / อีเมล เด็ดขาด [FR-APP-03] [BR-APP-04]
 */
export interface EvaluatorApplicantListItem {
  id: number;
  roundId: number;
  legacySeq: number | null;
  studentCode: string;
  titlePrefix: string;
  firstName: string;
  lastName: string;
  faculty: string;
  major: string;
  studyYear: number;
  gpa: number;
  submittedCount: number;
  myStatus: MyEvaluationStatus;
  canStart: boolean;
}

/** ผลลัพธ์แบบแบ่งหน้า (ResponseTransformInterceptor จะยก meta ขึ้นไปไว้ใน envelope) */
export interface PaginatedApplicantList {
  data: EvaluatorApplicantListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class EvaluationService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * รายชื่อผู้สมัครของรอบทุน สำหรับ Evaluator [FR-EVL-01] [BR-EVL-01]
   * - เห็นได้เฉพาะรอบที่ OPEN และเห็นผู้สมัครทุกคนในรอบ (ไม่มีการมอบหมายรายคน)
   * - submittedCount นับเฉพาะผลที่ SUBMITTED แล้ว [BR-SCR-01]
   * - myStatus มาจากผลประเมินของ "ตัวเอง" เท่านั้น
   */
  async listApplicantsForEvaluator(
    roundId: number,
    evaluatorUser: User,
    query: ListApplicantsQueryDto,
  ): Promise<PaginatedApplicantList> {
    // 1) รอบต้องมีอยู่จริง และต้องเป็น OPEN
    //    ถ้าไม่เจอ หรือไม่ใช่ OPEN ให้ตอบ 404 เหมือนกันทั้งคู่
    //    เพื่อไม่ให้รู้ว่ามีรอบนั้นอยู่ในระบบหรือไม่ (ป้องกัน IDOR ตาม spec หัวข้อ 1.2)
    const openRound = await this.prismaService.scholarshipRound.findUnique({
      where: { id: roundId },
      select: { id: true, status: true },
    });
    if (openRound === null || openRound.status !== RoundStatus.OPEN) {
      throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    // 2) สร้างเงื่อนไขค้นหา: รหัสนักศึกษา หรือ ชื่อ / นามสกุล (ค้นบางส่วน) [FR-EVL-01]
    const where = this.buildSearchWhere(roundId, query.search);

    // 3) คำนวณการแบ่งหน้า
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    // 4) ดึงข้อมูลผู้สมัคร + จำนวนทั้งหมด พร้อมกัน (2 query ไม่ว่าจะมีกี่แถว -> ไม่มี N+1)
    //    ใช้ select ระบุฟิลด์เอง จึงไม่โหลดตาราง contact (เลขบัตร/เบอร์/อีเมล) มาเลย
    //    [FR-APP-03] [BR-APP-04] [BR-PDP-05]
    const [applicants, total] = await Promise.all([
      this.prismaService.applicant.findMany({
        where,
        // เรียงตามรหัสนักศึกษา แล้วตาม id กันกรณีค่าเท่ากัน
        // ทำให้ลำดับคงที่ เปลี่ยนหน้าแล้วไม่ได้แถวซ้ำ
        orderBy: [{ studentCode: 'asc' }, { id: 'asc' }],
        skip,
        take: limit,
        select: {
          id: true,
          roundId: true,
          legacySeq: true,
          studentCode: true,
          titlePrefix: true,
          firstName: true,
          lastName: true,
          faculty: true,
          major: true,
          studyYear: true,
          gpa: true,
          // นับเฉพาะผลที่ SUBMITTED (Draft ไม่นับ) และไม่ดึงคะแนน/ตัวตนผู้ประเมินอื่น [BR-SCR-01]
          _count: {
            select: {
              evaluations: { where: { status: EvaluationStatus.SUBMITTED } },
            },
          },
          // ดึงเฉพาะผลประเมินของ "ตัวเอง" และเอาแค่สถานะ
          evaluations: {
            where: { evaluatorId: evaluatorUser.id },
            select: { status: true },
          },
        },
      }),
      this.prismaService.applicant.count({ where }),
    ]);

    // 5) บัญชีหมดอายุแต่ยังเปิดอยู่หรือไม่ [FR-EVL-03] [BR-USR-11]
    const isEvaluatorExpired = this.isAccountExpired(evaluatorUser);

    // 6) แปลงเป็นรูปแบบที่ส่งให้ client (ระบุฟิลด์ทีละตัว ไม่ใช้ ...spread)
    const items: EvaluatorApplicantListItem[] = applicants.map((applicant) => {
      const myEvaluation = applicant.evaluations[0]; // มีได้สูงสุด 1 (unique evaluatorId+applicantId)
      let myStatus: MyEvaluationStatus = 'NOT_STARTED';
      if (myEvaluation !== undefined) {
        myStatus = myEvaluation.status; // 'DRAFT' หรือ 'SUBMITTED'
      }

      // canStart ตาม spec: false เมื่อบัญชีหมดอายุ และยังไม่มี Draft ของผู้สมัครคนนี้ [BR-USR-11]
      const hasDraft = myStatus === 'DRAFT';
      const canStart = !(isEvaluatorExpired && !hasDraft);

      return {
        id: applicant.id,
        roundId: applicant.roundId,
        legacySeq: applicant.legacySeq,
        studentCode: applicant.studentCode,
        titlePrefix: applicant.titlePrefix,
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        faculty: applicant.faculty,
        major: applicant.major,
        studyYear: applicant.studyYear,
        // gpa เป็น Decimal ใน Prisma -> แปลงเป็นตัวเลขตาม spec (type: number)
        gpa: Number(applicant.gpa),
        submittedCount: applicant._count.evaluations,
        myStatus,
        canStart,
      };
    });

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * สร้างเงื่อนไข where ของผู้สมัครในรอบ + คำค้นหา
   * - ค้นบางส่วน ไม่สนตัวพิมพ์เล็ก/ใหญ่ ในรหัสนักศึกษา ชื่อ หรือนามสกุล
   * - ถ้าพิมพ์ "ชื่อ นามสกุล" (มีช่องว่าง) จะค้นแบบชื่อ + นามสกุลคู่กันด้วย
   */
  private buildSearchWhere(
    roundId: number,
    search: string | undefined,
  ): Prisma.ApplicantWhereInput {
    const searchText = search === undefined ? '' : search.trim();
    if (searchText === '') {
      return { roundId };
    }

    const orConditions: Prisma.ApplicantWhereInput[] = [
      { studentCode: { contains: searchText, mode: 'insensitive' } },
      { firstName: { contains: searchText, mode: 'insensitive' } },
      { lastName: { contains: searchText, mode: 'insensitive' } },
    ];

    // กรณีค้นด้วยชื่อเต็ม เช่น "สมชาย ใจดี" -> ส่วนแรกเป็นชื่อ ส่วนที่เหลือเป็นนามสกุล
    const spaceIndex = searchText.indexOf(' ');
    if (spaceIndex > 0) {
      const firstNamePart = searchText.slice(0, spaceIndex);
      const lastNamePart = searchText.slice(spaceIndex + 1).trim();
      orConditions.push({
        AND: [
          { firstName: { contains: firstNamePart, mode: 'insensitive' } },
          { lastName: { contains: lastNamePart, mode: 'insensitive' } },
        ],
      });
    }

    return { roundId, OR: orConditions };
  }

  /** บัญชีหมดอายุแล้วหรือยัง (expiresAt เป็น null = ไม่มีวันหมดอายุ) [BR-USR-11] */
  private isAccountExpired(user: User): boolean {
    if (user.expiresAt === null) {
      return false;
    }
    return user.expiresAt.getTime() <= Date.now();
  }
}
