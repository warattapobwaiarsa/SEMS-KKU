/**
 * PrismaService จำลองแบบ in-memory (plain arrays) สำหรับ e2e test
 *
 * ทำไมต้องมี: e2e ต้องพิสูจน์ JSON ที่ออกจาก API จริงๆ ผ่าน guard/pipe/interceptor/filter
 * แต่ "ห้ามแตะฐานข้อมูลจริง" จึงใช้ข้อมูลในหน่วยความจำนี้แทน
 *
 * หลักการ:
 * - ทำเฉพาะ model/method ที่ service ใช้จริง (Step 4-6) — เรียกอะไรที่ไม่มีจะ throw ชัดเจน
 * - เคารพ `select` เหมือน Prisma (คืนเฉพาะฟิลด์ที่เลือก) เพื่อให้ test จับ leak ได้จริง:
 *   ถ้า service เผลอ select contact/evaluatorId ออกมา response จะมี key แปลกแล้ว test ตก
 * - ไม่มี lock/rollback จริง: $queryRaw (FOR SHARE) เป็น no-op และ $transaction = เรียก callback ตรงๆ
 *   (ขอบเขต test นี้ไม่ได้ทดสอบ concurrency จึงไม่ทำให้ผล test ผิดเพี้ยน)
 */
import {
  EvaluationStatus,
  RoundStatus,
  SubCriteriaType,
  UserRole,
} from '@prisma/client';

/** row ทั่วไปเก็บแบบ record เพื่อให้ project ตาม select ได้ */
type Row = Record<string, unknown>;

/** argument แบบหลวม ให้พอใช้เขียน test ได้โดยไม่ต้องพึ่ง type ทั้งหมดของ Prisma */
interface LooseArgs {
  where?: Row;
  select?: Row;
  data?: Row;
  create?: Row;
  update?: Row;
  orderBy?: unknown;
  skip?: number;
  take?: number;
}

// ---------------------------------------------------------------------------
// ข้อมูลตั้งต้น
// ---------------------------------------------------------------------------

export interface SeedData {
  users: Row[];
  rounds: Row[];
  applicants: Row[];
  criteria: Row[];
  subCriteria: Row[];
  evaluations: Row[];
  evaluationItems: Row[];
  auditLogs: Row[];
}

/**
 * ชุดข้อมูลตามโจทย์ Step 7:
 * - user: admin id 1, evaluator A id 2, evaluator B id 3 (active) + id 4 inactive (ไว้ test guard)
 * - รอบ 2 = OPEN (ผู้สมัคร 1-3), รอบ 3 = CLOSED (ผู้สมัคร 4), รอบ 1 = DRAFT (ผู้สมัคร 5)
 * - 1 ชุดเกณฑ์: 3 ข้อ SCORED (40/30/30) โดยข้อ 3 allowComment = true
 * - ผู้สมัครมี contact (เลขบัตร/เบอร์/อีเมล) ใส่ไว้ใน fake เพื่อให้ test privacy พิสูจน์ว่า leak ไม่ได้
 */
export function createSeedData(): SeedData {
  const now = new Date('2026-10-01T00:00:00.000Z');

  const subCriteria: Row[] = [
    {
      id: 1,
      criteriaId: 1,
      title: 'เกณฑ์ข้อที่ 1 (เต็ม 40)',
      type: SubCriteriaType.SCORED,
      maxScore: 40,
      allowComment: false,
      sortOrder: 1,
    },
    {
      id: 2,
      criteriaId: 1,
      title: 'เกณฑ์ข้อที่ 2 (เต็ม 30)',
      type: SubCriteriaType.SCORED,
      maxScore: 30,
      allowComment: false,
      sortOrder: 2,
    },
    {
      id: 3,
      criteriaId: 1,
      title: 'เกณฑ์ข้อที่ 3 (เต็ม 30)',
      type: SubCriteriaType.SCORED,
      maxScore: 30,
      allowComment: true,
      sortOrder: 3,
    },
  ];

  return {
    users: [
      makeUser(1, 'admin@kku.ac.th', 'แอดมินทดสอบ', UserRole.ADMIN, true),
      makeUser(
        2,
        'evaluator-a@kku.ac.th',
        'evaluator-A-SECRET',
        UserRole.EVALUATOR,
        true,
      ),
      makeUser(
        3,
        'evaluator-b@kku.ac.th',
        'evaluator-B-SECRET',
        UserRole.EVALUATOR,
        true,
      ),
      makeUser(
        4,
        'inactive@kku.ac.th',
        'ปิดใช้งานแล้ว',
        UserRole.EVALUATOR,
        false,
      ),
    ],
    rounds: [
      makeRound(1, RoundStatus.DRAFT, now),
      makeRound(2, RoundStatus.OPEN, now),
      makeRound(3, RoundStatus.CLOSED, now),
    ],
    applicants: [
      makeApplicant(1, 2, 'ST-001', 'ทดสอบ', 'ผู้สมัคร001', now),
      makeApplicant(2, 2, 'ST-002', 'ทดสอบ', 'ผู้สมัคร002', now),
      makeApplicant(3, 2, 'ST-003', 'ทดสอบ', 'ผู้สมัคร003', now),
      makeApplicant(4, 3, 'ST-004', 'ทดสอบ', 'ผู้สมัคร004', now),
      makeApplicant(5, 1, 'ST-005', 'ทดสอบ', 'ผู้สมัคร005', now),
    ],
    criteria: [
      { id: 1, name: 'เกณฑ์ชุดทดสอบ', createdAt: now, updatedAt: now },
    ],
    subCriteria,
    evaluations: [],
    evaluationItems: [],
    auditLogs: [],
  };
}

