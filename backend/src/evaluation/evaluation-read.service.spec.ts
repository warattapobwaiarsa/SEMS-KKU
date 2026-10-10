/**
 * Unit test ของ EvaluationReadService (API อ่านอย่างเดียวของหน้าประเมิน)
 * ไม่ต่อฐานข้อมูลจริง ใช้ mock PrismaService
 * [FR-APP-03] [BR-APP-04] [FR-EVL-04] [FR-EVL-07] [FR-EVL-14] [BR-SCR-01] [FR-CRT-13]
 */
import {
  EvaluationStatus,
  Prisma,
  RoundStatus,
  SubCriteriaType,
  User,
  UserRole,
} from '@prisma/client';
import { AppException } from '../common/exceptions/app.exception';
import { PrismaService } from '../prisma/prisma.service';
import { EvaluationReadService } from './evaluation-read.service';

// ---------------------------------------------------------------------------
// mock PrismaService: มีทั้งฟังก์ชันอ่าน และฟังก์ชันเขียน (ไว้ตรวจว่า "ไม่ถูกเรียก")
// ---------------------------------------------------------------------------
const applicantFindUniqueMock = jest.fn();
const evaluationFindUniqueMock = jest.fn();
const roundFindUniqueMock = jest.fn();

// ฟังก์ชันเขียนทั้งหมด: API อ่านอย่างเดียวต้องไม่เรียกตัวไหนเลย
const writeMocks = {
  evaluationCreate: jest.fn(),
  evaluationUpdate: jest.fn(),
  evaluationUpsert: jest.fn(),
  evaluationItemCreate: jest.fn(),
  evaluationItemCreateMany: jest.fn(),
  evaluationItemUpdate: jest.fn(),
  evaluationItemUpsert: jest.fn(),
  applicantUpdate: jest.fn(),
};

const mockPrismaService = {
  applicant: {
    findUnique: applicantFindUniqueMock,
    update: writeMocks.applicantUpdate,
  },
  evaluation: {
    findUnique: evaluationFindUniqueMock,
    create: writeMocks.evaluationCreate,
    update: writeMocks.evaluationUpdate,
    upsert: writeMocks.evaluationUpsert,
  },
  evaluationItem: {
    create: writeMocks.evaluationItemCreate,
    createMany: writeMocks.evaluationItemCreateMany,
    update: writeMocks.evaluationItemUpdate,
    upsert: writeMocks.evaluationItemUpsert,
  },
  scholarshipRound: { findUnique: roundFindUniqueMock },
} as unknown as PrismaService;

// key ที่อนุญาตในรายละเอียดผู้สมัคร (ต้องตรงทุกตัว ไม่มากไม่น้อย)
const ALLOWED_APPLICANT_KEYS = [
  'createdAt',
  'faculty',
  'firstName',
  'gpa',
  'id',
  'importBatchId',
  'lastName',
  'legacySeq',
  'major',
  'roundId',
  'studentCode',
  'studyYear',
  'supportingInfo',
  'titlePrefix',
];

// key ที่ห้ามปรากฏเด็ดขาด [FR-APP-03] [BR-APP-04] [BR-PDP-05]
const FORBIDDEN_KEYS = [
  'contact',
  'citizenId',
  'citizenIdEncrypted',
  'citizenIdMasked',
  'phone',
  'email',
];

// key ที่อนุญาตในโครงสร้างเกณฑ์ย่อยที่ฝังมา (ไม่มี rubric) [FR-CRT-13]
const ALLOWED_SUB_CRITERIA_KEYS = [
  'allowComment',
  'id',
  'maxScore',
  'sortOrder',
  'title',
  'type',
];

