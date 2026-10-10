import { HttpStatus, Injectable } from '@nestjs/common';
import {
  AuditAction,
  EvaluationStatus,
  RoundStatus,
  SubCriteriaType,
  User,
} from '@prisma/client';
import { AppException } from '../common/exceptions/app.exception';
import { PrismaService } from '../prisma/prisma.service';
import {
  EvaluationItemScoreDto,
  SaveMyEvaluationDto,
} from './dto/save-my-evaluation.dto';
import {
  EmbeddedSubCriteria,
  MyEvaluationItemView,
  MyEvaluationView,
} from './evaluation-read.service';
import { sumScoredTotal } from './score-total';

/** เกณฑ์ย่อยของรอบที่โหลดมาเพื่อใช้ตรวจ body และสร้าง response */
interface SubCriteriaRow {
  id: number;
  title: string;
  type: SubCriteriaType;
  maxScore: number | null;
  allowComment: boolean;
  sortOrder: number;
}

/** ค่าที่บันทึกไว้แล้วใน evaluation_items */
interface StoredItemRow {
  subCriteriaId: number;
  score: number | null;
  comment: string | null;
  textValue: string | null;
}

/** แถว evaluations ที่ใช้สร้าง response */
interface EvaluationRow {
  id: number;
  status: EvaluationStatus;
  totalScore: number | null;
  submittedAt: Date | null;
  updatedAt: Date;
}

/** ฟิลด์ที่อ่านจาก evaluations ทุกครั้ง (ใช้ร่วมกันทุก query) */
const EVALUATION_SELECT = {
  id: true,
  status: true,
  totalScore: true,
  submittedAt: true,
  updatedAt: true,
} as const;

/** select เกณฑ์ย่อยเรียงตาม sortOrder เหมือนกับ API อ่านอย่างเดียว */
const SUB_CRITERIA_ORDER_BY = [
  { sortOrder: 'asc' as const },
  { id: 'asc' as const },
];

/** ค่า comment/textValue ว่างเปล่า = ไม่มีค่า (null) เพื่อให้เทียบกับ DB ได้คงที่ */
function normalizeText(value: string | null | undefined): string | null {
  return value === undefined || value === '' ? null : value;
}

/**
 * Service ฝั่งเขียนของหน้าประเมิน: บันทึก Draft (PUT) และ Submit (POST)
 *
 * หลักการสำคัญ:
 * - ทั้ง save และ submit ทำใน transaction เดียว (all-or-nothing) [FR-EVL-04]
 * - ทุก query ใส่ evaluatorId ของผู้เรียกใน WHERE เสมอ ไม่มีทางอ่าน/คืนข้อมูลของ
 *   ผู้ประเมินคนอื่น [FR-SCR-02] [BR-SCR-01] (peer-blind)
 * - ลำดับตรวจตาม REST API spec Module 6: 404 (IDOR) -> รอบ -> สถานะ -> ตรวจค่า
 * - ใช้ AppException + envelope ของ common/ ตามเดิม ไม่สร้างของใหม่
 */
