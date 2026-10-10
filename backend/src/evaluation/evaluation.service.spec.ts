/**
 * Unit test ของ EvaluationService.listApplicantsForEvaluator
 * (ไม่ต่อฐานข้อมูลจริง ใช้ mock PrismaService)
 * [FR-EVL-01] [BR-EVL-01] [FR-EVL-03] [BR-USR-11] [BR-SCR-01] [FR-APP-03]
 */
import { Prisma, RoundStatus, User, UserRole } from '@prisma/client';
import { AppException } from '../common/exceptions/app.exception';
import { PrismaService } from '../prisma/prisma.service';
import { ListApplicantsQueryDto } from './dto/list-applicants-query.dto';
import { EvaluationService } from './evaluation.service';

// mock ฟังก์ชันของ PrismaService ที่ service ใช้จริง
const roundFindUniqueMock = jest.fn();
const applicantFindManyMock = jest.fn();
const applicantCountMock = jest.fn();
const mockPrismaService = {
  scholarshipRound: { findUnique: roundFindUniqueMock },
  applicant: { findMany: applicantFindManyMock, count: applicantCountMock },
} as unknown as PrismaService;

// รายชื่อ key ที่ "อนุญาต" ให้ส่งกลับ ต้องตรงทุกตัว ไม่มากไม่น้อย
const ALLOWED_ITEM_KEYS = [
  'canStart',
  'faculty',
  'firstName',
  'gpa',
  'id',
  'lastName',
  'legacySeq',
  'major',
  'myStatus',
  'roundId',
  'studentCode',
  'studyYear',
  'submittedCount',
  'titlePrefix',
];

// ฟังก์ชันช่วยสร้าง User ปลอม (ค่าเริ่มต้น = evaluator id 2 ไม่มีวันหมดอายุ)
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

// ฟังก์ชันช่วยสร้างแถวผู้สมัคร "ตามที่ Prisma คืนมาจาก select"
// submittedCount = ค่าที่ DB นับให้ (_count ที่กรองเฉพาะ SUBMITTED แล้ว)
// myStatuses = ผลประเมินของ "ตัวเอง" (where evaluatorId = ผู้เรียก)
function createApplicantRow(
  id: number,
  studentCode: string,
  submittedCount: number,
  myStatuses: Array<'DRAFT' | 'SUBMITTED'>,
) {
  return {
    id,
    roundId: 2,
    legacySeq: id,
    studentCode,
    titlePrefix: 'นาย',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    faculty: 'คณะวิทยาการคอมพิวเตอร์',
    major: 'วิทยาการคอมพิวเตอร์',
    studyYear: 3,
    gpa: new Prisma.Decimal('3.25'),
    _count: { evaluations: submittedCount },
    evaluations: myStatuses.map((status) => ({ status })),
  };
}

// ฟังก์ชันช่วยสร้าง query DTO
function createQuery(
  overrides: Partial<ListApplicantsQueryDto>,
): ListApplicantsQueryDto {
  const query = new ListApplicantsQueryDto();
  return Object.assign(query, overrides);
}

// ฟังก์ชันช่วยจับ error ที่ service โยนออกมา
async function catchError(action: () => Promise<unknown>): Promise<unknown> {
  try {
    await action();
  } catch (error) {
    return error;
  }
  return undefined;
}

// ดึง argument ที่ส่งให้ prisma.applicant.findMany ในการเรียกครั้งแรก
interface FindManyArgs {
  where: Prisma.ApplicantWhereInput;
  orderBy: unknown;
  skip: number;
  take: number;
  select: Record<string, unknown>;
}
function getFindManyArgs(): FindManyArgs {
  const firstCall = applicantFindManyMock.mock.calls[0] as [FindManyArgs];
  return firstCall[0];
}

