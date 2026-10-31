/**
 * Unit test ของ EvaluationWriteService (บันทึก Draft + Submit)
 * ไม่ต่อฐานข้อมูลจริง ใช้ mock PrismaService ทั้งแบบปกติและใน transaction
 * [FR-EVL-04] [FR-EVL-05] [FR-EVL-06] [FR-EVL-07] [FR-EVL-08] [FR-EVL-11]
 * [FR-EVL-13] [FR-EVL-15] [BR-EVL-02] [BR-EVL-03] [BR-EVL-11] [BR-SCR-01]
 * [BR-SCR-02] [BR-USR-11]
 */
import {
  AuditAction,
  EvaluationStatus,
  RoundStatus,
  SubCriteriaType,
  User,
  UserRole,
} from '@prisma/client';
import { AppException } from '../common/exceptions/app.exception';
import { PrismaService } from '../prisma/prisma.service';
import { EvaluationWriteService } from './evaluation-write.service';

// ---------------------------------------------------------------------------
// ข้อมูลเกณฑ์ย่อยปลอม: 3 ข้อ SCORED (40+30+30) + 1 ข้อ TEXT
// ข้อ 1/2 ไม่เปิดรับ comment ข้อ 3 เปิดรับ [FR-EVL-06]
// ---------------------------------------------------------------------------
const SUB_CRITERIA_LIST = [
  {
    id: 1,
    title: 'สถานะทางครอบครัวและรายได้ครัวเรือน',
    type: SubCriteriaType.SCORED,
    maxScore: 40,
    allowComment: false,
    sortOrder: 1,
  },
  {
    id: 2,
    title: 'ผลการเรียนเฉลี่ยสะสม (GPA)',
    type: SubCriteriaType.SCORED,
    maxScore: 30,
    allowComment: false,
    sortOrder: 2,
  },
  {
    id: 3,
    title: 'กิจกรรมและความประพฤติ',
    type: SubCriteriaType.SCORED,
    maxScore: 30,
    allowComment: true,
    sortOrder: 3,
  },
  {
    id: 4,
    title: 'ข้อความเพิ่มเติม',
    type: SubCriteriaType.TEXT,
    maxScore: null,
    allowComment: false,
    sortOrder: 4,
  },
];

// ---------------------------------------------------------------------------
// mock PrismaService: ทั้งแบบเรียกตรงและแบบอยู่ใน $transaction
// ---------------------------------------------------------------------------
const applicantFindUniqueMock = jest.fn();
const evaluationFindUniqueMock = jest.fn();
const roundFindUniqueMock = jest.fn();
const evaluationCreateMock = jest.fn();
const evaluationUpdateMock = jest.fn();
const evaluationItemUpsertMock = jest.fn();
const auditLogCreateMock = jest.fn();
const queryRawMock = jest.fn();
const transactionMock = jest.fn();

// callback ที่ service ส่งเข้า $transaction จะถูกเรียกด้วย tx mock ตัวนี้
const txMock = {
  applicant: { findUnique: applicantFindUniqueMock },
  scholarshipRound: { findUnique: roundFindUniqueMock },
  evaluation: {
    findUnique: evaluationFindUniqueMock,
    create: evaluationCreateMock,
    update: evaluationUpdateMock,
  },
  evaluationItem: { upsert: evaluationItemUpsertMock },
  auditLog: { create: auditLogCreateMock },
  $queryRaw: queryRawMock,
};

const mockPrismaService = {
  applicant: { findUnique: applicantFindUniqueMock },
  evaluation: { findUnique: evaluationFindUniqueMock },
  $transaction: transactionMock,
} as unknown as PrismaService;

// ---------------------------------------------------------------------------
// แถวข้อมูลปลอม
// ---------------------------------------------------------------------------
function createApplicantRow(roundStatus: RoundStatus) {
  return {
    id: 1,
    roundId: 2,
    round: {
      status: roundStatus,
      criteria: { subCriteria: SUB_CRITERIA_LIST },
    },
  };
}

function createOpenRoundRow() {
  return {
    status: RoundStatus.OPEN,
    criteria: { subCriteria: SUB_CRITERIA_LIST },
  };
}

function createEvaluatorUser(overrides: Partial<User> = {}): User {
  return {
    id: 2,
    email: 'evaluator1@kku.ac.th',
    name: 'ศ.ดร. กรรมการ ประเมินทุน 1',
    role: UserRole.EVALUATOR,
    isActive: true,
    expiresAt: null,
    createdAt: new Date('2026-10-04T00:00:00.000Z'),
    updatedAt: new Date('2026-10-04T00:00:00.000Z'),
    ...overrides,
  };
}

const SAVED_AT = new Date('2026-10-07T10:00:00.000Z');

