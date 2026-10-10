import { HttpStatus, Injectable } from '@nestjs/common';
import {
  EvaluationStatus,
  RoundStatus,
  SubCriteriaType,
  User,
} from '@prisma/client';
import { AppException } from '../common/exceptions/app.exception';
import { PrismaService } from '../prisma/prisma.service';

/**
 * ข้อมูลประกอบการพิจารณาของผู้สมัคร (Evaluator ดูได้อย่างเดียว) [FR-APP-03]
 * ชื่อฟิลด์ตาม OpenAPI `ApplicantSupportingInfoDto` — ค่าว่างได้ทุกช่อง
 */
export interface ApplicantSupportingInfoView {
  applicationDate: string | null;
  accommodation: string | null;
  rent: string | null;
  personalExpense: string | null;
  studyEquipmentCost: string | null;
  electronicDevices: string | null;
  sideIncome: string | null;
  fatherAge: string | null;
  fatherOccupation: string | null;
  fatherIncome: string | null;
  fatherStatus: string | null;
  motherAge: string | null;
  motherOccupation: string | null;
  motherIncome: string | null;
  motherStatus: string | null;
  parentsStatus: string | null;
  tuitionPayer: string | null;
  guardianRelation: string | null;
  guardianOccupation: string | null;
  guardianIncome: string | null;
  siblingsWorking: string | null;
  siblingsNotWorking: string | null;
  siblingsStudying: string | null;
  studentLoan: string | null;
  previousScholarships: string | null;
  /** ลิงก์แผนที่ ส่งตามที่เก็บไว้ ให้ frontend ตัดสินใจเองว่ากดได้หรือไม่ [FR-APP-05] [BR-IMP-22] */
  accommodationMapUrl: string | null;
}

/**
 * รายละเอียดผู้สมัครที่ Evaluator เห็น (OpenAPI `ApplicantDetailDto`)
 * ไม่มีเลขบัตรประชาชน / โทรศัพท์ / อีเมล เด็ดขาด [FR-APP-03] [BR-APP-04] [BR-PDP-05]
 */
export interface EvaluatorApplicantDetail {
  id: number;
  roundId: number;
  importBatchId: number;
  legacySeq: number | null;
  studentCode: string;
  titlePrefix: string;
  firstName: string;
  lastName: string;
  faculty: string;
  major: string;
  studyYear: number;
  gpa: number;
  createdAt: Date;
  supportingInfo: ApplicantSupportingInfoView | null;
}

/** โครงสร้างเกณฑ์ย่อยที่ฝังในแต่ละข้อของแบบประเมิน (ไม่มี rubric) [FR-EVL-04] [FR-CRT-13] */
export interface EmbeddedSubCriteria {
  id: number;
  title: string;
  type: SubCriteriaType;
  maxScore: number | null;
  allowComment: boolean;
  sortOrder: number;
}

/** ผลประเมิน 1 ข้อ (OpenAPI `MyEvaluationItemDetailDto`) */
export interface MyEvaluationItemView {
  subCriteriaId: number;
  /** ยังไม่กรอก = null เสมอ ไม่ใช่ 0 [FR-EVL-07] */
  score: number | null;
  comment: string | null;
  textValue: string | null;
  subCriteria: EmbeddedSubCriteria;
}

/** ผลประเมินของตัวเอง (OpenAPI `MyEvaluationResponseDto`) [FR-EVL-14] */
export interface MyEvaluationView {
  /** null = ยังไม่เคยเริ่มประเมิน (ยังไม่มีแถวใน DB) */
  evaluationId: number | null;
  applicantId: number;
  /** null = ยังไม่เคยเริ่มประเมิน */
  status: EvaluationStatus | null;
  /** true = เป็น Draft ในรอบที่ปิดแล้ว (อ่านได้อย่างเดียว) */
  isLocked: boolean;
  totalScore: number | null;
  submittedAt: Date | null;
  updatedAt: Date | null;
  items: MyEvaluationItemView[];
}