// ---------------------------------------------------------------------------
// ฟังก์ชันช่วยสร้างข้อมูลปลอม
// ---------------------------------------------------------------------------
function createMockUser(overrides: Partial<User>): User {
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

// แถวผู้สมัครตามที่ Prisma คืนจาก select ของ getApplicantDetailForEvaluator
function createApplicantDetailRow(roundStatus: RoundStatus) {
  return {
    id: 1,
    roundId: 2,
    importBatchId: 2,
    legacySeq: 1,
    studentCode: 'FAKE-OPEN-01',
    titlePrefix: 'นาย',
    firstName: 'ทดสอบ',
    lastName: 'เทียมกุล01',
    faculty: 'คณะวิศวกรรมศาสตร์',
    major: 'วิศวกรรมคอมพิวเตอร์',
    studyYear: 4,
    gpa: new Prisma.Decimal('3.75'),
    createdAt: new Date('2026-10-07T00:00:00.000Z'),
    round: { status: roundStatus },
    supportingInfo: {
      applicationDate: '1 ก.ค. 2569',
      accommodation: 'หอพักใน มข.',
      rent: null,
      personalExpense: null,
      studyEquipmentCost: null,
      electronicDevices: null,
      sideIncome: null,
      fatherAge: null,
      fatherOccupation: null,
      fatherIncome: null,
      fatherStatus: null,
      motherAge: null,
      motherOccupation: null,
      motherIncome: null,
      motherStatus: null,
      parentsStatus: null,
      tuitionPayer: null,
      guardianRelation: null,
      guardianOccupation: null,
      guardianIncome: null,
      siblingsWorking: null,
      siblingsNotWorking: null,
      siblingsStudying: null,
      studentLoan: null,
      previousScholarships: null,
      accommodationMapUrl: 'javascript:alert(1)',
    },
  };
}

// เกณฑ์ย่อย 3 ข้อของรอบ (DB คืนมาเรียงตาม sortOrder แล้ว)
const SUB_CRITERIA_ROWS = [
  {
    id: 1,
    title: 'ผลการเรียน',
    type: SubCriteriaType.SCORED,
    maxScore: 40,
    allowComment: true,
    sortOrder: 1,
  },
  {
    id: 2,
    title: 'ฐานะทางครอบครัว',
    type: SubCriteriaType.SCORED,
    maxScore: 30,
    allowComment: false,
    sortOrder: 2,
  },
  {
    id: 3,
    title: 'ความเห็นเพิ่มเติม',
    type: SubCriteriaType.TEXT,
    maxScore: null,
    allowComment: false,
    sortOrder: 3,
  },
];

// แถวผู้สมัครตามที่ Prisma คืนจาก select ของ getMyEvaluation
function createApplicantFormRow(roundStatus: RoundStatus) {
  return {
    id: 1,
    round: {
      status: roundStatus,
      criteria: { subCriteria: SUB_CRITERIA_ROWS },
    },
  };
}

// "ฐานข้อมูลปลอม" ของผลประเมิน: มีของผู้ประเมิน id 2 และ id 3 สำหรับผู้สมัครคนเดียวกัน
const EVALUATION_OF_EVALUATOR_2 = {
  id: 50,
  status: EvaluationStatus.DRAFT,
  totalScore: null,
  submittedAt: null,
  updatedAt: new Date('2026-10-07T03:00:00.000Z'),
  items: [
    // ข้อ 1 กรอก 35 คะแนน, ข้อ 2 ยังไม่กรอก (score null), ข้อ 3 ไม่มีแถวเลย
    { subCriteriaId: 1, score: 35, comment: 'ดีมาก', textValue: null },
    { subCriteriaId: 2, score: null, comment: null, textValue: null },
  ],
};
const EVALUATION_OF_EVALUATOR_3 = {
  id: 51,
  status: EvaluationStatus.SUBMITTED,
  totalScore: 99,
  submittedAt: new Date('2026-10-07T04:00:00.000Z'),
  updatedAt: new Date('2026-10-07T04:00:00.000Z'),
  items: [
    {
      subCriteriaId: 1,
      score: 40,
      comment: 'ความลับของคนอื่น',
      textValue: null,
    },
    { subCriteriaId: 2, score: 29, comment: null, textValue: null },
    {
      subCriteriaId: 3,
      score: null,
      comment: null,
      textValue: 'ข้อความของคนอื่น',
    },
  ],
};

// จำลอง evaluation.findUnique: คืนผลตาม evaluatorId ที่อยู่ใน WHERE จริงๆ
interface EvaluationFindUniqueArgs {
  where: {
    evaluatorId_applicantId: { evaluatorId: number; applicantId: number };
  };
}
function fakeEvaluationTable(args: EvaluationFindUniqueArgs) {
  const evaluatorId = args.where.evaluatorId_applicantId.evaluatorId;
  if (evaluatorId === 2) return Promise.resolve(EVALUATION_OF_EVALUATOR_2);
  if (evaluatorId === 3) return Promise.resolve(EVALUATION_OF_EVALUATOR_3);
  return Promise.resolve(null);
}

async function catchError(action: () => Promise<unknown>): Promise<unknown> {
  try {
    await action();
  } catch (error) {
    return error;
  }
  return undefined;
}

function expectNotFound(error: unknown): void {
  expect(error).toBeInstanceOf(AppException);
  expect((error as AppException).errorCode).toBe('NOT_FOUND');
  expect((error as AppException).getStatus()).toBe(404);
}

function expectNoWrites(): void {
  for (const writeMock of Object.values(writeMocks)) {
    expect(writeMock).not.toHaveBeenCalled();
  }
}

// ดึง argument ของการเรียก mock ครั้งแรก
function firstCallArgs<T>(mock: jest.Mock): T {
  const firstCall = mock.mock.calls[0] as [T];
  return firstCall[0];
}

describe('EvaluationReadService', () => {
  let service: EvaluationReadService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EvaluationReadService(mockPrismaService);
  });

  // =========================================================================
  describe('getApplicantDetailForEvaluator (GET /applicants/:id)', () => {
    it.each([RoundStatus.DRAFT, RoundStatus.CLOSED])(
      'ตอบ 404 NOT_FOUND เมื่อรอบของผู้สมัครเป็น %s',
      async (roundStatus) => {
        applicantFindUniqueMock.mockResolvedValue(
          createApplicantDetailRow(roundStatus),
        );

        const error = await catchError(() =>
          service.getApplicantDetailForEvaluator(1),
        );

        expectNotFound(error);
      },
    );

    it('ตอบ 404 NOT_FOUND แบบเดียวกันเมื่อไม่พบผู้สมัคร', async () => {
      applicantFindUniqueMock.mockResolvedValue(null);

      const error = await catchError(() =>
        service.getApplicantDetailForEvaluator(9999),
      );

      expectNotFound(error);
    });

    it('ผลลัพธ์มี key ตรงตามรายการที่อนุญาตเท่านั้น (ไม่มีเลขบัตร/เบอร์/อีเมล)', async () => {
      applicantFindUniqueMock.mockResolvedValue(
        createApplicantDetailRow(RoundStatus.OPEN),
      );

      const result = await service.getApplicantDetailForEvaluator(1);

      const resultKeys = Object.keys(result).sort();
      expect(resultKeys).toEqual(ALLOWED_APPLICANT_KEYS);
      for (const forbiddenKey of FORBIDDEN_KEYS) {
        expect(resultKeys).not.toContain(forbiddenKey);
        expect(Object.keys(result.supportingInfo!)).not.toContain(forbiddenKey);
      }
      // ไม่หลุดข้อมูลรอบออกไป
      expect(resultKeys).not.toContain('round');
    });

    it('query ใช้ select และไม่ขอ contact / เลขบัตร / เบอร์ / อีเมล', async () => {
      applicantFindUniqueMock.mockResolvedValue(
        createApplicantDetailRow(RoundStatus.OPEN),
      );

      await service.getApplicantDetailForEvaluator(1);

      const args = firstCallArgs<{
        where: unknown;
        select: Record<string, unknown>;
      }>(applicantFindUniqueMock);
      expect(args.where).toEqual({ id: 1 });
      expect(args).not.toHaveProperty('include');
      const selectedKeys = Object.keys(args.select);
      for (const forbiddenKey of FORBIDDEN_KEYS) {
        expect(selectedKeys).not.toContain(forbiddenKey);
      }
    });

    it('แปลง gpa เป็นตัวเลข และส่งลิงก์แผนที่ตามที่เก็บไว้ (ไม่แต่งเติม) [FR-APP-05]', async () => {
      applicantFindUniqueMock.mockResolvedValue(
        createApplicantDetailRow(RoundStatus.OPEN),
      );

      const result = await service.getApplicantDetailForEvaluator(1);

      expect(result.gpa).toBe(3.75);
      expect(result.supportingInfo!.accommodationMapUrl).toBe(
        'javascript:alert(1)',
      );
      expect(result.legacySeq).toBe(1);
    });

    it('ไม่มีข้อมูลประกอบ -> supportingInfo เป็น null', async () => {
      const row = createApplicantDetailRow(RoundStatus.OPEN);
      applicantFindUniqueMock.mockResolvedValue({
        ...row,
        supportingInfo: null,
      });

      const result = await service.getApplicantDetailForEvaluator(1);

      expect(result.supportingInfo).toBeNull();
    });

    it('ไม่เรียกฟังก์ชันเขียนข้อมูลใดๆ', async () => {
      applicantFindUniqueMock.mockResolvedValue(
        createApplicantDetailRow(RoundStatus.OPEN),
      );

      await service.getApplicantDetailForEvaluator(1);

      expectNoWrites();
    });
  });

  // =========================================================================
  describe('getMyEvaluation (GET /applicants/:applicantId/my-evaluation)', () => {
    it('ตอบ 404 เมื่อไม่พบผู้สมัคร', async () => {
      applicantFindUniqueMock.mockResolvedValue(null);

      const error = await catchError(() =>
        service.getMyEvaluation(9999, createMockUser({})),
      );

      expectNotFound(error);
      expect(evaluationFindUniqueMock).not.toHaveBeenCalled();
    });

    it('ตอบ 404 เมื่อรอบเป็น DRAFT', async () => {
      applicantFindUniqueMock.mockResolvedValue(
        createApplicantFormRow(RoundStatus.DRAFT),
      );

      const error = await catchError(() =>
        service.getMyEvaluation(1, createMockUser({})),
      );

      expectNotFound(error);
    });

    it('ตอบ 404 เมื่อรอบเป็น CLOSED และยังไม่เคยประเมิน (กัน IDOR)', async () => {
      applicantFindUniqueMock.mockResolvedValue(
        createApplicantFormRow(RoundStatus.CLOSED),
      );
      evaluationFindUniqueMock.mockResolvedValue(null);

      const error = await catchError(() =>
        service.getMyEvaluation(1, createMockUser({})),
      );

      expectNotFound(error);
    });

    it('query ผลประเมินใส่ evaluatorId ของผู้เรียกใน WHERE', async () => {
      applicantFindUniqueMock.mockResolvedValue(
        createApplicantFormRow(RoundStatus.OPEN),
      );
      evaluationFindUniqueMock.mockImplementation(fakeEvaluationTable);

      await service.getMyEvaluation(1, createMockUser({ id: 2 }));

      const args = firstCallArgs<EvaluationFindUniqueArgs>(
        evaluationFindUniqueMock,
      );
      expect(args.where).toEqual({
        evaluatorId_applicantId: { evaluatorId: 2, applicantId: 1 },
      });
    });

    it('ได้เฉพาะผลของตัวเอง ไม่เคยได้ผลของผู้ประเมินคนอื่น [BR-SCR-01]', async () => {
      applicantFindUniqueMock.mockResolvedValue(
        createApplicantFormRow(RoundStatus.OPEN),
      );
      evaluationFindUniqueMock.mockImplementation(fakeEvaluationTable);

      const result = await service.getMyEvaluation(
        1,
        createMockUser({ id: 2 }),
      );

      expect(result.evaluationId).toBe(50);
      expect(result.status).toBe('DRAFT');
      expect(result.totalScore).toBeNull();
      // ไม่มีข้อมูลใดๆ ของผู้ประเมิน id 3 หลุดมา
      const resultJson = JSON.stringify(result);
      expect(resultJson).not.toContain('ความลับของคนอื่น');
      expect(resultJson).not.toContain('ข้อความของคนอื่น');
      expect(resultJson).not.toContain('"evaluationId":51');
      expect(Object.keys(result)).not.toContain('evaluatorId');
    });

    it('ผู้ประเมิน id 3 เรียก -> ได้ผลของ id 3 เท่านั้น', async () => {
      applicantFindUniqueMock.mockResolvedValue(
        createApplicantFormRow(RoundStatus.OPEN),
      );
      evaluationFindUniqueMock.mockImplementation(fakeEvaluationTable);

      const result = await service.getMyEvaluation(
        1,
        createMockUser({ id: 3 }),
      );

      expect(result.evaluationId).toBe(51);
      expect(result.status).toBe('SUBMITTED');
      expect(result.items[0].comment).toBe('ความลับของคนอื่น');
      expect(JSON.stringify(result)).not.toContain('ดีมาก');
    });

    it('ข้อที่ยังไม่กรอกเป็น null ไม่ใช่ 0 [FR-EVL-07]', async () => {
      applicantFindUniqueMock.mockResolvedValue(
        createApplicantFormRow(RoundStatus.OPEN),
      );
      evaluationFindUniqueMock.mockImplementation(fakeEvaluationTable);

      const result = await service.getMyEvaluation(
        1,
        createMockUser({ id: 2 }),
      );

      expect(result.items[0].score).toBe(35);
      // ข้อ 2 มีแถวแต่ score เป็น null
      expect(result.items[1].score).toBeNull();
      // ข้อ 3 ไม่มีแถวเลย ก็ต้องเป็น null
      expect(result.items[2].score).toBeNull();
      expect(result.items[2].comment).toBeNull();
      expect(result.items[2].textValue).toBeNull();
    });

    it('เกณฑ์ย่อยครบ เรียงตาม sortOrder มีฟิลด์ครบ และไม่มี rubric [FR-EVL-04] [FR-CRT-13]', async () => {
      applicantFindUniqueMock.mockResolvedValue(
        createApplicantFormRow(RoundStatus.OPEN),
      );
      evaluationFindUniqueMock.mockResolvedValue(null);

      const result = await service.getMyEvaluation(1, createMockUser({}));

      expect(result.items.map((item) => item.subCriteriaId)).toEqual([1, 2, 3]);
      expect(result.items[0].subCriteria).toEqual(SUB_CRITERIA_ROWS[0]);
      expect(result.items[2].subCriteria.type).toBe('TEXT');
      expect(result.items[2].subCriteria.maxScore).toBeNull();
      for (const item of result.items) {
        expect(Object.keys(item.subCriteria).sort()).toEqual(
          ALLOWED_SUB_CRITERIA_KEYS,
        );
        expect(Object.keys(item).sort()).toEqual([
          'comment',
          'score',
          'subCriteria',
          'subCriteriaId',
          'textValue',
        ]);
      }

      // query ขอให้ DB เรียงตาม sortOrder
      const args = firstCallArgs<{
        select: {
          round: {
            select: {
              criteria: { select: { subCriteria: { orderBy: unknown } } };
            };
          };
        };
      }>(applicantFindUniqueMock);
      expect(
        args.select.round.select.criteria.select.subCriteria.orderBy,
      ).toEqual([{ sortOrder: 'asc' }, { id: 'asc' }]);
      expect(Object.keys(args.select)).not.toContain('contact');
    });

    it('ยังไม่เคยประเมิน + รอบ OPEN -> คืนแบบฟอร์มว่างตามที่ตกลง (ไม่สร้างแถว)', async () => {
      applicantFindUniqueMock.mockResolvedValue(
        createApplicantFormRow(RoundStatus.OPEN),
      );
      evaluationFindUniqueMock.mockResolvedValue(null);

      const result = await service.getMyEvaluation(1, createMockUser({}));

      expect(result).toEqual({
        evaluationId: null,
        applicantId: 1,
        status: null,
        isLocked: false,
        totalScore: null,
        submittedAt: null,
        updatedAt: null,
        items: expect.any(Array) as unknown,
      });
      expect(result.items).toHaveLength(3);
      for (const item of result.items) {
        expect(item.score).toBeNull();
        expect(item.comment).toBeNull();
        expect(item.textValue).toBeNull();
      }
      expectNoWrites();
    });

    it('มี Draft อยู่แล้ว + รอบ CLOSED -> อ่านได้ และ isLocked = true (ตาม spec)', async () => {
      applicantFindUniqueMock.mockResolvedValue(
        createApplicantFormRow(RoundStatus.CLOSED),
      );
      evaluationFindUniqueMock.mockImplementation(fakeEvaluationTable);

      const result = await service.getMyEvaluation(
        1,
        createMockUser({ id: 2 }),
      );

      expect(result.status).toBe('DRAFT');
      expect(result.isLocked).toBe(true);
    });

    it('Submitted แล้ว + รอบ CLOSED -> อ่านได้ และ isLocked = false', async () => {
      applicantFindUniqueMock.mockResolvedValue(
        createApplicantFormRow(RoundStatus.CLOSED),
      );
      evaluationFindUniqueMock.mockImplementation(fakeEvaluationTable);

      const result = await service.getMyEvaluation(
        1,
        createMockUser({ id: 3 }),
      );

      expect(result.status).toBe('SUBMITTED');
      expect(result.isLocked).toBe(false);
      expect(result.totalScore).toBe(99);
    });

    it('ไม่เรียกฟังก์ชันเขียนข้อมูลใดๆ (ทั้งกรณีมีผลและไม่มีผล)', async () => {
      applicantFindUniqueMock.mockResolvedValue(
        createApplicantFormRow(RoundStatus.OPEN),
      );
      evaluationFindUniqueMock.mockImplementation(fakeEvaluationTable);

      await service.getMyEvaluation(1, createMockUser({ id: 2 }));
      await service.getMyEvaluation(1, createMockUser({ id: 99 }));

      expectNoWrites();
      // จำนวน query คงที่ต่อคำขอ (2 ครั้ง) ไม่ขึ้นกับจำนวนเกณฑ์ย่อย -> ไม่มี N+1
      expect(applicantFindUniqueMock).toHaveBeenCalledTimes(2);
      expect(evaluationFindUniqueMock).toHaveBeenCalledTimes(2);
    });
  });

  // =========================================================================
  describe('getRoundForEvaluator (GET /scholarship-rounds/:id)', () => {
    const roundRow = {
      id: 2,
      name: '[TEST] ทุนการศึกษา รอบเปิด',
      academicYear: 2569,
      semester: 1,
      criteriaId: 1,
      status: RoundStatus.OPEN,
      openedAt: new Date('2026-10-01T00:00:00.000Z'),
      closedAt: null,
      createdAt: new Date('2026-10-01T00:00:00.000Z'),
      updatedAt: new Date('2026-10-01T00:00:00.000Z'),
    };

    it.each([RoundStatus.DRAFT, RoundStatus.CLOSED])(
      'ตอบ 404 NOT_FOUND เมื่อรอบเป็น %s',
      async (status) => {
        roundFindUniqueMock.mockResolvedValue({ ...roundRow, status });

        const error = await catchError(() => service.getRoundForEvaluator(2));

        expectNotFound(error);
      },
    );

    it('ตอบ 404 NOT_FOUND แบบเดียวกันเมื่อไม่พบรอบ', async () => {
      roundFindUniqueMock.mockResolvedValue(null);

      const error = await catchError(() => service.getRoundForEvaluator(9999));

      expectNotFound(error);
    });

    it('รอบ OPEN -> คืนฟิลด์ตาม ScholarshipRoundDto', async () => {
      roundFindUniqueMock.mockResolvedValue(roundRow);

      const result = await service.getRoundForEvaluator(2);

      expect(Object.keys(result).sort()).toEqual([
        'academicYear',
        'closedAt',
        'createdAt',
        'criteriaId',
        'id',
        'name',
        'openedAt',
        'semester',
        'status',
        'updatedAt',
      ]);
      expect(result.status).toBe('OPEN');
      expectNoWrites();
    });
  });
});