// Draft ของ evaluator 2 สำหรับผู้สมัคร 1: กรอกข้อ 1 = 30 ไว้แล้ว
const DRAFT_OF_EVALUATOR_2 = {
  id: 501,
  status: EvaluationStatus.DRAFT,
  totalScore: null,
  submittedAt: null,
  updatedAt: SAVED_AT,
  items: [
    { subCriteriaId: 1, score: 30, comment: null, textValue: null },
    {
      subCriteriaId: 3,
      score: null,
      comment: 'มีใบรับรองชมรม',
      textValue: null,
    },
  ],
};

const SUBMITTED_EVALUATION = {
  id: 502,
  status: EvaluationStatus.SUBMITTED,
  totalScore: 100,
  submittedAt: new Date('2026-10-06T08:00:00.000Z'),
  updatedAt: new Date('2026-10-06T08:00:00.000Z'),
  items: [
    { subCriteriaId: 1, score: 40, comment: null, textValue: null },
    { subCriteriaId: 2, score: 30, comment: null, textValue: null },
    { subCriteriaId: 3, score: 30, comment: null, textValue: null },
  ],
};

const NEW_DRAFT_ROW = {
  id: 600,
  status: EvaluationStatus.DRAFT,
  totalScore: null,
  submittedAt: null,
  updatedAt: new Date('2026-10-07T12:00:00.000Z'),
};

const UPDATED_DRAFT_ROW = {
  id: 501,
  status: EvaluationStatus.DRAFT,
  totalScore: null,
  submittedAt: null,
  updatedAt: new Date('2026-10-07T12:30:00.000Z'),
};

const SUBMITTED_RESULT_ROW = {
  id: 501,
  status: EvaluationStatus.SUBMITTED,
  totalScore: 75,
  submittedAt: new Date('2026-10-07T13:00:00.000Z'),
  updatedAt: new Date('2026-10-07T13:00:00.000Z'),
};

// แถวของ evaluator อีกคน (id 3) — ห้ามแตะเด็ดขาด [BR-SCR-01]
const DRAFT_OF_EVALUATOR_3 = {
  id: 700,
  status: EvaluationStatus.DRAFT,
  totalScore: null,
  submittedAt: null,
  updatedAt: SAVED_AT,
  items: [
    {
      subCriteriaId: 1,
      score: 11,
      comment: 'ความลับของ evaluator คนอื่น',
      textValue: null,
    },
  ],
};

// จำลองตาราง evaluations ตาม evaluatorId ที่อยู่ใน WHERE จริงๆ (peer-blind)
interface EvaluationFindUniqueArgs {
  where: {
    evaluatorId_applicantId: { evaluatorId: number; applicantId: number };
  };
}
function fakeEvaluationTable(args: EvaluationFindUniqueArgs) {
  const { evaluatorId, applicantId } = args.where.evaluatorId_applicantId;
  if (evaluatorId === 2 && applicantId === 1) {
    return Promise.resolve(null); // evaluator 2 ยังไม่เคยประเมินผู้สมัคร 1
  }
  if (evaluatorId === 3 && applicantId === 1) {
    return Promise.resolve(DRAFT_OF_EVALUATOR_3);
  }
  return Promise.resolve(null);
}

// ---------------------------------------------------------------------------
// ตัวช่วย
// ---------------------------------------------------------------------------
async function catchError(action: () => Promise<unknown>): Promise<unknown> {
  try {
    await action();
  } catch (error) {
    return error;
  }
  return undefined;
}

function expectAppException(
  error: unknown,
  errorCode: string,
  status: number,
): void {
  expect(error).toBeInstanceOf(AppException);
  expect((error as AppException).errorCode).toBe(errorCode);
  expect((error as AppException).getStatus()).toBe(status);
}

/** ยืนยันว่าไม่มีการเขียน DB อะไรเลย (transaction ไม่ถูกเรียก) */
function expectNoWrites(): void {
  expect(transactionMock).not.toHaveBeenCalled();
  expectNoDataWrites();
}

/**
 * ยืนยันว่าไม่มีการ "เขียนข้อมูล" ใดๆ
 * (ใช้กับ submit ที่ต้องเข้า transaction เพื่อ read/lock ก่อน แต่ไม่เขียนอะไร)
 */
function expectNoDataWrites(): void {
  expect(evaluationCreateMock).not.toHaveBeenCalled();
  expect(evaluationUpdateMock).not.toHaveBeenCalled();
  expect(evaluationItemUpsertMock).not.toHaveBeenCalled();
  expect(auditLogCreateMock).not.toHaveBeenCalled();
}

/** ยืนยันว่าทุก query ของ evaluation ใส่ evaluatorId ของผู้เรียกเท่านั้น [BR-SCR-01] */
function expectQueriesUseEvaluator(evaluatorId: number): void {
  // cast ทุกแถวของ mock.calls ก่อนเข้าถึง field เพื่อไม่ให้ member access ตกบนค่า any
  const queriedEvaluatorIds = evaluationFindUniqueMock.mock.calls
    .map((call) => (call as [EvaluationFindUniqueArgs])[0])
    .map((args) => args.where.evaluatorId_applicantId.evaluatorId);
  expect(queriedEvaluatorIds.length).toBeGreaterThan(0);
  expect(
    queriedEvaluatorIds.every((queriedId) => queriedId === evaluatorId),
  ).toBe(true);
}