/** รายละเอียดรอบทุนที่ Evaluator เห็น (OpenAPI `ScholarshipRoundDto`) */
export interface EvaluatorRoundDetail {
  id: number;
  name: string;
  academicYear: number;
  semester: number;
  criteriaId: number | null;
  status: RoundStatus;
  openedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service สำหรับ "อ่านอย่างเดียว" ของหน้าประเมินแบบแบ่งจอ (ฝั่ง Evaluator)
 * ห้ามสร้าง / แก้ไขข้อมูลใดๆ ในไฟล์นี้ (การบันทึกอยู่ใน Step ถัดไป)
 */
@Injectable()
export class EvaluationReadService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * GET /applicants/:id (มุมมอง Evaluator) [FR-APP-03] [BR-APP-04]
   * - ผู้สมัครต้องมีอยู่จริง และรอบต้อง OPEN ไม่งั้นตอบ 404 เหมือนกัน (กัน IDOR)
   */
  async getApplicantDetailForEvaluator(
    applicantId: number,
  ): Promise<EvaluatorApplicantDetail> {
    // ใช้ select ระบุฟิลด์เอง จึงไม่โหลดตาราง contact (เลขบัตร/เบอร์/อีเมล) เลย
    // [FR-APP-03] [BR-APP-04] [BR-PDP-05]
    const applicant = await this.prismaService.applicant.findUnique({
      where: { id: applicantId },
      select: {
        id: true,
        roundId: true,
        importBatchId: true,
        legacySeq: true,
        studentCode: true,
        titlePrefix: true,
        firstName: true,
        lastName: true,
        faculty: true,
        major: true,
        studyYear: true,
        gpa: true,
        createdAt: true,
        round: { select: { status: true } },
        supportingInfo: {
          select: {
            applicationDate: true,
            accommodation: true,
            rent: true,
            personalExpense: true,
            studyEquipmentCost: true,
            electronicDevices: true,
            sideIncome: true,
            fatherAge: true,
            fatherOccupation: true,
            fatherIncome: true,
            fatherStatus: true,
            motherAge: true,
            motherOccupation: true,
            motherIncome: true,
            motherStatus: true,
            parentsStatus: true,
            tuitionPayer: true,
            guardianRelation: true,
            guardianOccupation: true,
            guardianIncome: true,
            siblingsWorking: true,
            siblingsNotWorking: true,
            siblingsStudying: true,
            studentLoan: true,
            previousScholarships: true,
            accommodationMapUrl: true,
          },
        },
      },
    });

    // ไม่เจอ หรือรอบไม่ใช่ OPEN -> 404 แบบเดียวกัน [BR-EVL-01]
    if (applicant === null || applicant.round.status !== RoundStatus.OPEN) {
      throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    // ระบุฟิลด์ทีละตัว (ไม่ใช้ ...spread) เพื่อไม่ส่ง round.status ออกไปโดยไม่ตั้งใจ
    return {
      id: applicant.id,
      roundId: applicant.roundId,
      importBatchId: applicant.importBatchId,
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
      createdAt: applicant.createdAt,
      // ไม่มีข้อมูลประกอบ = null (ไม่สร้างค่าปลอมขึ้นมา)
      supportingInfo: applicant.supportingInfo,
    };
  }

  /**
   * GET /applicants/:applicantId/my-evaluation [FR-EVL-14] [BR-SCR-01]
   * - อ่านได้เฉพาะผลของ "ตัวเอง" (evaluatorId อยู่ใน WHERE ของ query)
   * - มีผลอยู่แล้ว: อ่านได้ทั้งรอบ OPEN และ CLOSED (ตาม spec)
   * - ยังไม่มีผล: รอบต้อง OPEN -> คืนแบบฟอร์มว่าง (ไม่สร้างแถวใน DB)
   * - รอบ DRAFT หรือไม่พบผู้สมัคร -> 404
   */
  async getMyEvaluation(
    applicantId: number,
    evaluatorUser: User,
  ): Promise<MyEvaluationView> {
    // 1) ผู้สมัคร + สถานะรอบ + เกณฑ์ย่อยของรอบ (เรียงตาม sortOrder) ใน query เดียว
    //    ไม่มีฟิลด์ rubric อยู่แล้วใน schema [FR-CRT-13]
    const applicant = await this.prismaService.applicant.findUnique({
      where: { id: applicantId },
      select: {
        id: true,
        round: {
          select: {
            status: true,
            criteria: {
              select: {
                subCriteria: {
                  orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
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
          },
        },
      },
    });

    // ไม่พบผู้สมัคร หรือรอบยังเป็น DRAFT -> 404 เสมอ
    if (applicant === null || applicant.round.status === RoundStatus.DRAFT) {
      throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    const roundStatus = applicant.round.status;

    // 2) ผลประเมินของ "ตัวเอง" เท่านั้น: ใส่ evaluatorId ของผู้เรียกใน WHERE เลย
    //    จึงไม่มีทางได้ข้อมูลของผู้ประเมินคนอื่นมา [BR-SCR-01]
    const myEvaluation = await this.prismaService.evaluation.findUnique({
      where: {
        evaluatorId_applicantId: {
          evaluatorId: evaluatorUser.id,
          applicantId: applicantId,
        },
      },
      select: {
        id: true,
        status: true,
        totalScore: true,
        submittedAt: true,
        updatedAt: true,
        items: {
          select: {
            subCriteriaId: true,
            score: true,
            comment: true,
            textValue: true,
          },
        },
      },
    });

    // 3) ยังไม่เคยประเมิน และรอบไม่ใช่ OPEN (คือ CLOSED) -> 404 (กัน IDOR)
    if (myEvaluation === null && roundStatus !== RoundStatus.OPEN) {
      throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    // 4) สร้างรายการข้อประเมินจากเกณฑ์ย่อยของรอบ ให้ครบทุกข้อตามลำดับ sortOrder [FR-EVL-04]
    //    ข้อที่ยังไม่กรอกคืน null (ไม่ใช่ 0) [FR-EVL-07]
    const subCriteriaList =
      applicant.round.criteria === null
        ? []
        : applicant.round.criteria.subCriteria;
    const savedItems = myEvaluation === null ? [] : myEvaluation.items;

    const items: MyEvaluationItemView[] = subCriteriaList.map((subCriteria) => {
      const savedItem = savedItems.find(
        (item) => item.subCriteriaId === subCriteria.id,
      );
      return {
        subCriteriaId: subCriteria.id,
        score: savedItem === undefined ? null : savedItem.score,
        comment: savedItem === undefined ? null : savedItem.comment,
        textValue: savedItem === undefined ? null : savedItem.textValue,
        subCriteria: {
          id: subCriteria.id,
          title: subCriteria.title,
          type: subCriteria.type,
          maxScore: subCriteria.maxScore,
          allowComment: subCriteria.allowComment,
          sortOrder: subCriteria.sortOrder,
        },
      };
    });

    // 5) กรณียังไม่เคยประเมิน (รอบ OPEN): คืนแบบฟอร์มว่าง ไม่สร้างแถวใน DB
    if (myEvaluation === null) {
      return {
        evaluationId: null,
        applicantId: applicant.id,
        status: null,
        isLocked: false,
        totalScore: null,
        submittedAt: null,
        updatedAt: null,
        items,
      };
    }

    // 6) มีผลอยู่แล้ว: Draft ในรอบที่ปิดแล้วถือว่าล็อก อ่านได้อย่างเดียว [FR-EVL-14]
    const isLocked =
      myEvaluation.status === EvaluationStatus.DRAFT &&
      roundStatus === RoundStatus.CLOSED;

    return {
      evaluationId: myEvaluation.id,
      applicantId: applicant.id,
      status: myEvaluation.status,
      isLocked,
      totalScore: myEvaluation.totalScore,
      submittedAt: myEvaluation.submittedAt,
      updatedAt: myEvaluation.updatedAt,
      items,
    };
  }

  /**
   * GET /scholarship-rounds/:id (มุมมอง Evaluator) [BR-EVL-01]
   * - รอบต้องมีอยู่จริงและเป็น OPEN ไม่งั้นตอบ 404 เหมือนกัน (กัน IDOR)
   */
  async getRoundForEvaluator(roundId: number): Promise<EvaluatorRoundDetail> {
    const openRound = await this.prismaService.scholarshipRound.findUnique({
      where: { id: roundId },
      select: {
        id: true,
        name: true,
        academicYear: true,
        semester: true,
        criteriaId: true,
        status: true,
        openedAt: true,
        closedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (openRound === null || openRound.status !== RoundStatus.OPEN) {
      throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    return openRound;
  }
}