@Injectable()
export class EvaluationWriteService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * PUT /applicants/:applicantId/my-evaluation — Auto-save / Upsert Draft [FR-EVL-04]
   *
   * ลำดับตรวจ (ตาม spec Module 6):
   *  1. ผู้สมัครไม่มี หรือ รอบ DRAFT            -> 404 NOT_FOUND (IDOR)
   *  2. รอบ CLOSED: มีแถวเดิม -> 409 ROUND_CLOSED / ไม่มี -> 404 (MSG-19)
   *  3. เคย SUBMITTED แล้ว                      -> 409 ALREADY_EVALUATED (MSG-17)
   *  4. บัญชีหมดอายุ + ยังไม่มีแถว -> 422 EVALUATOR_EXPIRED_NEW_APPLICANT (MSG-18)
   *  5. ตรวจค่า items (400 / 422 SCORE_OUT_OF_RANGE MSG-15)
   *  6. payload เท่ากับ DB ทุกฟิลด์ -> ไม่เขียน ไม่ขยับ updatedAt (no-op ตาม spec)
   */
  async saveMyEvaluation(
    applicantId: number,
    evaluatorUser: User,
    dto: SaveMyEvaluationDto,
  ): Promise<MyEvaluationView> {
    // 1) ผู้สมัคร + สถานะรอบ + เกณฑ์ย่อยของรอบ ใน query เดียว
    const applicant = await this.prismaService.applicant.findUnique({
      where: { id: applicantId },
      select: {
        id: true,
        roundId: true,
        round: {
          select: {
            status: true,
            criteria: {
              select: {
                subCriteria: {
                  orderBy: SUB_CRITERIA_ORDER_BY,
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

    // ไม่พบผู้สมัคร หรือรอบยังเป็น DRAFT -> 404 แบบเดียวกันทุกกรณี (กัน IDOR)
    if (applicant === null || applicant.round.status === RoundStatus.DRAFT) {
      throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    const roundStatus = applicant.round.status;
    const subCriteriaList: SubCriteriaRow[] =
      applicant.round.criteria === null
        ? []
        : applicant.round.criteria.subCriteria;

    // 2) ผลประเมินของ "ตัวเอง" เท่านั้น: ใส่ evaluatorId ของผู้เรียกใน WHERE
    //    จึงไม่มีทางเห็นข้อมูลของผู้ประเมินคนอื่น [BR-SCR-01]
    const existing = await this.prismaService.evaluation.findUnique({
      where: {
        evaluatorId_applicantId: {
          evaluatorId: evaluatorUser.id,
          applicantId: applicantId,
        },
      },
      select: {
        ...EVALUATION_SELECT,
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

    // 3) รอบปิด: เกณฑ์ของ spec — มี Draft เดิม -> 409 ROUND_CLOSED (MSG-19) [BR-EVL-12]
    //    ไม่มีแถวเลย -> 404 (ตอบเหมือนไม่พบ ไม่ยืนยันว่ามีผู้สมัคร)
    if (roundStatus === RoundStatus.CLOSED) {
      if (existing !== null) {
        throw new AppException('ROUND_CLOSED', HttpStatus.CONFLICT);
      }
      throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    // 4) Submit แล้ว -> ห้ามแก้ทั้ง save และ submit (MSG-17) [BR-EVL-02] [BR-EVL-09]
    if (existing !== null && existing.status === EvaluationStatus.SUBMITTED) {
      throw new AppException('ALREADY_EVALUATED', HttpStatus.CONFLICT);
    }

    // 5) บัญชีหมดอายุแต่ยังเปิดใช้งาน: เริ่มประเมินผู้สมัครใหม่ไม่ได้
    //    แต่แก้ Draft เดิมต่อได้ตาม BR-USR-11 (MSG-18)
    if (existing === null && this.isAccountExpired(evaluatorUser)) {
      throw new AppException(
        'EVALUATOR_EXPIRED_NEW_APPLICANT',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // 6) ตรวจค่า items ทุกข้อก่อนเขียนอะไรทั้งนั้น (all-or-nothing)
    this.validateItems(dto.items, subCriteriaList);

    // 7) No-op: payload ตรงกับ DB ทุกฟิลด์ -> ตอบ 200 โดยไม่เขียน DB
    //    และไม่ขยับ updatedAt (ตาม spec Module 6; ตรงกับ BR-EVL-06 ที่เรียกซ้ำได้)
    if (existing !== null && !this.hasChanges(existing.items, dto.items)) {
      return this.buildView(
        applicantId,
        existing,
        subCriteriaList,
        this.mergeItems(subCriteriaList, existing.items, dto.items),
        roundStatus,
      );
    }

    // 8) บันทึกทั้ง evaluation และ items ใน transaction เดียว [FR-EVL-04]
    const evaluation = await this.prismaService.$transaction(async (tx) => {
      // สร้าง Draft ครั้งแรก หรืออัปเดตแถวเดิม (upsert) พร้อมขยับ updatedAt
      // [FR-EVL-04] [FR-EVL-08] [BR-EVL-06]
      const evaluationRow =
        existing === null
          ? await tx.evaluation.create({
              data: {
                applicantId: applicantId,
                evaluatorId: evaluatorUser.id,
                status: EvaluationStatus.DRAFT,
              },
              select: EVALUATION_SELECT,
            })
          : await tx.evaluation.update({
              where: { id: existing.id },
              data: { updatedAt: new Date() },
              select: EVALUATION_SELECT,
            });

      for (const item of dto.items) {
        const updateData: {
          score?: number | null;
          comment?: string | null;
          textValue?: string | null;
        } = {};
        // ฟิลด์ที่ "ไม่ได้ส่ง" (undefined) ห้ามแตะ ส่วน null = ล้างค่า
        if (item.score !== undefined) {
          updateData.score = item.score ?? null; // null ไม่ใช่ 0 [BR-EVL-07]
        }
        if (item.comment !== undefined) {
          updateData.comment = normalizeText(item.comment);
        }
        if (item.textValue !== undefined) {
          updateData.textValue = normalizeText(item.textValue);
        }
        // ข้อที่ส่งมาเฉพาะ subCriteriaId (ไม่มีฟิลด์อะไรเลย) ไม่ต้องเขียน
        if (Object.keys(updateData).length === 0) {
          continue;
        }
        // upsert = เรียกซ้ำกี่ครั้งก็ได้ ไม่สร้างแถวซ้ำ (unique evaluationId+subCriteriaId)
        await tx.evaluationItem.upsert({
          where: {
            evaluationId_subCriteriaId: {
              evaluationId: evaluationRow.id,
              subCriteriaId: item.subCriteriaId,
            },
          },
          create: {
            evaluationId: evaluationRow.id,
            subCriteriaId: item.subCriteriaId,
            score: updateData.score ?? null,
            comment: updateData.comment ?? null,
            textValue: updateData.textValue ?? null,
          },
          update: updateData,
        });
      }
      return evaluationRow;
    });

    // 9) สร้าง response รูปเดียวกับ GET my-evaluation โดยไม่ต้อง query ซ้ำ
    const storedItems: StoredItemRow[] =
      existing === null ? [] : existing.items;
    return this.buildView(
      applicantId,
      evaluation,
      subCriteriaList,
      this.mergeItems(subCriteriaList, storedItems, dto.items),
      roundStatus,
    );
  }

  /**
   * POST /applicants/:applicantId/my-evaluation/submit [FR-EVL-11] [FR-EVL-13] [FR-EVL-15]
   *
   * ทำใน transaction เดียวพร้อม lock แถวรอบแบบ FOR SHARE (ตาม spec):
   *  1. ผู้สมัครไม่มี / รอบ DRAFT                     -> 404 (IDOR)
   *  2. lock แถวรอบ แล้วอ่านสถานะใหม่
   *  3. รอบไม่ใช่ OPEN: CLOSED + มีแถว -> 409 ROUND_CLOSED / อื่นๆ -> 404 (MSG-19)
   *  4. ยังไม่เคยมีแถว                              -> 404
   *  5. เคย SUBMITTED แล้ว                          -> 409 ALREADY_EVALUATED (MSG-17)
   *  6. กรอก SCORED ไม่ครบ                           -> 422 SCORES_INCOMPLETE (MSG-16)
   *  7. ตั้ง SUBMITTED + totalScore + submittedAt + AuditLog ใน tx เดียวกัน
   */
  async submitMyEvaluation(
    applicantId: number,
    evaluatorUser: User,
  ): Promise<MyEvaluationView> {
    return this.prismaService.$transaction(async (tx) => {
      // 1) ต้องรู้ roundId ก่อนเพื่อจะ lock — ผู้สมัคร/รอบ DRAFT -> 404
      const applicant = await tx.applicant.findUnique({
        where: { id: applicantId },
        select: { id: true, roundId: true },
      });
      if (applicant === null) {
        throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
      }

      // 2) Lock แถวรอบทุนแบบ pessimistic (FOR SHARE) ก่อนตรวจสถานะ
      //    กันไม่ให้ Admin ปิดรอบพร้อมกับที่เรากด Submit (ตาม spec Module 6)
      await tx.$queryRaw`SELECT id FROM scholarship_rounds WHERE id = ${applicant.roundId} FOR SHARE`;

      // 3) อ่านสถานะรอบ + เกณฑ์ย่อยใหม่หลังได้ lock แล้ว (ค่าล่าสุดจริง)
      const round = await tx.scholarshipRound.findUnique({
        where: { id: applicant.roundId },
        select: {
          status: true,
          criteria: {
            select: {
              subCriteria: {
                orderBy: SUB_CRITERIA_ORDER_BY,
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
      });
      const roundStatus = round === null ? RoundStatus.DRAFT : round.status;
      const subCriteriaList: SubCriteriaRow[] =
        round === null || round.criteria === null
          ? []
          : round.criteria.subCriteria;

      // 4) ผลของ "ตัวเอง" เท่านั้น (peer-blind) [BR-SCR-01]
      const evaluation = await tx.evaluation.findUnique({
        where: {
          evaluatorId_applicantId: {
            evaluatorId: evaluatorUser.id,
            applicantId: applicantId,
          },
        },
        select: {
          ...EVALUATION_SELECT,
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

      // 5) รอบไม่ใช่ OPEN (ตรวจก่อนสถานะผลประเมิน ตาม spec):
      //    CLOSED + มี Draft เดิม -> 409 ROUND_CLOSED (MSG-19) [BR-EVL-12] [BR-RND-13]
      //    ไม่มีแถว / รอบ DRAFT -> 404 (ตอบเหมือนไม่พบ กัน IDOR)
      if (roundStatus !== RoundStatus.OPEN) {
        if (roundStatus === RoundStatus.CLOSED && evaluation !== null) {
          throw new AppException('ROUND_CLOSED', HttpStatus.CONFLICT);
        }
        throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
      }

      // ยังไม่เคยเริ่มประเมิน -> ไม่มีอะไรให้ส่ง ตอบ 404 เหมือนไม่พบ
      if (evaluation === null) {
        throw new AppException('NOT_FOUND', HttpStatus.NOT_FOUND);
      }

      // 6) เคย Submit แล้ว -> ห้ามซ้ำ (MSG-17) [BR-EVL-02]
      if (evaluation.status === EvaluationStatus.SUBMITTED) {
        throw new AppException('ALREADY_EVALUATED', HttpStatus.CONFLICT);
      }

      // 7) ต้องกรอกคะแนนครบทุกข้อ SCORED เท่านั้น Comment/TEXT ไม่บังคับ
      //    ขาดแม้แต่ข้อเดียว -> 422 SCORES_INCOMPLETE พร้อมรายชื่อหัวข้อ (MSG-16) [BR-EVL-11]
      const storedById = new Map(
        evaluation.items.map((item) => [item.subCriteriaId, item]),
      );
      const missingTitles: string[] = [];
      for (const subCriteria of subCriteriaList) {
        if (subCriteria.type !== SubCriteriaType.SCORED) {
          continue;
        }
        const stored = storedById.get(subCriteria.id);
        if (stored === undefined || stored.score === null) {
          missingTitles.push(subCriteria.title);
        }
      }
      if (missingTitles.length > 0) {
        throw new AppException(
          'SCORES_INCOMPLETE',
          HttpStatus.UNPROCESSABLE_ENTITY,
          { items: missingTitles },
        );
      }

      // คะแนนรวม = ผลรวมเฉพาะ SCORED เท่านั้น (TEXT ไม่นับ) [FR-SCR-02] [BR-SCR-02]
      const totalScore = sumScoredTotal(
        subCriteriaList.map((subCriteria) => ({
          type: subCriteria.type,
          score: storedById.get(subCriteria.id)?.score ?? null,
        })),
      );

      // 8) ล็อกผลถาวร + Audit Log ใน transaction เดียวกัน [FR-EVL-13] [BR-EVL-12]
      const updated = await tx.evaluation.update({
        where: { id: evaluation.id },
        data: {
          status: EvaluationStatus.SUBMITTED,
          totalScore: totalScore,
          submittedAt: new Date(),
        },
        select: EVALUATION_SELECT,
      });

      // [FR-EVL-15] [BR-PDP-01] บันทึก Audit Log เมื่อ Submit เท่านั้น
      await tx.auditLog.create({
        data: {
          actorId: evaluatorUser.id,
          action: AuditAction.EVALUATION_SUBMIT,
          entityType: 'Evaluation',
          entityId: String(evaluation.id),
          roundId: applicant.roundId,
          // BR-PDP-02: บันทึกค่าเดิม/ค่าใหม่ของการเปลี่ยนสถานะ
          oldValue: { status: EvaluationStatus.DRAFT },
          newValue: { status: EvaluationStatus.SUBMITTED, totalScore },
        },
      });

      return this.buildView(
        applicantId,
        updated,
        subCriteriaList,
        evaluation.items,
        RoundStatus.OPEN,
      );
    });
  }

  /** บัญชีหมดอายุ = expiresAt อยู่ในอดีต (ยัง active อยู่เพราะผ่าน MockAuthGuard มาแล้ว) [BR-USR-11] */
  private isAccountExpired(user: User): boolean {
    return user.expiresAt !== null && user.expiresAt.getTime() < Date.now();
  }

  /**
   * ตรวจค่า items ทุกข้อก่อนเขียนข้อมูล (โยนข้อแรกที่เจอ)
   * กรณีที่ spec ไม่มี errorCode กำกับใช้ 400 BAD_REQUEST + params.messages
   * ตามแนวทางเดียวกับ ValidationPipe ใน Step 2
   */
  private validateItems(
    items: EvaluationItemScoreDto[],
    subCriteriaList: SubCriteriaRow[],
  ): void {
    const subCriteriaById = new Map(
      subCriteriaList.map((subCriteria) => [subCriteria.id, subCriteria]),
    );

    for (const item of items) {
      // (ก) id ที่ไม่อยู่ในเกณฑ์ของรอบนี้ -> 400 (spec ไม่มีรหัสเฉพาะ)
      const subCriteria = subCriteriaById.get(item.subCriteriaId);
      if (subCriteria === undefined) {
        throw new AppException('BAD_REQUEST', HttpStatus.BAD_REQUEST, {
          messages: [`items: ไม่มีเกณฑ์ย่อย id ${item.subCriteriaId} ในรอบนี้`],
        });
      }

      // (ข) ห้ามส่ง comment ไปที่ข้อที่ allowComment = false [FR-EVL-06] [BR-EVL-04]
      if (
        item.comment !== undefined &&
        normalizeText(item.comment) !== null &&
        !subCriteria.allowComment
      ) {
        throw new AppException('BAD_REQUEST', HttpStatus.BAD_REQUEST, {
          messages: [`items: หัวข้อ "${subCriteria.title}" ไม่เปิดรับ Comment`],
        });
      }

      // (ค) ห้ามส่ง score ไปที่เกณฑ์ย่อยแบบ TEXT [FR-EVL-05]
      if (
        item.score !== undefined &&
        item.score !== null &&
        subCriteria.type !== SubCriteriaType.SCORED
      ) {
        throw new AppException('BAD_REQUEST', HttpStatus.BAD_REQUEST, {
          messages: [`items: หัวข้อ "${subCriteria.title}" ไม่มีคะแนน`],
        });
      }

      // (ง) score ต้องเป็นจำนวนเต็ม 0 ถึง maxScore ไม่งั้น 422 SCORE_OUT_OF_RANGE
      //     ครอบคลุมทั้งค่าติดลบ เกินเต็ม ทศนิยม และไม่ใช่ตัวเลข [FR-EVL-05] [BR-EVL-03] (MSG-15)
      if (
        item.score !== undefined &&
        item.score !== null &&
        subCriteria.type === SubCriteriaType.SCORED
      ) {
        const score = item.score;
        if (
          typeof score !== 'number' ||
          !Number.isInteger(score) ||
          score < 0 ||
          subCriteria.maxScore === null ||
          score > subCriteria.maxScore
        ) {
          throw new AppException(
            'SCORE_OUT_OF_RANGE',
            HttpStatus.UNPROCESSABLE_ENTITY,
            { max: subCriteria.maxScore },
          );
        }
      }

      // (จ) ห้ามส่ง textValue ไปที่เกณฑ์ย่อยแบบ SCORED [FR-EVL-06]
      if (
        item.textValue !== undefined &&
        normalizeText(item.textValue) !== null &&
        subCriteria.type !== SubCriteriaType.TEXT
      ) {
        throw new AppException('BAD_REQUEST', HttpStatus.BAD_REQUEST, {
          messages: [
            `items: หัวข้อ "${subCriteria.title}" ไม่ใช่เกณฑ์ย่อยแบบข้อความ`,
          ],
        });
      }
    }
  }

  /**
   * ตรวจว่า payload มีฟิลด์ไหนเปลี่ยนจากที่บันทึกไว้หรือไม่
   * ฟิลด์ที่ "ไม่ได้ส่งมา" ถือว่าไม่เปลี่ยน (ส่งเฉพาะส่วนที่แก้ก็ได้)
   */
  private hasChanges(
    storedItems: StoredItemRow[],
    items: EvaluationItemScoreDto[],
  ): boolean {
    const storedById = new Map(
      storedItems.map((item) => [item.subCriteriaId, item]),
    );

    return items.some((item) => {
      const stored = storedById.get(item.subCriteriaId);
      const currentScore = stored?.score ?? null;
      const currentComment = stored?.comment ?? null;
      const currentTextValue = stored?.textValue ?? null;

      if (item.score !== undefined && (item.score ?? null) !== currentScore) {
        return true;
      }
      if (
        item.comment !== undefined &&
        normalizeText(item.comment) !== currentComment
      ) {
        return true;
      }
      if (
        item.textValue !== undefined &&
        normalizeText(item.textValue) !== currentTextValue
      ) {
        return true;
      }
      return false;
    });
  }

  /**
   * รวมค่าที่บันทึกไว้เดิมกับค่าใน payload เพื่อสร้าง response
   * ข้อที่ไม่ได้ส่งมาคงค่าเดิม ข้อที่ส่งมาใช้ค่าใหม่ (รายการซ้ำ รายการหลังชนะ)
   */
  private mergeItems(
    subCriteriaList: SubCriteriaRow[],
    storedItems: StoredItemRow[],
    items: EvaluationItemScoreDto[],
  ): StoredItemRow[] {
    const storedById = new Map(
      storedItems.map((item) => [item.subCriteriaId, item]),
    );
    const sentById = new Map(items.map((item) => [item.subCriteriaId, item]));

    return subCriteriaList.map((subCriteria) => {
      const stored = storedById.get(subCriteria.id);
      const sent = sentById.get(subCriteria.id);
      const merged: StoredItemRow = {
        subCriteriaId: subCriteria.id,
        score: stored?.score ?? null,
        comment: stored?.comment ?? null,
        textValue: stored?.textValue ?? null,
      };
      if (sent === undefined) {
        return merged;
      }
      return {
        subCriteriaId: subCriteria.id,
        score: sent.score === undefined ? merged.score : (sent.score ?? null),
        comment:
          sent.comment === undefined
            ? merged.comment
            : normalizeText(sent.comment),
        textValue:
          sent.textValue === undefined
            ? merged.textValue
            : normalizeText(sent.textValue),
      };
    });
  }

  /** สร้าง response รูปเดียวกับ GET my-evaluation (OpenAPI MyEvaluationResponseDto) */
  private buildView(
    applicantId: number,
    evaluation: EvaluationRow,
    subCriteriaList: SubCriteriaRow[],
    storedItems: StoredItemRow[],
    roundStatus: RoundStatus,
  ): MyEvaluationView {
    const storedById = new Map(
      storedItems.map((item) => [item.subCriteriaId, item]),
    );

    const items: MyEvaluationItemView[] = subCriteriaList.map((subCriteria) => {
      const stored = storedById.get(subCriteria.id);
      const embedded: EmbeddedSubCriteria = {
        id: subCriteria.id,
        title: subCriteria.title,
        type: subCriteria.type,
        maxScore: subCriteria.maxScore,
        allowComment: subCriteria.allowComment,
        sortOrder: subCriteria.sortOrder,
      };
      return {
        subCriteriaId: subCriteria.id,
        // ยังไม่กรอกคืน null เสมอ ไม่ใช่ 0 [FR-EVL-07] [BR-EVL-07]
        score: stored?.score ?? null,
        comment: stored?.comment ?? null,
        textValue: stored?.textValue ?? null,
        subCriteria: embedded,
      };
    });

    // Draft ในรอบที่ปิดแล้ว = อ่านอย่างเดียว (กรณีนี้ถูกปฏิเสธไปก่อนแล้ว)
    const isLocked =
      evaluation.status === EvaluationStatus.DRAFT &&
      roundStatus === RoundStatus.CLOSED;

    return {
      evaluationId: evaluation.id,
      applicantId: applicantId,
      status: evaluation.status,
      isLocked: isLocked,
      // คะแนนรวม Draft ยังไม่ทางการ (ค้าง null จนกว่าจะ Submit) [BR-EVL-10]
      totalScore: evaluation.totalScore,
      submittedAt: evaluation.submittedAt,
      updatedAt: evaluation.updatedAt,
      items: items,
    };
  }
}
