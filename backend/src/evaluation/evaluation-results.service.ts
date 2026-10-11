import { HttpStatus, Injectable } from '@nestjs/common';
import { EvaluationStatus } from '@prisma/client';
import { AppException } from '../common/exceptions/app.exception';
import { PrismaService } from '../prisma/prisma.service';
import { EvaluationResultsQueryDto } from './dto/evaluation-results-query.dto';
import { calculateFinalScore, FinalScore } from './final-score';

export interface ApplicantResultItem {
  rank: number;
  applicantId: number;
  studentCode: string;
  titlePrefix: string;
  firstName: string;
  lastName: string;
  faculty: string;
  major: string;
  studyYear: number;
  gpa: number;
  submittedCount: number;
  finalScore: FinalScore;
}

export interface RoundEvaluationSummary {
  totalApplicants: number;
  evaluatedApplicants: number;
  pendingApplicants: number;
  totalEvaluations: number;
}

export interface RoundEvaluationResultsData {
  round: {
    id: number;
    name: string;
    academicYear: number;
    semester: number;
    status: string;
  };
  summary: RoundEvaluationSummary;
  items: ApplicantResultItem[];
}

export interface RoundEvaluationResultsResponse {
  data: RoundEvaluationResultsData;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApplicantEvaluationItemDetail {
  subCriteriaId: number;
  title: string;
  type: string;
  maxScore: number | null;
  allowComment: boolean;
  score: number | null;
  comment: string | null;
  textValue: string | null;
}

export interface EvaluatorSubmissionDetail {
  evaluatorId: number;
  evaluatorName: string;
  evaluatorEmail: string;
  submittedAt: Date | null;
  totalScore: number | null;
  items: ApplicantEvaluationItemDetail[];
}

export interface ApplicantEvaluationResultsResponse {
  applicant: {
    id: number;
    roundId: number;
    studentCode: string;
    titlePrefix: string;
    firstName: string;
    lastName: string;
    faculty: string;
    major: string;
    studyYear: number;
    gpa: number;
  };
  round: {
    id: number;
    name: string;
    academicYear: number;
    semester: number;
    status: string;
  };
  finalScore: FinalScore;
  evaluations: EvaluatorSubmissionDetail[];
}

@Injectable()
export class EvaluationResultsService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * ดึงผลการประเมินและจัดอันดับของรอบทุนสำหรับ Admin [FR-SCR-01..05] [BR-SCR-01..05]
   * - นำเฉพาะผล SUBMITTED มาคำนวณ [BR-SCR-01]
   * - คำนวณค่าเฉลี่ยแบบ Equal Weight [BR-SCR-03]
   * - จัดอันดับ Tie-break: คะแนนเฉลี่ยจริง -> GPAX -> รหัสนักศึกษา [BR-SCR-05]
   */
  async getRoundEvaluationResults(
    roundId: number,
    query: EvaluationResultsQueryDto,
  ): Promise<RoundEvaluationResultsResponse> {
    const round = await this.prismaService.scholarshipRound.findUnique({
      where: { id: roundId },
      select: {
        id: true,
        name: true,
        academicYear: true,
        semester: true,
        status: true,
      },
    });

    if (!round) {
      throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    // 1) ดึงผู้สมัครทั้งหมดของรอบทุน พร้อมผลประเมินสถานะ SUBMITTED เท่านั้น [BR-SCR-01]
    const allApplicants = await this.prismaService.applicant.findMany({
      where: { roundId },
      select: {
        id: true,
        studentCode: true,
        titlePrefix: true,
        firstName: true,
        lastName: true,
        faculty: true,
        major: true,
        studyYear: true,
        gpa: true,
        evaluations: {
          where: { status: EvaluationStatus.SUBMITTED },
          select: {
            id: true,
            status: true,
            totalScore: true,
          },
        },
      },
    });

    // 2) คำนวณ finalScore ให้ผู้สมัครทุกคน
    const calculatedItems = allApplicants.map((applicant) => {
      const finalScore = calculateFinalScore(applicant.evaluations);
      return {
        applicantId: applicant.id,
        studentCode: applicant.studentCode,
        titlePrefix: applicant.titlePrefix,
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        faculty: applicant.faculty,
        major: applicant.major,
        studyYear: applicant.studyYear,
        gpa: Number(applicant.gpa),
        submittedCount: finalScore.count,
        finalScore,
      };
    });

    // 3) จัดอันดับทั้งรอบ (Global Ranking) ตาม BR-SCR-05
    // - ลำดับที่ 1: คะแนนเฉลี่ยจริงก่อนปัดเศษ (Raw average) มาก -> น้อย
    // - ลำดับที่ 2: GPAX มาก -> น้อย
    // - ลำดับที่ 3: รหัสนักศึกษา น้อย -> มาก (Alphabetical/Numeric ascending)
    calculatedItems.sort((a, b) => {
      if (b.finalScore.average !== a.finalScore.average) {
        return b.finalScore.average - a.finalScore.average;
      }
      if (b.gpa !== a.gpa) {
        return b.gpa - a.gpa;
      }
      return a.studentCode.localeCompare(b.studentCode);
    });

    // มอบหมายอันดับจริง (Rank)
    const rankedList: ApplicantResultItem[] = calculatedItems.map(
      (item, index) => ({
        ...item,
        rank: index + 1,
      }),
    );

    // 4) คำนวณสรุปสถิติของรอบ (Summary)
    const totalApplicants = rankedList.length;
    const evaluatedApplicants = rankedList.filter(
      (item) => item.submittedCount > 0,
    ).length;
    const pendingApplicants = totalApplicants - evaluatedApplicants;
    const totalEvaluations = rankedList.reduce(
      (acc, item) => acc + item.submittedCount,
      0,
    );

    const summary: RoundEvaluationSummary = {
      totalApplicants,
      evaluatedApplicants,
      pendingApplicants,
      totalEvaluations,
    };

    // 5) กรองข้อมูลตาม search และ faculty (ถ้ามี)
    let filteredList = rankedList;
    if (query.search && query.search.trim() !== '') {
      const s = query.search.trim().toLowerCase();
      filteredList = filteredList.filter(
        (item) =>
          item.studentCode.toLowerCase().includes(s) ||
          item.firstName.toLowerCase().includes(s) ||
          item.lastName.toLowerCase().includes(s),
      );
    }

    if (query.faculty && query.faculty.trim() !== '') {
      filteredList = filteredList.filter(
        (item) =>
          item.faculty.toLowerCase() === query.faculty?.trim().toLowerCase(),
      );
    }

    // 6) แบ่งหน้า (Pagination)
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const total = filteredList.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;
    const pagedData = filteredList.slice(skip, skip + limit);

    return {
      data: {
        round,
        summary,
        items: pagedData,
      },
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * ดึงรายละเอียดผลคะแนนรายบุคคล แยกตามผู้ประเมินแต่ละท่าน [FR-SCR-06]
   * - แสดงคะแนนย่อย, Comment, Text value เฉพาะผลที่มีสถานะ SUBMITTED เท่านั้น
   */
  async getApplicantEvaluationResults(
    applicantId: number,
  ): Promise<ApplicantEvaluationResultsResponse> {
    const applicant = await this.prismaService.applicant.findUnique({
      where: { id: applicantId },
      select: {
        id: true,
        roundId: true,
        studentCode: true,
        titlePrefix: true,
        firstName: true,
        lastName: true,
        faculty: true,
        major: true,
        studyYear: true,
        gpa: true,
        round: {
          select: {
            id: true,
            name: true,
            academicYear: true,
            semester: true,
            status: true,
          },
        },
        evaluations: {
          where: { status: EvaluationStatus.SUBMITTED },
          select: {
            id: true,
            evaluatorId: true,
            totalScore: true,
            status: true,
            submittedAt: true,
            evaluator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            items: {
              select: {
                id: true,
                subCriteriaId: true,
                score: true,
                comment: true,
                textValue: true,
                subCriteria: {
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

    if (!applicant) {
      throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    const finalScore = calculateFinalScore(
      applicant.evaluations.map((ev) => ({
        status: ev.status,
        totalScore: ev.totalScore,
      })),
    );

    const formattedEvaluations: EvaluatorSubmissionDetail[] =
      applicant.evaluations.map((ev) => {
        // จัดเรียง items ตาม sortOrder ของเกณฑ์ย่อย
        const sortedItems = [...ev.items].sort(
          (a, b) => a.subCriteria.sortOrder - b.subCriteria.sortOrder,
        );

        return {
          evaluatorId: ev.evaluator.id,
          evaluatorName: ev.evaluator.name,
          evaluatorEmail: ev.evaluator.email,
          submittedAt: ev.submittedAt,
          totalScore: ev.totalScore,
          items: sortedItems.map((item) => ({
            subCriteriaId: item.subCriteria.id,
            title: item.subCriteria.title,
            type: item.subCriteria.type,
            maxScore: item.subCriteria.maxScore,
            allowComment: item.subCriteria.allowComment,
            score: item.score,
            comment: item.comment,
            textValue: item.textValue,
          })),
        };
      });

    return {
      applicant: {
        id: applicant.id,
        roundId: applicant.roundId,
        studentCode: applicant.studentCode,
        titlePrefix: applicant.titlePrefix,
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        faculty: applicant.faculty,
        major: applicant.major,
        studyYear: applicant.studyYear,
        gpa: Number(applicant.gpa),
      },
      round: applicant.round,
      finalScore,
      evaluations: formattedEvaluations,
    };
  }
}