describe('EvaluationService.listApplicantsForEvaluator', () => {
  let service: EvaluationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EvaluationService(mockPrismaService);
    // ค่าเริ่มต้น: รอบ OPEN และไม่มีผู้สมัคร
    roundFindUniqueMock.mockResolvedValue({ id: 2, status: RoundStatus.OPEN });
    applicantFindManyMock.mockResolvedValue([]);
    applicantCountMock.mockResolvedValue(0);
  });

  describe('การตรวจรอบทุน (404 กัน IDOR)', () => {
    it.each([RoundStatus.DRAFT, RoundStatus.CLOSED])(
      'ตอบ 404 NOT_FOUND เมื่อรอบเป็น %s',
      async (status) => {
        roundFindUniqueMock.mockResolvedValue({ id: 1, status });

        const error = await catchError(() =>
          service.listApplicantsForEvaluator(
            1,
            createMockUser({}),
            createQuery({}),
          ),
        );

        expect(error).toBeInstanceOf(AppException);
        expect((error as AppException).errorCode).toBe('NOT_FOUND');
        expect((error as AppException).getStatus()).toBe(404);
        // ต้องไม่ไปดึงข้อมูลผู้สมัครเลย
        expect(applicantFindManyMock).not.toHaveBeenCalled();
      },
    );

    it('ตอบ 404 NOT_FOUND แบบเดียวกันเมื่อไม่มีรอบนี้ในระบบ', async () => {
      roundFindUniqueMock.mockResolvedValue(null);

      const error = await catchError(() =>
        service.listApplicantsForEvaluator(
          9999,
          createMockUser({}),
          createQuery({}),
        ),
      );

      expect(error).toBeInstanceOf(AppException);
      expect((error as AppException).errorCode).toBe('NOT_FOUND');
      expect((error as AppException).getStatus()).toBe(404);
      expect(roundFindUniqueMock).toHaveBeenCalledWith({
        where: { id: 9999 },
        select: { id: true, status: true },
      });
      expect(applicantFindManyMock).not.toHaveBeenCalled();
    });
  });

  describe('submittedCount และ myStatus [BR-SCR-01]', () => {
    it('submittedCount นับเฉพาะ SUBMITTED (query กรอง status = SUBMITTED)', async () => {
      applicantFindManyMock.mockResolvedValue([
        createApplicantRow(10, 'FAKE-OPEN-01', 2, []),
      ]);
      applicantCountMock.mockResolvedValue(1);

      const result = await service.listApplicantsForEvaluator(
        2,
        createMockUser({}),
        createQuery({}),
      );

      expect(result.data[0].submittedCount).toBe(2);
      // ตรวจว่า query นับเฉพาะ SUBMITTED เท่านั้น Draft จึงไม่ถูกนับ
      const args = getFindManyArgs();
      expect(args.select._count).toEqual({
        select: { evaluations: { where: { status: 'SUBMITTED' } } },
      });
    });

    it('myStatus ดึงจากผลของผู้เรียกเท่านั้น (where evaluatorId = ผู้เรียก)', async () => {
      // ผู้สมัครคนนี้มีคนอื่น Submit ไปแล้ว 1 คน แต่ตัวเรายังไม่เริ่ม
      applicantFindManyMock.mockResolvedValue([
        createApplicantRow(10, 'FAKE-OPEN-01', 1, []),
      ]);
      applicantCountMock.mockResolvedValue(1);

      const result = await service.listApplicantsForEvaluator(
        2,
        createMockUser({ id: 3 }),
        createQuery({}),
      );

      // ผลของคนอื่นไม่ทำให้ myStatus ของเราเปลี่ยน
      expect(result.data[0].myStatus).toBe('NOT_STARTED');
      expect(result.data[0].submittedCount).toBe(1);
      const args = getFindManyArgs();
      expect(args.select.evaluations).toEqual({
        where: { evaluatorId: 3 },
        select: { status: true },
      });
    });

    it('แปลงสถานะของตัวเองเป็น DRAFT / SUBMITTED / NOT_STARTED ถูกต้อง', async () => {
      applicantFindManyMock.mockResolvedValue([
        createApplicantRow(10, 'FAKE-OPEN-01', 0, ['DRAFT']),
        createApplicantRow(11, 'FAKE-OPEN-02', 1, ['SUBMITTED']),
        createApplicantRow(12, 'FAKE-OPEN-03', 0, []),
      ]);
      applicantCountMock.mockResolvedValue(3);

      const result = await service.listApplicantsForEvaluator(
        2,
        createMockUser({}),
        createQuery({}),
      );

      expect(result.data.map((item) => item.myStatus)).toEqual([
        'DRAFT',
        'SUBMITTED',
        'NOT_STARTED',
      ]);
    });
  });

  describe('ไม่ส่งข้อมูลส่วนบุคคลต้องห้าม [FR-APP-03] [BR-APP-04] [BR-PDP-05]', () => {
    it('ผลลัพธ์แต่ละแถวมี key ตรงตามรายการที่อนุญาตเท่านั้น', async () => {
      applicantFindManyMock.mockResolvedValue([
        createApplicantRow(10, 'FAKE-OPEN-01', 0, []),
      ]);
      applicantCountMock.mockResolvedValue(1);

      const result = await service.listApplicantsForEvaluator(
        2,
        createMockUser({}),
        createQuery({}),
      );

      const itemKeys = Object.keys(result.data[0]).sort();
      expect(itemKeys).toEqual(ALLOWED_ITEM_KEYS);
      expect(itemKeys).not.toContain('citizenId');
      expect(itemKeys).not.toContain('citizenIdEncrypted');
      expect(itemKeys).not.toContain('citizenIdMasked');
      expect(itemKeys).not.toContain('phone');
      expect(itemKeys).not.toContain('email');
      expect(itemKeys).not.toContain('contact');
      expect(itemKeys).not.toContain('supportingInfo');
    });

    it('query ใช้ select และไม่ขอ contact / เลขบัตร / เบอร์ / อีเมล', async () => {
      await service.listApplicantsForEvaluator(
        2,
        createMockUser({}),
        createQuery({}),
      );

      const args = getFindManyArgs();
      expect(args.select).toBeDefined();
      expect(args).not.toHaveProperty('include');
      const selectedKeys = Object.keys(args.select);
      const forbiddenKeys = [
        'contact',
        'supportingInfo',
        'citizenId',
        'citizenIdEncrypted',
        'citizenIdMasked',
        'phone',
        'email',
      ];
      for (const forbiddenKey of forbiddenKeys) {
        expect(selectedKeys).not.toContain(forbiddenKey);
      }
    });
  });

  describe('การค้นหาและการแบ่งหน้า [FR-EVL-01]', () => {
    it('ไม่มีคำค้น -> กรองเฉพาะรอบ และเรียงลำดับคงที่', async () => {
      await service.listApplicantsForEvaluator(
        2,
        createMockUser({}),
        createQuery({}),
      );

      const args = getFindManyArgs();
      expect(args.where).toEqual({ roundId: 2 });
      expect(args.orderBy).toEqual([{ studentCode: 'asc' }, { id: 'asc' }]);
      expect(applicantCountMock).toHaveBeenCalledWith({
        where: { roundId: 2 },
      });
    });

    it('ค้นด้วยรหัสนักศึกษา -> ค้นในรหัส ชื่อ และนามสกุล แบบบางส่วน', async () => {
      await service.listApplicantsForEvaluator(
        2,
        createMockUser({}),
        createQuery({ search: ' FAKE-OPEN-03 ' }),
      );

      const args = getFindManyArgs();
      expect(args.where).toEqual({
        roundId: 2,
        OR: [
          { studentCode: { contains: 'FAKE-OPEN-03', mode: 'insensitive' } },
          { firstName: { contains: 'FAKE-OPEN-03', mode: 'insensitive' } },
          { lastName: { contains: 'FAKE-OPEN-03', mode: 'insensitive' } },
        ],
      });
    });

    it('ค้นด้วยชื่อเต็ม "ชื่อ นามสกุล" -> เพิ่มเงื่อนไขชื่อ + นามสกุลคู่กัน', async () => {
      await service.listApplicantsForEvaluator(
        2,
        createMockUser({}),
        createQuery({ search: 'สมชาย ใจ' }),
      );

      const args = getFindManyArgs();
      expect(args.where.roundId).toBe(2);
      expect(args.where.OR).toContainEqual({
        AND: [
          { firstName: { contains: 'สมชาย', mode: 'insensitive' } },
          { lastName: { contains: 'ใจ', mode: 'insensitive' } },
        ],
      });
    });

    it('คำนวณ skip / take และ meta ของการแบ่งหน้าถูกต้อง', async () => {
      applicantFindManyMock.mockResolvedValue([
        createApplicantRow(15, 'FAKE-OPEN-05', 0, []),
      ]);
      applicantCountMock.mockResolvedValue(5);

      const result = await service.listApplicantsForEvaluator(
        2,
        createMockUser({}),
        createQuery({ page: 3, limit: 2 }),
      );

      const args = getFindManyArgs();
      expect(args.skip).toBe(4);
      expect(args.take).toBe(2);
      expect(result.meta).toEqual({
        page: 3,
        limit: 2,
        total: 5,
        totalPages: 3,
      });
    });

    it('ใช้ page = 1 และ limit = 20 เป็นค่าเริ่มต้น', async () => {
      const result = await service.listApplicantsForEvaluator(
        2,
        createMockUser({}),
        createQuery({}),
      );

      const args = getFindManyArgs();
      expect(args.skip).toBe(0);
      expect(args.take).toBe(20);
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    });

    it('แปลง gpa จาก Decimal เป็นตัวเลข', async () => {
      applicantFindManyMock.mockResolvedValue([
        createApplicantRow(10, 'FAKE-OPEN-01', 0, []),
      ]);
      applicantCountMock.mockResolvedValue(1);

      const result = await service.listApplicantsForEvaluator(
        2,
        createMockUser({}),
        createQuery({}),
      );

      expect(result.data[0].gpa).toBe(3.25);
    });
  });

  describe('canStart ของบัญชีหมดอายุแต่ยังเปิดอยู่ [FR-EVL-03] [BR-USR-11]', () => {
    const expiredUser = createMockUser({
      expiresAt: new Date('2020-01-01T00:00:00.000Z'),
    });

    it('หมดอายุ + ไม่มี Draft -> canStart = false', async () => {
      applicantFindManyMock.mockResolvedValue([
        createApplicantRow(10, 'FAKE-OPEN-01', 0, []),
      ]);
      applicantCountMock.mockResolvedValue(1);

      const result = await service.listApplicantsForEvaluator(
        2,
        expiredUser,
        createQuery({}),
      );

      expect(result.data[0].canStart).toBe(false);
    });

    it('หมดอายุ + มี Draft อยู่แล้ว -> canStart = true', async () => {
      applicantFindManyMock.mockResolvedValue([
        createApplicantRow(10, 'FAKE-OPEN-01', 0, ['DRAFT']),
      ]);
      applicantCountMock.mockResolvedValue(1);

      const result = await service.listApplicantsForEvaluator(
        2,
        expiredUser,
        createQuery({}),
      );

      expect(result.data[0].canStart).toBe(true);
    });

    it('ยังไม่หมดอายุ (วันหมดอายุในอนาคต) + ไม่มี Draft -> canStart = true', async () => {
      applicantFindManyMock.mockResolvedValue([
        createApplicantRow(10, 'FAKE-OPEN-01', 0, []),
      ]);
      applicantCountMock.mockResolvedValue(1);

      const result = await service.listApplicantsForEvaluator(
        2,
        createMockUser({ expiresAt: new Date('2099-01-01T00:00:00.000Z') }),
        createQuery({}),
      );

      expect(result.data[0].canStart).toBe(true);
    });
  });
});