function makeRound(id: number, status: RoundStatus, now: Date): Row {
  return {
    id,
    name: `รอบทุนทดสอบ ${id}`,
    academicYear: 2569,
    semester: 1,
    criteriaId: 1,
    status,
    createdAt: now,
    openedAt: status === RoundStatus.DRAFT ? null : now,
    closedAt: status === RoundStatus.CLOSED ? now : null,
    updatedAt: now,
    importBatches: [
      {
        id: id,
        roundId: id,
        fileName: `test-round-${id}.xlsx`,
        totalRows: 10,
        validRows: 8,
        invalidRows: 2,
        importedAt: now,
        importedById: 1,
      },
    ],
  };
}

function makeApplicant(
  id: number,
  roundId: number,
  studentCode: string,
  firstName: string,
  lastName: string,
  now: Date,
): Row {
  return {
    id,
    roundId,
    importBatchId: 1,
    legacySeq: id,
    studentCode,
    titlePrefix: 'นาย',
    firstName,
    lastName,
    faculty: 'คณะทดสอบ',
    major: 'วิศวกรรมทดสอบ',
    studyYear: 4,
    gpa: 3.5,
    createdAt: now,
    anonymizedAt: null,
    // ข้อมูล sensitive จริงอยู่คนตาราง — ใส่ไว้ใน fake เพื่อให้ test privacy พิสูจน์ว่า leak ไม่ได้
    contact: {
      applicantId: id,
      phone: `08${String(10000000 + id)}`,
      email: `secret-${id}@example.com`,
      citizenIdEncrypted: `ENCRYPTED-CITIZEN-ID-${id}`,
      citizenIdMasked: `1-2345-XXXXX-XX-${id % 10}`,
    },
    supportingInfo: null,
  };
}