describe('EvaluationWriteService', () => {
  let service: EvaluationWriteService;

  beforeEach(() => {
    jest.clearAllMocks();
    // $transaction จำลองโดยเรียก callback ด้วย tx mock (ทุกอย่างอยู่ใน tx เดียว)
    transactionMock.mockImplementation(
      async (fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock),
    );
    applicantFindUniqueMock.mockResolvedValue(
      createApplicantRow(RoundStatus.OPEN),
    );
    evaluationFindUniqueMock.mockResolvedValue(null);
    roundFindUniqueMock.mockResolvedValue(createOpenRoundRow());
    evaluationCreateMock.mockResolvedValue(NEW_DRAFT_ROW);
    evaluationUpdateMock.mockResolvedValue(UPDATED_DRAFT_ROW);
    service = new EvaluationWriteService(mockPrismaService);
  });

  // =========================================================================
  describe('saveMyEvaluation — สร้าง/อัปเดต Draft', () => {
    it('บันทึกครั้งแรก: สร้างแถว Draft ใหม่ 1 แถว + items ใน transaction เดียว [FR-EVL-04]', async () => {
      evaluationFindUniqueMock.mockResolvedValue(null);

      const result = await service.saveMyEvaluation(1, createEvaluatorUser(), {
        items: [{ subCriteriaId: 1, score: 20 }],
      });

      expect(transactionMock).toHaveBeenCalledTimes(1);
      expect(evaluationCreateMock).toHaveBeenCalledTimes(1);
      expect(evaluationCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            applicantId: 1,
            evaluatorId: 2,
            status: EvaluationStatus.DRAFT,
          },
        }),
      );
      expect(evaluationItemUpsertMock).toHaveBeenCalledWith({
        where: {
          evaluationId_subCriteriaId: {
            evaluationId: 600,
            subCriteriaId: 1,
          },
        },
        create: {
          evaluationId: 600,
          subCriteriaId: 1,
          score: 20,
          comment: null,
          textValue: null,
        },
        update: { score: 20 },
      });
      expect(result.evaluationId).toBe(600);
      expect(result.status).toBe(EvaluationStatus.DRAFT);
      // คะแนนรวมของ Draft ยังไม่ถูกบันทึก (preliminary อยู่ที่หน้าจอ) [BR-EVL-10]
      expect(result.totalScore).toBeNull();
      expect(result.updatedAt).toEqual(NEW_DRAFT_ROW.updatedAt);
      // ข้อที่ยังไม่กรอกเป็น null เสมอ ไม่ใช่ 0 [FR-EVL-07]
      expect(result.items).toHaveLength(4);
      expect(result.items[0].score).toBe(20);
      expect(result.items[1].score).toBeNull();
      expect(result.items[2].score).toBeNull();
      expect(result.items[3].score).toBeNull();
    });

    it('บันทึกครั้งถัดไป: อัปเดตแถวเดิม ไม่สร้างแถวซ้ำ และขยับ updatedAt [FR-EVL-08]', async () => {
      evaluationFindUniqueMock.mockResolvedValue(DRAFT_OF_EVALUATOR_2);

      const result = await service.saveMyEvaluation(1, createEvaluatorUser(), {
        items: [{ subCriteriaId: 2, score: 25 }],
      });

      expect(transactionMock).toHaveBeenCalledTimes(1);
      // ห้ามสร้างแถวที่สอง (unique evaluatorId+applicantId) [BR-EVL-02]
      expect(evaluationCreateMock).not.toHaveBeenCalled();
      const updateCall = evaluationUpdateMock.mock.calls[0] as [
        { where: { id: number }; data: { updatedAt: Date } },
      ];
      expect(updateCall[0].where.id).toBe(501);
      expect(updateCall[0].data.updatedAt).toBeInstanceOf(Date);
      expect(result.evaluationId).toBe(501);
      expect(result.updatedAt).toEqual(UPDATED_DRAFT_ROW.updatedAt);
      // ค่าใหม่รวมกับของเดิม: ข้อ 1 คง 30 / ข้อ 2 เป็น 25 / คอมเมนต์เดิมยังอยู่
      expect(result.items[0].score).toBe(30);
      expect(result.items[1].score).toBe(25);
      expect(result.items[2].comment).toBe('มีใบรับรองชมรม');
    });

    it('payload เท่ากับ DB ทุกฟิลด์ -> ไม่เขียน DB และไม่ขยับ updatedAt (no-op)', async () => {
      evaluationFindUniqueMock.mockResolvedValue(DRAFT_OF_EVALUATOR_2);

      const result = await service.saveMyEvaluation(1, createEvaluatorUser(), {
        items: [
          { subCriteriaId: 1, score: 30 },
          { subCriteriaId: 3, comment: 'มีใบรับรองชมรม' },
        ],
      });

      expectNoWrites();
      expect(result.updatedAt).toEqual(SAVED_AT);
      expect(result.items[0].score).toBe(30);
    });

    it('คะแนนที่ไม่ได้กรอกคงเป็น null ไม่ใช่ 0 — ทั้งตอนสร้างและตอนล้างค่า [BR-EVL-07]', async () => {
      // กรณีสร้างใหม่: ส่ง score: null มาตรงๆ
      await service.saveMyEvaluation(1, createEvaluatorUser(), {
        items: [{ subCriteriaId: 1, score: null }],
      });

      const createCall = evaluationItemUpsertMock.mock.calls[0] as [
        { create: { score: number | null } },
      ];
      expect(createCall[0].create.score).toBeNull();

      // กรณีล้างคะแนนของแถวเดิมที่เคยกรอก 30 ไว้
      jest.clearAllMocks();
      transactionMock.mockImplementation(
        async (fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock),
      );
      applicantFindUniqueMock.mockResolvedValue(
        createApplicantRow(RoundStatus.OPEN),
      );
      evaluationFindUniqueMock.mockResolvedValue(DRAFT_OF_EVALUATOR_2);
      evaluationUpdateMock.mockResolvedValue(UPDATED_DRAFT_ROW);

      const result = await service.saveMyEvaluation(1, createEvaluatorUser(), {
        items: [{ subCriteriaId: 1, score: null }],
      });

      const updateCall = evaluationItemUpsertMock.mock.calls[0] as [
        { update: { score: number | null } },
      ];
      expect(updateCall[0].update.score).toBeNull();
      expect(result.items[0].score).toBeNull();
      expect(result.items[0].score).not.toBe(0);
    });

    it('ส่งเฉพาะ subCriteriaId บางข้อ: ข้อที่ไม่ได้ส่งคงค่าเดิมไว้', async () => {
      evaluationFindUniqueMock.mockResolvedValue(DRAFT_OF_EVALUATOR_2);

      const result = await service.saveMyEvaluation(1, createEvaluatorUser(), {
        items: [{ subCriteriaId: 2, score: 10 }],
      });

      // upsert เฉพาะข้อ 2 เท่านั้น
      expect(evaluationItemUpsertMock).toHaveBeenCalledTimes(1);
      expect(result.items[0].score).toBe(30); // ของเดิม
      expect(result.items[1].score).toBe(10); // ใหม่
      expect(result.items[2].comment).toBe('มีใบรับรองชมรม'); // ของเดิม
    });
  });

  // =========================================================================
  describe('saveMyEvaluation — ตรวจค่าคะแนน (MSG-15)', () => {
    it.each([
      ['คะแนนติดลบ', -1],
      ['เกินคะแนนเต็ม (41 > 40)', 41],
      ['ทศนิยม 7.5', 7.5],
      ['ไม่ใช่ตัวเลข', 'abc'],
    ])(
      'โยน 422 SCORE_OUT_OF_RANGE เมื่อ score เป็น %s',
      async (_label, score) => {
        evaluationFindUniqueMock.mockResolvedValue(DRAFT_OF_EVALUATOR_2);

        const error = await catchError(() =>
          service.saveMyEvaluation(1, createEvaluatorUser(), {
            items: [{ subCriteriaId: 1, score: score as unknown as number }],
          }),
        );

        expectAppException(error, 'SCORE_OUT_OF_RANGE', 422);
        expect((error as AppException).params).toEqual({ max: 40 });
        expectNoWrites();
      },
    );

    it('รับ score = 0 และ score = maxScore (40) ได้ [FR-EVL-05]', async () => {
      evaluationFindUniqueMock.mockResolvedValue(DRAFT_OF_EVALUATOR_2);
      expect(DRAFT_OF_EVALUATOR_2.items[0].score).toBe(30); // ค่าเดิมก่อนถูกแทนด้วย 0

      const zeroResult = await service.saveMyEvaluation(
        1,
        createEvaluatorUser(),
        { items: [{ subCriteriaId: 1, score: 0 }] },
      );
      expect(zeroResult.items[0].score).toBe(0);

      const maxResult = await service.saveMyEvaluation(
        1,
        createEvaluatorUser(),
        { items: [{ subCriteriaId: 1, score: 40 }] },
      );
      expect(maxResult.items[0].score).toBe(40);
      expect(evaluationCreateMock).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  describe('saveMyEvaluation — comment / textValue / หัวข้อแปลก', () => {
    it('โยน 400 เมื่อส่ง comment ไปที่ข้อที่ allowComment = false [FR-EVL-06]', async () => {
      evaluationFindUniqueMock.mockResolvedValue(DRAFT_OF_EVALUATOR_2);

      const error = await catchError(() =>
        service.saveMyEvaluation(1, createEvaluatorUser(), {
          items: [{ subCriteriaId: 1, score: 30, comment: 'ไม่ควรมานี่' }],
        }),
      );

      expectAppException(error, 'BAD_REQUEST', 400);
      expectNoWrites();
    });

    it('รับ comment ได้เมื่อข้อนั้น allowComment = true', async () => {
      evaluationFindUniqueMock.mockResolvedValue(DRAFT_OF_EVALUATOR_2);

      const result = await service.saveMyEvaluation(1, createEvaluatorUser(), {
        items: [{ subCriteriaId: 3, score: 20, comment: 'ชมรมอาสา' }],
      });

      expect(result.items[2].comment).toBe('ชมรมอาสา');
    });

    it('โยน 400 เมื่อส่ง score ไปที่เกณฑ์ย่อยแบบ TEXT [FR-EVL-05]', async () => {
      evaluationFindUniqueMock.mockResolvedValue(DRAFT_OF_EVALUATOR_2);

      const error = await catchError(() =>
        service.saveMyEvaluation(1, createEvaluatorUser(), {
          items: [{ subCriteriaId: 4, score: 10 }],
        }),
      );

      expectAppException(error, 'BAD_REQUEST', 400);
      expectNoWrites();
    });

    it('โยน 400 เมื่อส่ง textValue ไปที่เกณฑ์ย่อยแบบ SCORED [FR-EVL-06]', async () => {
      evaluationFindUniqueMock.mockResolvedValue(DRAFT_OF_EVALUATOR_2);

      const error = await catchError(() =>
        service.saveMyEvaluation(1, createEvaluatorUser(), {
          items: [{ subCriteriaId: 1, textValue: 'ไม่ใช่ที่นี่' }],
        }),
      );

      expectAppException(error, 'BAD_REQUEST', 400);
      expectNoWrites();
    });

    it('รับ textValue ได้เฉพาะเกณฑ์ย่อยแบบ TEXT', async () => {
      evaluationFindUniqueMock.mockResolvedValue(DRAFT_OF_EVALUATOR_2);

      const result = await service.saveMyEvaluation(1, createEvaluatorUser(), {
        items: [{ subCriteriaId: 4, textValue: 'เข้าร่วมกิจกรรมค่ายอาสา' }],
      });

      expect(result.items[3].textValue).toBe('เข้าร่วมกิจกรรมค่ายอาสา');
    });

    it('โยน 400 เมื่อ subCriteriaId ไม่อยู่ในเกณฑ์ของรอบนี้', async () => {
      evaluationFindUniqueMock.mockResolvedValue(DRAFT_OF_EVALUATOR_2);

      const error = await catchError(() =>
        service.saveMyEvaluation(1, createEvaluatorUser(), {
          items: [{ subCriteriaId: 99, score: 10 }],
        }),
      );

      expectAppException(error, 'BAD_REQUEST', 400);
      expectNoWrites();
    });
  });

  // =========================================================================
  describe('saveMyEvaluation — รอบ / สถานะ / บัญชี', () => {
    it('ผู้สมัครไม่มีอยู่จริง -> 404 NOT_FOUND', async () => {
      applicantFindUniqueMock.mockResolvedValue(null);

      const error = await catchError(() =>
        service.saveMyEvaluation(9999, createEvaluatorUser(), {
          items: [{ subCriteriaId: 1, score: 10 }],
        }),
      );

      expectAppException(error, 'NOT_FOUND', 404);
      expectNoWrites();
    });

    it('รอบยังเป็น DRAFT -> 404 NOT_FOUND (คำตอบเดียวกับไม่พบ กัน IDOR)', async () => {
      applicantFindUniqueMock.mockResolvedValue(
        createApplicantRow(RoundStatus.DRAFT),
      );

      const error = await catchError(() =>
        service.saveMyEvaluation(1, createEvaluatorUser(), {
          items: [{ subCriteriaId: 1, score: 10 }],
        }),
      );

      expectAppException(error, 'NOT_FOUND', 404);
      expectNoWrites();
    });

    it('รอบ CLOSED + มี Draft เดิม -> 409 ROUND_CLOSED (MSG-19)', async () => {
      applicantFindUniqueMock.mockResolvedValue(
        createApplicantRow(RoundStatus.CLOSED),
      );
      evaluationFindUniqueMock.mockResolvedValue(DRAFT_OF_EVALUATOR_2);

      const error = await catchError(() =>
        service.saveMyEvaluation(1, createEvaluatorUser(), {
          items: [{ subCriteriaId: 1, score: 10 }],
        }),
      );

      expectAppException(error, 'ROUND_CLOSED', 409);
      expectNoWrites();
    });

    it('รอบ CLOSED + ยังไม่เคยประเมิน -> 404 NOT_FOUND (ไม่สร้างแถวใหม่)', async () => {
      applicantFindUniqueMock.mockResolvedValue(
        createApplicantRow(RoundStatus.CLOSED),
      );
      evaluationFindUniqueMock.mockResolvedValue(null);

      const error = await catchError(() =>
        service.saveMyEvaluation(1, createEvaluatorUser(), {
          items: [{ subCriteriaId: 1, score: 10 }],
        }),
      );

      expectAppException(error, 'NOT_FOUND', 404);
      expectNoWrites();
    });

    it('เคย SUBMITTED แล้ว -> 409 ALREADY_EVALUATED (MSG-17) ห้ามแก้ทั้ง save/submit [BR-EVL-09]', async () => {
      evaluationFindUniqueMock.mockResolvedValue(SUBMITTED_EVALUATION);

      const error = await catchError(() =>
        service.saveMyEvaluation(1, createEvaluatorUser(), {
          items: [{ subCriteriaId: 1, score: 10 }],
        }),
      );

      expectAppException(error, 'ALREADY_EVALUATED', 409);
      expectNoWrites();
    });

    it('บัญชีหมดอายุ + ยังไม่เคยประเมิน -> 422 EVALUATOR_EXPIRED_NEW_APPLICANT (MSG-18)', async () => {
      evaluationFindUniqueMock.mockResolvedValue(null);
      const expiredUser = createEvaluatorUser({
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });

      const error = await catchError(() =>
        service.saveMyEvaluation(1, expiredUser, {
          items: [{ subCriteriaId: 1, score: 10 }],
        }),
      );

      expectAppException(error, 'EVALUATOR_EXPIRED_NEW_APPLICANT', 422);
      expectNoWrites();
    });

    it('บัญชีหมดอายุ + มี Draft เดิม -> แก้ไขต่อได้ตาม BR-USR-11', async () => {
      evaluationFindUniqueMock.mockResolvedValue(DRAFT_OF_EVALUATOR_2);
      const expiredUser = createEvaluatorUser({
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });

      const result = await service.saveMyEvaluation(1, expiredUser, {
        items: [{ subCriteriaId: 2, score: 15 }],
      });

      expect(evaluationUpdateMock).toHaveBeenCalledTimes(1);
      expect(result.items[1].score).toBe(15);
    });
  });

  // =========================================================================
  describe('saveMyEvaluation — peer-blind [BR-SCR-01]', () => {
    it('ทุก query ใส่ evaluatorId ของผู้เรียก และไม่แตะแถวของผู้ประเมินคนอื่น', async () => {
      evaluationFindUniqueMock.mockImplementation(fakeEvaluationTable);

      const result = await service.saveMyEvaluation(
        1,
        createEvaluatorUser({ id: 2 }),
        { items: [{ subCriteriaId: 1, score: 35 }] },
      );

      // query ทุกครั้งต้องอ้าง evaluatorId = 2 เท่านั้น ไม่เคยเป็น 3
      expectQueriesUseEvaluator(2);
      // สร้างแถวของตัวเอง ห้าม update แถว id 700 ของ evaluator คนอื่น
      expect(evaluationCreateMock).toHaveBeenCalledTimes(1);
      expect(evaluationUpdateMock).not.toHaveBeenCalled();
      // response ไม่มีข้อมูล/คอมเมนต์ของผู้ประเมินคนอื่นปนมา
      expect(JSON.stringify(result)).not.toContain(
        'ความลับของ evaluator คนอื่น',
      );
      expect(result.items[0].score).toBe(35);
    });
  });

  // =========================================================================
  describe('submitMyEvaluation — สำเร็จ', () => {
    it('Submit สำเร็จ: SUBMITTED + totalScore ถูก + submittedAt + AuditLog ใน transaction เดียว', async () => {
      evaluationFindUniqueMock.mockResolvedValue({
        id: 501,
        status: EvaluationStatus.DRAFT,
        totalScore: null,
        submittedAt: null,
        updatedAt: SAVED_AT,
        items: [
          { subCriteriaId: 1, score: 40, comment: null, textValue: null },
          { subCriteriaId: 2, score: 25, comment: null, textValue: null },
          { subCriteriaId: 3, score: 10, comment: 'ชมรมอาสา', textValue: null },
        ],
      });
      evaluationUpdateMock.mockResolvedValue(SUBMITTED_RESULT_ROW);

      const result = await service.submitMyEvaluation(1, createEvaluatorUser());

      // ทุกอย่างอยู่ใน transaction เดียว [FR-EVL-04]
      expect(transactionMock).toHaveBeenCalledTimes(1);
      // lock แถวรอบแบบ FOR SHARE ตาม spec
      expect(queryRawMock).toHaveBeenCalledTimes(1);
      const rawCall = queryRawMock.mock.calls[0] as [string[], number];
      expect(rawCall[0].join('')).toContain('FOR SHARE');
      expect(rawCall[1]).toBe(2);
      // ตั้งสถานะ + คะแนนรวม (เฉพาะ SCORED: 40+25+10 = 75, TEXT ไม่นับ)
      const submitUpdateCall = evaluationUpdateMock.mock.calls[0] as [
        {
          where: { id: number };
          data: {
            status: EvaluationStatus;
            totalScore: number;
            submittedAt: Date;
          };
        },
      ];
      expect(submitUpdateCall[0].where.id).toBe(501);
      expect(submitUpdateCall[0].data.status).toBe(EvaluationStatus.SUBMITTED);
      expect(submitUpdateCall[0].data.totalScore).toBe(75);
      expect(submitUpdateCall[0].data.submittedAt).toBeInstanceOf(Date);
      // Audit Log EVALUATION_SUBMIT ใน tx เดียวกัน [FR-EVL-15] [BR-PDP-01]
      expect(auditLogCreateMock).toHaveBeenCalledTimes(1);
      expect(auditLogCreateMock).toHaveBeenCalledWith({
        data: {
          actorId: 2,
          action: AuditAction.EVALUATION_SUBMIT,
          entityType: 'Evaluation',
          entityId: '501',
          roundId: 2,
          oldValue: { status: EvaluationStatus.DRAFT },
          newValue: { status: EvaluationStatus.SUBMITTED, totalScore: 75 },
        },
      });
      expect(result.status).toBe(EvaluationStatus.SUBMITTED);
      expect(result.totalScore).toBe(75);
      expect(result.submittedAt).toEqual(SUBMITTED_RESULT_ROW.submittedAt);
      expect(result.isLocked).toBe(false);
    });

    it('Comment และเกณฑ์ย่อยแบบ TEXT ไม่บังคับ — ไม่มีก็ Submit ได้ [BR-EVL-11]', async () => {
      evaluationFindUniqueMock.mockResolvedValue({
        id: 501,
        status: EvaluationStatus.DRAFT,
        totalScore: null,
        submittedAt: null,
        updatedAt: SAVED_AT,
        // มีเฉพาะคะแนน SCORED ครบทุกข้อ ไม่มี comment / ไม่มีแถวของ TEXT
        items: [
          { subCriteriaId: 1, score: 40, comment: null, textValue: null },
          { subCriteriaId: 2, score: 30, comment: null, textValue: null },
          { subCriteriaId: 3, score: 30, comment: null, textValue: null },
        ],
      });
      evaluationUpdateMock.mockResolvedValue({
        ...SUBMITTED_RESULT_ROW,
        totalScore: 100,
      });

      const result = await service.submitMyEvaluation(1, createEvaluatorUser());

      expect(result.status).toBe(EvaluationStatus.SUBMITTED);
      expect(result.totalScore).toBe(100);
      expect(auditLogCreateMock).toHaveBeenCalledTimes(1);
    });

    it('บัญชีหมดอายุแต่ยังเปิด: Submit Draft เดิมได้ตาม BR-USR-11', async () => {
      evaluationFindUniqueMock.mockResolvedValue({
        id: 501,
        status: EvaluationStatus.DRAFT,
        totalScore: null,
        submittedAt: null,
        updatedAt: SAVED_AT,
        items: [
          { subCriteriaId: 1, score: 40, comment: null, textValue: null },
          { subCriteriaId: 2, score: 30, comment: null, textValue: null },
          { subCriteriaId: 3, score: 30, comment: null, textValue: null },
        ],
      });
      evaluationUpdateMock.mockResolvedValue({
        ...SUBMITTED_RESULT_ROW,
        totalScore: 100,
      });
      const expiredUser = createEvaluatorUser({
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });

      const result = await service.submitMyEvaluation(1, expiredUser);

      expect(result.status).toBe(EvaluationStatus.SUBMITTED);
      expect(evaluationUpdateMock).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  describe('submitMyEvaluation — ปฏิเสธ', () => {
    it('กรอก SCORED ไม่ครบ -> 422 SCORES_INCOMPLETE พร้อมรายชื่อหัวข้อที่ขาด (MSG-16)', async () => {
      evaluationFindUniqueMock.mockResolvedValue({
        id: 501,
        status: EvaluationStatus.DRAFT,
        totalScore: null,
        submittedAt: null,
        updatedAt: SAVED_AT,
        items: [
          { subCriteriaId: 1, score: 40, comment: null, textValue: null },
          // ขาดข้อ 2 (GPA)
          { subCriteriaId: 3, score: 10, comment: null, textValue: null },
          { subCriteriaId: 4, score: null, comment: null, textValue: 'มีค่าย' },
        ],
      });

      const error = await catchError(() =>
        service.submitMyEvaluation(1, createEvaluatorUser()),
      );

      expectAppException(error, 'SCORES_INCOMPLETE', 422);
      expect((error as AppException).params).toEqual({
        items: ['ผลการเรียนเฉลี่ยสะสม (GPA)'],
      });
      // ไม่มีการเขียนอะไรเลยถ้าคะแนนไม่ครบ
      expect(evaluationUpdateMock).not.toHaveBeenCalled();
      expect(auditLogCreateMock).not.toHaveBeenCalled();
    });

    it('ผู้สมัครไม่มี -> 404 และไม่ถึงขั้น lock รอบ', async () => {
      applicantFindUniqueMock.mockResolvedValue(null);

      const error = await catchError(() =>
        service.submitMyEvaluation(9999, createEvaluatorUser()),
      );

      expectAppException(error, 'NOT_FOUND', 404);
      expect(queryRawMock).not.toHaveBeenCalled();
      expectNoDataWrites();
    });

    it('ยังไม่เคยเริ่มประเมิน (ไม่มีแถว) -> 404 NOT_FOUND', async () => {
      evaluationFindUniqueMock.mockResolvedValue(null);

      const error = await catchError(() =>
        service.submitMyEvaluation(1, createEvaluatorUser()),
      );

      expectAppException(error, 'NOT_FOUND', 404);
      expectNoDataWrites();
    });

    it('เคย SUBMITTED แล้ว -> 409 ALREADY_EVALUATED ห้ามส่งซ้ำ [BR-EVL-02]', async () => {
      evaluationFindUniqueMock.mockResolvedValue(SUBMITTED_EVALUATION);

      const error = await catchError(() =>
        service.submitMyEvaluation(1, createEvaluatorUser()),
      );

      expectAppException(error, 'ALREADY_EVALUATED', 409);
      expect(evaluationUpdateMock).not.toHaveBeenCalled();
      expect(auditLogCreateMock).not.toHaveBeenCalled();
    });

    it('รอบ CLOSED + มี Draft -> 409 ROUND_CLOSED (MSG-19) หลังจาก lock', async () => {
      roundFindUniqueMock.mockResolvedValue({
        status: RoundStatus.CLOSED,
        criteria: { subCriteria: SUB_CRITERIA_LIST },
      });
      evaluationFindUniqueMock.mockResolvedValue(DRAFT_OF_EVALUATOR_2);

      const error = await catchError(() =>
        service.submitMyEvaluation(1, createEvaluatorUser()),
      );

      expectAppException(error, 'ROUND_CLOSED', 409);
      expect(queryRawMock).toHaveBeenCalledTimes(1); // lock ก่อนตรวจเสมอ
      expect(evaluationUpdateMock).not.toHaveBeenCalled();
      expect(auditLogCreateMock).not.toHaveBeenCalled();
    });

    it('รอบ CLOSED + ไม่เคยประเมิน -> 404 NOT_FOUND', async () => {
      roundFindUniqueMock.mockResolvedValue({
        status: RoundStatus.CLOSED,
        criteria: { subCriteria: SUB_CRITERIA_LIST },
      });
      evaluationFindUniqueMock.mockResolvedValue(null);

      const error = await catchError(() =>
        service.submitMyEvaluation(1, createEvaluatorUser()),
      );

      expectAppException(error, 'NOT_FOUND', 404);
      expectNoDataWrites();
    });

    it('รอบ DRAFT -> 404 NOT_FOUND', async () => {
      roundFindUniqueMock.mockResolvedValue({
        status: RoundStatus.DRAFT,
        criteria: { subCriteria: SUB_CRITERIA_LIST },
      });

      const error = await catchError(() =>
        service.submitMyEvaluation(1, createEvaluatorUser()),
      );

      expectAppException(error, 'NOT_FOUND', 404);
      expectNoDataWrites();
    });
  });

  // =========================================================================
  describe('submitMyEvaluation — peer-blind [BR-SCR-01]', () => {
    it('query ใส่ evaluatorId ของผู้เรียกเสมอ และไม่ส่งผลของผู้ประเมินคนอื่นแทน', async () => {
      evaluationFindUniqueMock.mockImplementation(fakeEvaluationTable);

      // evaluator 2 ยังไม่เคยประเมิน -> 404 ต่อให้ evaluator 3 มี Draft อยู่ (id 700)
      const error = await catchError(() =>
        service.submitMyEvaluation(1, createEvaluatorUser({ id: 2 })),
      );

      expectAppException(error, 'NOT_FOUND', 404);
      expectQueriesUseEvaluator(2);
      // แถว id 700 ของ evaluator คนอื่นไม่ถูก update / ไม่มี audit log
      expect(evaluationUpdateMock).not.toHaveBeenCalled();
      expect(auditLogCreateMock).not.toHaveBeenCalled();
      expect(
        JSON.stringify((error as AppException).params ?? {}),
      ).not.toContain('ความลับของ evaluator คนอื่น');
    });
  });
});