function makeUser(
  id: number,
  email: string,
  name: string,
  role: UserRole,
  isActive: boolean,
): Row {
  const now = new Date('2026-10-01T00:00:00.000Z');
  return {
    id,
    email,
    name,
    role,
    isActive,
    expiresAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

// ---------------------------------------------------------------------------
// select projection — คืนเฉพาะฟิลด์ที่ select ระบุ เหมือน Prisma
// ---------------------------------------------------------------------------

/**
 * คัดเฉพาะ key ที่อยู่ใน select (true = ฟิลด์ธรรมดา, object ที่มี select = relation)
 * เคารพ select จึงทำให้ response ของ e2e ตรงกับที่ Prisma จริงคืนมา
 */
function project(
  row: Row | null | undefined,
  select: Row | undefined,
): unknown {
  if (row === null || row === undefined || select === undefined) {
    return row;
  }
  // If select is empty object, return all fields (Prisma behavior when no select specified)
  if (Object.keys(select).length === 0) {
    return row;
  }
  const out: Row = {};
  for (const [key, value] of Object.entries(select)) {
    if (value === true) {
      out[key] = row[key];
    } else if (value !== null && typeof value === 'object') {
      const childSelect = (value as Row).select as Row | undefined;
      const child = row[key];
      if (Array.isArray(child)) {
        out[key] = child.map((entry) => project(entry as Row, childSelect));
      } else {
        out[key] = project(child as Row | null | undefined, childSelect);
      }
    }
  }
  return out;
}

/** where แบบง่ายตามที่ service ใช้: เทียบค่าตรง + OR/AND + contains (case-insensitive) */
function matchWhere(row: Row, where: Row | undefined): boolean {
  if (where === undefined) {
    return true;
  }
  for (const [key, value] of Object.entries(where)) {
    if (key === 'OR') {
      const conditions = value as Row[];
      if (!conditions.some((condition) => matchWhere(row, condition))) {
        return false;
      }
      continue;
    }
    if (key === 'AND') {
      const conditions = value as Row[];
      if (!conditions.every((condition) => matchWhere(row, condition))) {
        return false;
      }
      continue;
    }
    if (
      value !== null &&
      typeof value === 'object' &&
      'contains' in (value as Row)
    ) {
      const containsValue = (value as Row)['contains'];
      if (typeof containsValue !== 'string') {
        // contains ของ Prisma ใช้กับ string เท่านั้น
        continue;
      }
      const needle = containsValue.toLowerCase();
      const cellValue = row[key];
      const haystack =
        typeof cellValue === 'string' ? cellValue.toLowerCase() : '';
      if (!haystack.includes(needle)) {
        return false;
      }
      continue;
    }
    if (row[key] !== value) {
      return false;
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// FakePrisma — หน้าตาเหมือน PrismaClient ในจุดที่ service เรียกใช้
// ---------------------------------------------------------------------------

export interface SeedEvaluationInput {
  evaluatorId: number;
  applicantId: number;
  status: EvaluationStatus;
  items: Array<{
    subCriteriaId: number;
    score: number | null;
    comment?: string | null;
    textValue?: string | null;
  }>;
  totalScore?: number | null;
  submittedAt?: Date | null;
}

export class FakePrisma {
  readonly data: SeedData = createSeedData();
  private nextEvaluationId = 1;
  private nextItemId = 1;
  private nextAuditId = 1;

  // --- namespace ตามแบบ Prisma (service เรียก prisma.<model>.<method>) ---------

  readonly user = {
    findUnique: (args: LooseArgs): Promise<Row | null> =>
      Promise.resolve(this.findUser(args)),
  };

  readonly scholarshipRound = {
    findUnique: (args: LooseArgs): Promise<Row | null> =>
      Promise.resolve(this.findRound(args)),
  };

  readonly applicant = {
    findUnique: (args: LooseArgs): Promise<Row | null> =>
      Promise.resolve(this.findApplicant(args)),
    findMany: (args: LooseArgs): Promise<Row[]> =>
      Promise.resolve(this.findManyApplicants(args)),
    count: (args: LooseArgs): Promise<number> =>
      Promise.resolve(this.countApplicants(args)),
  };

  readonly evaluation = {
    findUnique: (args: LooseArgs): Promise<Row | null> =>
      Promise.resolve(this.findEvaluation(args)),
    create: (args: LooseArgs): Promise<Row> =>
      Promise.resolve(this.createEvaluation(args)),
    update: (args: LooseArgs): Promise<Row> =>
      Promise.resolve(this.updateEvaluation(args)),
  };

  readonly evaluationItem = {
    upsert: (args: LooseArgs): Promise<Row> =>
      Promise.resolve(this.upsertEvaluationItem(args)),
  };

  readonly auditLog = {
    create: (args: LooseArgs): Promise<Row> =>
      Promise.resolve(this.createAuditLog(args)),
  };

  // --- transaction / raw ---------------------------------------------------------

  /** เรียก callback ตรงๆ — fake ไม่มี rollback จริง (ดูข้อจำกัดใน report) */
  $transaction<T>(fn: (tx: FakePrisma) => Promise<T>): Promise<T> {
    return fn(this);
  }

  /** lock แถว FOR SHARE — ไม่มีผลใน in-memory fake (ไม่มีตารางจริง) */
  $queryRaw(strings: TemplateStringsArray, ...values: unknown[]): unknown[] {
    void strings;
    void values;
    return [];
  }

  // --- เตรียมข้อมูลสำหรับ test (ไม่ใช่ Prisma API) --------------------------------

  /** คืนข้อมูลทุกตารางเป็นชุดตั้งต้นใหม่ (ใช้ beforeEach เพื่อไม่ต้อง compile app ใหม่ทุก test) */
  reset(): void {
    const fresh = createSeedData();
    this.data.users = fresh.users;
    this.data.rounds = fresh.rounds;
    this.data.applicants = fresh.applicants;
    this.data.criteria = fresh.criteria;
    this.data.subCriteria = fresh.subCriteria;
    this.data.evaluations = fresh.evaluations;
    this.data.evaluationItems = fresh.evaluationItems;
    this.data.auditLogs = fresh.auditLogs;
    this.nextEvaluationId = 1;
    this.nextItemId = 1;
    this.nextAuditId = 1;
  }

  /** สร้าง evaluation + items ตรงๆ ใน fake สำหรับเตรียมข้อมูลก่อนเรียก API */
  seedEvaluation(input: SeedEvaluationInput): number {
    const id = this.nextEvaluationId++;
    const now = new Date('2026-10-05T00:00:00.000Z');
    this.data.evaluations.push({
      id,
      applicantId: input.applicantId,
      evaluatorId: input.evaluatorId,
      status: input.status,
      totalScore: input.totalScore ?? null,
      createdAt: now,
      updatedAt: now,
      submittedAt: input.submittedAt ?? null,
    });
    for (const item of input.items) {
      this.data.evaluationItems.push({
        id: this.nextItemId++,
        evaluationId: id,
        subCriteriaId: item.subCriteriaId,
        score: item.score,
        comment: item.comment ?? null,
        textValue: item.textValue ?? null,
      });
    }
    return id;
  }

  // --- ผลลัพธ์ของ model ต่างๆ ------------------------------------------------------

  private findUser(args: LooseArgs): Row | null {
    const id = (args.where ?? {})['id'];
    return this.data.users.find((user) => user['id'] === id) ?? null;
  }

  private findRound(args: LooseArgs): Row | null {
    const id = (args.where ?? {})['id'];
    const round = this.data.rounds.find((row) => row['id'] === id);
    if (round === undefined) {
      return null;
    }
    const withCriteria: Row = { ...round, criteria: this.buildCriteria() };
    // Handle _count.applicants if requested in select or include
    const select = (args.select ?? args.include ?? {}) as Row;
    if (
      (select._count as Row | undefined)?.select?.applicants ||
      (select._count as Row | undefined)?.applicants === true
    ) {
      const applicantCount = this.data.applicants.filter(
        (a) => a['roundId'] === id,
      ).length;
      withCriteria._count = { applicants: applicantCount };
    }
    return project(withCriteria, select) as Row;
  }

  private findApplicant(args: LooseArgs): Row | null {
    const id = (args.where ?? {})['id'];
    const applicant = this.data.applicants.find((row) => row['id'] === id);
    if (applicant === undefined) {
      return null;
    }
    const round = this.data.rounds.find(
      (row) => row['id'] === applicant['roundId'],
    );
    const withRelations: Row = {
      ...applicant,
      round:
        round === undefined
          ? null
          : { ...round, criteria: this.buildCriteria() },
      contact: applicant.contact ?? null,
      supportingInfo: applicant.supportingInfo ?? null,
    };
    // Handle both select and include (service uses include)
    const select = (args.select ?? args.include ?? {}) as Row;
    return project(withRelations, select) as Row;
  }

  private findManyApplicants(args: LooseArgs): Row[] {
    const select = args.select ?? {};
    // select พิเศษ 2 ตัวนี้ service ให้คำนวณเอง จึงไม่ส่งเข้า project
    const plainSelect: Row = { ...select };
    delete plainSelect['_count'];
    delete plainSelect['evaluations'];

    const matched = this.data.applicants.filter((row) =>
      matchWhere(row, args.where),
    );
    // เรียง studentCode asc แล้วตาม id asc แบบเดียวกับ service [FR-SYS-04]
    matched.sort((a, b) => {
      const codeA = String(a['studentCode']);
      const codeB = String(b['studentCode']);
      if (codeA !== codeB) {
        return codeA < codeB ? -1 : 1;
      }
      return Number(a['id']) - Number(b['id']);
    });
    const skip = args.skip ?? 0;
    const take = args.take ?? matched.length;
    const page = matched.slice(skip, skip + take);

    const evaluationsSelect = (select['evaluations'] as Row | undefined) ?? {};
    const evaluationsWhere =
      (evaluationsSelect['where'] as Row | undefined) ?? {};
    const evaluationsChildSelect =
      (evaluationsSelect['select'] as Row | undefined) ?? {};
    const ownEvaluatorId = evaluationsWhere['evaluatorId'];

    return page.map((row) => {
      const base = project(row, plainSelect) as Row;
      const out: Row = { ...base };
      if ('_count' in select) {
        // submittedCount นับเฉพาะ SUBMITTED เท่านั้น (Draft ไม่นับ) [BR-SCR-01]
        out['_count'] = {
          evaluations: this.data.evaluations.filter(
            (evaluation) =>
              evaluation['applicantId'] === row['id'] &&
              evaluation['status'] === EvaluationStatus.SUBMITTED,
          ).length,
        };
      }
      if ('evaluations' in select) {
        out['evaluations'] = this.data.evaluations
          .filter(
            (evaluation) =>
              evaluation['applicantId'] === row['id'] &&
              evaluation['evaluatorId'] === ownEvaluatorId,
          )
          .map((evaluation) => project(evaluation, evaluationsChildSelect));
      }
      return out;
    });
  }

  private countApplicants(args: LooseArgs): number {
    return this.data.applicants.filter((row) => matchWhere(row, args.where))
      .length;
  }

  private findEvaluation(args: LooseArgs): Row | null {
    const key = (args.where ?? {})['evaluatorId_applicantId'] as
      { evaluatorId: number; applicantId: number } | undefined;
    if (key === undefined) {
      return null;
    }
    const evaluation = this.data.evaluations.find(
      (row) =>
        row['evaluatorId'] === key.evaluatorId &&
        row['applicantId'] === key.applicantId,
    );
    if (evaluation === undefined) {
      return null;
    }
    return project(this.withItems(evaluation), args.select) as Row;
  }

  private createEvaluation(args: LooseArgs): Row {
    const data = args.data ?? {};
    const now = new Date();
    const evaluation: Row = {
      id: this.nextEvaluationId++,
      applicantId: data['applicantId'],
      evaluatorId: data['evaluatorId'],
      status: data['status'] ?? EvaluationStatus.DRAFT,
      totalScore: null,
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
    };
    this.data.evaluations.push(evaluation);
    return project(this.withItems(evaluation), args.select) as Row;
  }

  private updateEvaluation(args: LooseArgs): Row {
    const id = (args.where ?? {})['id'];
    const evaluation = this.data.evaluations.find((row) => row['id'] === id);
    if (evaluation === undefined) {
      throw new Error(`FakePrisma: evaluation ${String(id)} not found`);
    }
    const data = args.data ?? {};
    for (const [key, value] of Object.entries(data)) {
      evaluation[key] = value;
    }
    // เคารพ @updatedAt ของ Prisma: caller ไม่ส่งมาเองก็ต้องขยับอัตโนมัติ
    if (!('updatedAt' in data)) {
      evaluation['updatedAt'] = new Date();
    }
    return project(this.withItems(evaluation), args.select) as Row;
  }

  private upsertEvaluationItem(args: LooseArgs): Row {
    const key = (args.where ?? {})['evaluationId_subCriteriaId'] as
      { evaluationId: number; subCriteriaId: number } | undefined;
    if (key === undefined) {
      throw new Error(
        'FakePrisma: upsertEvaluationItem ไม่มี evaluationId_subCriteriaId',
      );
    }
    const existing = this.data.evaluationItems.find(
      (row) =>
        row['evaluationId'] === key.evaluationId &&
        row['subCriteriaId'] === key.subCriteriaId,
    );
    if (existing !== undefined) {
      for (const [field, value] of Object.entries(args.update ?? {})) {
        existing[field] = value;
      }
      return existing;
    }
    const create = args.create ?? {};
    const item: Row = {
      id: this.nextItemId++,
      evaluationId: create['evaluationId'] ?? key.evaluationId,
      subCriteriaId: create['subCriteriaId'] ?? key.subCriteriaId,
      score: create['score'] ?? null,
      comment: create['comment'] ?? null,
      textValue: create['textValue'] ?? null,
    };
    this.data.evaluationItems.push(item);
    return item;
  }

  private createAuditLog(args: LooseArgs): Row {
    const log: Row = {
      id: BigInt(this.nextAuditId++),
      createdAt: new Date(),
      ...(args.data ?? {}),
    };
    this.data.auditLogs.push(log);
    return log;
  }

  // --- helper ----------------------------------------------------------------------

  /** ชุดเกณฑ์ (criteria id แรก) พร้อม subCriteria เรียงตาม sortOrder */
  private buildCriteria(): Row | null {
    const criteria = this.data.criteria[0];
    if (criteria === undefined) {
      return null;
    }
    return {
      ...criteria,
      subCriteria: [...this.data.subCriteria],
    };
  }

  private withItems(evaluation: Row): Row {
    const items = this.data.evaluationItems.filter(
      (item) => item['evaluationId'] === evaluation['id'],
    );
    return { ...evaluation, items };
  }
}
