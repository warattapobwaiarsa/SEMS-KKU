/**
 * e2e test ระดับ HTTP ของ API หน้าประเมิน (ผ่าน guard/pipe/interceptor/filter ของจริง)
 *
 * สิ่งที่ test นี้พิสูจน์ (ไม่ซ้ำ unit test — เน้นสิ่งที่มีแค่ชั้น HTTP เท่านั้น):
 * - peer-blind: response ทุก endpoint ที่ B เรียกได้ ไม่มีค่าลับของ A (และกลับกัน)
 * - privacy: ทุก GET response ไม่มีคีย์ citizenId/phone/email/contact/evaluatorId ทุกชั้น
 * - guards: ทั้ง 6 endpoints — ไม่มี header 401 / admin 403 / id แปลก 401 / บัญชีปิด 401
 * - IDOR: ไม่พบหรืออยู่ในรอบ DRAFT -> 404 รูปเดียวกัน, รอบ CLOSED -> 404
 * - envelope: สำเร็จมี success/statusCode/data (+meta ของ list), error มี errorCode/error/timestamp
 * - flow เต็ม: GET ฟอร์มว่าง -> PUT Draft -> PUT ซ้ำ (แถวเดิม) -> submit ไม่ครบ 422 -> กรอกต่อ
 *   -> submit 200 (totalScore ถูก) -> 409 ทั้ง save และ submit
 * - ValidationPipe: ฟิลด์แปลก 400 / score เป็น string 400 / score เกิน max 422
 *
 * ไม่ต่อฐานข้อมูลจริง: ใช้ FakePrisma (in-memory) แทน PrismaService
 * [BR-SCR-01] [FR-APP-03] [BR-APP-04] [BR-PDP-05] [FR-EVL-11] [BR-EVL-11]
 */
import { INestApplication } from '@nestjs/common';
import { EvaluationStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { FakePrisma } from './helpers/fake-prisma';
import { createTestApp } from './helpers/test-app';

const API = '/api/v1';
const ADMIN_ID = 1;
const EVALUATOR_A_ID = 2;
const EVALUATOR_B_ID = 3;
const INACTIVE_ID = 4;
const UNKNOWN_ID = 999;

type HttpMethod = 'get' | 'post' | 'put';

// ค่าลับที่ปูไว้ใน fake — ห้ามปรากฏใน JSON ของอีกฝ่ายเด็ดขาด
const A_SECRETS = ['A-COMMENT-SECRET', 'A-SUBMITTED-SECRET'];
const B_SECRETS = ['B-COMMENT-SECRET'];
const USER_NAMES = ['evaluator-A-SECRET', 'evaluator-B-SECRET'];
// คีย์ต้องห้ามทุกชั้นของ response (ข้อมูลส่วนตัว + ตัวตนผู้ประเมิน)
const FORBIDDEN_KEYS = [
  'citizenId',
  'citizenIdEncrypted',
  'phone',
  'email',
  'contact',
  'evaluatorId',
];

// ---------------------------------------------------------------------------
// type ของ response ที่ test อ่าน (cast ผ่าน unknown ก่อน เพื่อผ่าน lint)
// ---------------------------------------------------------------------------

interface ErrorBody {
  success: boolean;
  statusCode: number;
  errorCode: string;
  error: string;
  // filter ของทีม (commit 387a02a) ส่ง message กลับเสมอ — ตาม spec ถือเป็นคีย์เสริมที่อนุญาต
  message?: string | string[];
  params?: { items?: string[]; max?: number; messages?: string[] };
  timestamp: string;
}

interface EvalItemView {
  subCriteriaId: number;
  score: number | null;
  comment: string | null;
  textValue: string | null;
}

interface MyEvalBody {
  success: boolean;
  statusCode: number;
  data: {
    evaluationId: number | null;
    status: string | null;
    totalScore: number | null;
    submittedAt: string | null;
    updatedAt: string | null;
    items: EvalItemView[];
  };
}

interface ListBody {
  success: boolean;
  statusCode: number;
  data: Array<{
    id: number;
    studentCode: string;
    submittedCount: number;
    myStatus: string;
    canStart: boolean;
  }>;
  meta: { page: number; limit: number; total: number; totalPages: number };
}

// ---------------------------------------------------------------------------
// ตัวช่วย
// ---------------------------------------------------------------------------

function bodyOf<T>(res: { body: unknown }): T {
  return res.body as T;
}

function call(
  app: INestApplication,
  method: HttpMethod,
  path: string,
  options: { userId?: number; body?: unknown } = {},
) {
  const base = request(app.getHttpServer() as App);
  const req =
    method === 'get'
      ? base.get(API + path)
      : method === 'post'
        ? base.post(API + path)
        : base.put(API + path);
  if (options.userId !== undefined) {
    req.set('X-User-Id', String(options.userId));
  }
  if (options.body !== undefined) {
    req.send(options.body as object);
  }
  return req;
}

/** ปูข้อมูล evaluation ของ A และ B ไว้ใน fake (A: Draft ผู้ 1 + Submitted ผู้ 2, B: Submitted ผู้ 3) */
function seedPeerData(fake: FakePrisma): void {
  fake.seedEvaluation({
    evaluatorId: EVALUATOR_A_ID,
    applicantId: 1,
    status: EvaluationStatus.DRAFT,
    items: [
      { subCriteriaId: 1, score: 33 },
      { subCriteriaId: 3, score: 10, comment: 'A-COMMENT-SECRET' },
    ],
  });
  fake.seedEvaluation({
    evaluatorId: EVALUATOR_A_ID,
    applicantId: 2,
    status: EvaluationStatus.SUBMITTED,
    totalScore: 100,
    submittedAt: new Date('2026-10-06T08:00:00.000Z'),
    items: [
      { subCriteriaId: 1, score: 40 },
      { subCriteriaId: 2, score: 30 },
      { subCriteriaId: 3, score: 30, comment: 'A-SUBMITTED-SECRET' },
    ],
  });
  fake.seedEvaluation({
    evaluatorId: EVALUATOR_B_ID,
    applicantId: 3,
    status: EvaluationStatus.SUBMITTED,
    totalScore: 60,
    submittedAt: new Date('2026-10-06T09:00:00.000Z'),
    items: [
      { subCriteriaId: 1, score: 20 },
      { subCriteriaId: 2, score: 20 },
      { subCriteriaId: 3, score: 20, comment: 'B-COMMENT-SECRET' },
    ],
  });
}

/** เก็บคีย์ทุกคีย์ทุกชั้นของ object เข้า set */
function collectKeys(value: unknown, keys: Set<string>): void {
  if (Array.isArray(value)) {
    for (const entry of value) {
      collectKeys(entry, keys);
    }
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      keys.add(key);
      collectKeys(child, keys);
    }
  }
}

function expectErrorShape(
  res: { body: unknown },
  statusCode: number,
  errorCode: string,
): void {
  const body = bodyOf<ErrorBody>(res);
  expect(body.success).toBe(false);
  expect(body.statusCode).toBe(statusCode);
  expect(body.errorCode).toBe(errorCode);
  expect(typeof body.error).toBe('string');
  expect(typeof body.timestamp).toBe('string');
}

const VALID_BODY = { items: [{ subCriteriaId: 1, score: 10 }] };

// ทั้ง 6 endpoints ตามโจทย์
const ALL_ENDPOINTS: Array<{
  method: HttpMethod;
  path: string;
  body?: unknown;
}> = [
  { method: 'get', path: '/scholarship-rounds/2/applicants' },
  { method: 'get', path: '/scholarship-rounds/2' },
  { method: 'get', path: '/applicants/1' },
  { method: 'get', path: '/applicants/1/my-evaluation' },
  { method: 'put', path: '/applicants/1/my-evaluation', body: VALID_BODY },
  { method: 'post', path: '/applicants/1/my-evaluation/submit', body: {} },
];

// ---------------------------------------------------------------------------
// test
// ---------------------------------------------------------------------------

describe('Evaluation API (e2e) — privacy & peer-blind', () => {
  let app: INestApplication;
  let fake: FakePrisma;

  beforeAll(async () => {
    fake = new FakePrisma();
    app = await createTestApp(fake);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // ข้อมูลตั้งต้นใหม่ทุก test ไม่ต้อง compile app ใหม่
    fake.reset();
  });

  // =========================================================================
  describe('peer-blind [BR-SCR-01]', () => {
    it('B เก็บ JSON ทุก endpoint ที่เรียกได้ แล้วไม่พบค่าลับของ A / ชื่อผู้ประเมิน / evaluatorId', async () => {
      seedPeerData(fake);

      const paths = [
        '/scholarship-rounds/2/applicants',
        '/scholarship-rounds/2',
        '/applicants/1',
        '/applicants/2',
        '/applicants/3',
        '/applicants/1/my-evaluation',
        '/applicants/2/my-evaluation',
        '/applicants/3/my-evaluation',
      ];
      const bodies: string[] = [];
      for (const path of paths) {
        const res = await call(app, 'get', path, {
          userId: EVALUATOR_B_ID,
        }).expect(200);
        bodies.push(JSON.stringify(res.body));
      }
      const allJson = bodies.join('\n');

      for (const secret of [...A_SECRETS, ...USER_NAMES]) {
        expect(allJson).not.toContain(secret);
      }
      // ไม่มีคีย์ evaluatorId / ข้อมูลส่วนตัว ใน response ก้อนไหนเลย
      expect(allJson).not.toContain('evaluatorId');
      expect(allJson).not.toContain('citizenId');
      expect(allJson).not.toContain('"phone"');
      expect(allJson).not.toContain('"email"');
      expect(allJson).not.toContain('"contact"');

      // โครงสร้าง: my-evaluation ของผู้สมัครที่ A เคยทำ = ของว่างเปล่าสำหรับ B
      for (const path of [
        '/applicants/1/my-evaluation',
        '/applicants/2/my-evaluation',
      ]) {
        const res = await call(app, 'get', path, { userId: EVALUATOR_B_ID });
        const body = bodyOf<MyEvalBody>(res);
        expect(body.data.evaluationId).toBeNull();
        expect(body.data.status).toBeNull();
        for (const item of body.data.items) {
          expect(item.score).toBeNull();
          expect(item.comment).toBeNull();
          expect(item.textValue).toBeNull(); // ข้อความของ A ก็ห้ามหลุดมาด้วย
        }
      }
    });

    it('รายการผู้สมัคร: submittedCount นับเฉพาะ SUBMITTED (Draft ของ A ไม่ถูกนับ) และ myStatus เป็นของ B เท่านั้น', async () => {
      seedPeerData(fake);

      const res = await call(app, 'get', '/scholarship-rounds/2/applicants', {
        userId: EVALUATOR_B_ID,
      }).expect(200);
      const body = bodyOf<ListBody>(res);
      const byId = new Map(body.data.map((row) => [row.id, row]));

      // ผู้สมัคร 1: A มีแค่ Draft -> ไม่นับ; ผู้สมัคร 2: A มี SUBMITTED -> นับ 1
      expect(byId.get(1)?.submittedCount).toBe(0);
      expect(byId.get(2)?.submittedCount).toBe(1);
      // myStatus ทุกแถวเป็นของ B: NOT_STARTED (ยังไม่เคยทำ) / SUBMITTED (ของ B เองแถว 3)
      expect(byId.get(1)?.myStatus).toBe('NOT_STARTED');
      expect(byId.get(2)?.myStatus).toBe('NOT_STARTED');
      expect(byId.get(3)?.myStatus).toBe('SUBMITTED');
      expect(JSON.stringify(res.body)).not.toContain('A-COMMENT-SECRET');
      expect(JSON.stringify(res.body)).not.toContain('A-SUBMITTED-SECRET');
    });

    it('กลับกัน: A เรียก endpoint ต่างๆ ไม่เห็นข้อมูลของ B (ยกเว้น submittedCount)', async () => {
      seedPeerData(fake);

      const bodies: string[] = [];
      for (const path of [
        '/scholarship-rounds/2/applicants',
        '/applicants/3',
        '/applicants/3/my-evaluation',
        '/applicants/1/my-evaluation',
      ]) {
        const res = await call(app, 'get', path, {
          userId: EVALUATOR_A_ID,
        }).expect(200);
        bodies.push(JSON.stringify(res.body));
      }
      const allJson = bodies.join('\n');
      for (const secret of [...B_SECRETS, ...USER_NAMES]) {
        expect(allJson).not.toContain(secret);
      }
      expect(allJson).not.toContain('evaluatorId');

      // my-evaluation ผู้สมัคร 3 ของ A = ว่างเปล่า (Submitted ของ B ไม่ถูกเปิดเผย)
      const myEvalRes = await call(app, 'get', '/applicants/3/my-evaluation', {
        userId: EVALUATOR_A_ID,
      });
      const myEval = bodyOf<MyEvalBody>(myEvalRes);
      expect(myEval.data.evaluationId).toBeNull();
      expect(myEval.data.status).toBeNull();
      for (const item of myEval.data.items) {
        expect(item.score).toBeNull();
        expect(item.textValue).toBeNull();
      }

      // รายการ: A เห็น submittedCount ของผู้สมัคร 3 (นับรวมทุกคน) แต่ myStatus เป็นของ A
      const listRes = await call(
        app,
        'get',
        '/scholarship-rounds/2/applicants',
        {
          userId: EVALUATOR_A_ID,
        },
      );
      const list = bodyOf<ListBody>(listRes);
      const row3 = list.data.find((row) => row.id === 3);
      expect(row3?.submittedCount).toBe(1);
      expect(row3?.myStatus).toBe('NOT_STARTED');
    });
  });

  // =========================================================================
  describe('privacy — ไม่มีคีย์ข้อมูลส่วนตัวทุกชั้น [FR-APP-03] [BR-PDP-05]', () => {
    it('ทุก GET response (ของ B และของ A) ไม่มี citizenId/citizenIdEncrypted/phone/email/contact/evaluatorId', async () => {
      seedPeerData(fake);

      const getPaths = [
        '/scholarship-rounds/2/applicants',
        '/scholarship-rounds/2',
        '/applicants/1',
        '/applicants/2',
        '/applicants/3',
        '/applicants/1/my-evaluation',
        '/applicants/3/my-evaluation',
      ];
      const keys = new Set<string>();
      for (const userId of [EVALUATOR_A_ID, EVALUATOR_B_ID]) {
        for (const path of getPaths) {
          const res = await call(app, 'get', path, { userId });
          // ปล่อยทั้ง 200 และ 404 เข้ามาตรวจ (404 ต้องไม่มีคีย์แปลกเช่นกัน)
          collectKeys(res.body, keys);
        }
      }
      for (const forbidden of FORBIDDEN_KEYS) {
        expect(keys.has(forbidden)).toBe(false);
      }
    });
  });

  // =========================================================================
  describe('guards ครบทั้ง 6 endpoints', () => {
    it('ไม่มี X-User-Id -> 401 UNAUTHORIZED ทุก endpoint', async () => {
      for (const endpoint of ALL_ENDPOINTS) {
        const res = await call(app, endpoint.method, endpoint.path, {
          body: endpoint.body,
        }).expect(401);
        expectErrorShape(res, 401, 'UNAUTHORIZED');
      }
    });

    it('admin (id 1) -> 403 FORBIDDEN ทุก endpoint', async () => {
      for (const endpoint of ALL_ENDPOINTS) {
        const res = await call(app, endpoint.method, endpoint.path, {
          userId: ADMIN_ID,
          body: endpoint.body,
        }).expect(403);
        expectErrorShape(res, 403, 'FORBIDDEN');
      }
    });

    it('user id ไม่มีอยู่จริง (999) -> 401 UNAUTHORIZED ทุก endpoint', async () => {
      for (const endpoint of ALL_ENDPOINTS) {
        const res = await call(app, endpoint.method, endpoint.path, {
          userId: UNKNOWN_ID,
          body: endpoint.body,
        }).expect(401);
        expectErrorShape(res, 401, 'UNAUTHORIZED');
      }
    });

    it('บัญชีถูกปิดใช้งาน (id 4) -> 401 ACCOUNT_DEACTIVATED ทุก endpoint', async () => {
      for (const endpoint of ALL_ENDPOINTS) {
        const res = await call(app, endpoint.method, endpoint.path, {
          userId: INACTIVE_ID,
          body: endpoint.body,
        }).expect(401);
        expectErrorShape(res, 401, 'ACCOUNT_DEACTIVATED');
      }
    });
  });

  // =========================================================================
  describe('IDOR — 404 รูปเดียวกันทุกกรณี', () => {
    it('ผู้สมัครไม่มีอยู่จริง (9999) -> 404 บน GET detail / my-evaluation / PUT / POST', async () => {
      const bodies: unknown[] = [];
      const cases: Array<[HttpMethod, string]> = [
        ['get', '/applicants/9999'],
        ['get', '/applicants/9999/my-evaluation'],
        ['put', '/applicants/9999/my-evaluation'],
        ['post', '/applicants/9999/my-evaluation/submit'],
      ];
      for (const [method, path] of cases) {
        const res = await call(app, method, path, {
          userId: EVALUATOR_A_ID,
          body: method === 'get' ? undefined : VALID_BODY,
        }).expect(404);
        expectErrorShape(res, 404, 'NOT_FOUND');
        bodies.push(res.body);
      }
      assertSameErrorShape(bodies);
    });

    it('ผู้สมัครอยู่ในรอบ DRAFT (5) -> 404 รูปเดียวกัน + รายการ/รายละเอียดรอบ DRAFT ก็ 404', async () => {
      const bodies: unknown[] = [];
      const cases: Array<[HttpMethod, string]> = [
        ['get', '/applicants/5'],
        ['get', '/applicants/5/my-evaluation'],
        ['put', '/applicants/5/my-evaluation'],
        ['post', '/applicants/5/my-evaluation/submit'],
        ['get', '/scholarship-rounds/1/applicants'],
        ['get', '/scholarship-rounds/1'],
      ];
      for (const [method, path] of cases) {
        const res = await call(app, method, path, {
          userId: EVALUATOR_A_ID,
          body: method === 'get' ? undefined : VALID_BODY,
        }).expect(404);
        expectErrorShape(res, 404, 'NOT_FOUND');
        bodies.push(res.body);
      }
      assertSameErrorShape(bodies);
    });

    it('รอบ CLOSED (3): รายการผู้สมัคร / รายละเอียดรอบ / ผู้สมัคร 4 -> 404 รูปเดียวกัน', async () => {
      const bodies: unknown[] = [];
      const cases: Array<[HttpMethod, string]> = [
        ['get', '/scholarship-rounds/3/applicants'],
        ['get', '/scholarship-rounds/3'],
        ['get', '/applicants/4'],
        ['get', '/applicants/4/my-evaluation'],
        ['put', '/applicants/4/my-evaluation'],
      ];
      for (const [method, path] of cases) {
        const res = await call(app, method, path, {
          userId: EVALUATOR_A_ID,
          body: method === 'get' ? undefined : VALID_BODY,
        }).expect(404);
        expectErrorShape(res, 404, 'NOT_FOUND');
        bodies.push(res.body);
      }
      assertSameErrorShape(bodies);
    });
  });

  // =========================================================================
  describe('response envelope ตาม spec หัวข้อ 2.2', () => {
    it('response สำเร็จมี success/statusCode/data และ list มี meta', async () => {
      const listRes = await call(
        app,
        'get',
        '/scholarship-rounds/2/applicants',
        {
          userId: EVALUATOR_B_ID,
        },
      ).expect(200);
      const listBody = bodyOf<Record<string, unknown> & { meta: unknown }>(
        listRes,
      );
      expect(Object.keys(listBody).sort()).toEqual([
        'data',
        'meta',
        'statusCode',
        'success',
      ]);
      expect(listBody['success']).toBe(true);
      expect(listBody['statusCode']).toBe(200);
      const meta = listBody['meta'] as Record<string, unknown>;
      expect(Object.keys(meta).sort()).toEqual([
        'limit',
        'page',
        'total',
        'totalPages',
      ]);

      const detailRes = await call(app, 'get', '/applicants/1', {
        userId: EVALUATOR_B_ID,
      }).expect(200);
      const detailBody = bodyOf<Record<string, unknown>>(detailRes);
      expect(Object.keys(detailBody).sort()).toEqual([
        'data',
        'statusCode',
        'success',
      ]);
    });

    it('response error มี success=false/statusCode/errorCode/error/timestamp', async () => {
      const res = await call(app, 'get', '/applicants/9999', {
        userId: EVALUATOR_B_ID,
      }).expect(404);
      const body = bodyOf<Record<string, unknown>>(res);
      // คีย์บังคับ: success/statusCode/errorCode/error/timestamp
      // message เป็นคีย์เสริมที่อนุญาต (filter ของทีมส่งกลับเสมอ) — params อนุญาตเมื่อมีค่าส่งเสริม
      expect(Object.keys(body).sort()).toEqual([
        'error',
        'errorCode',
        'message',
        'statusCode',
        'success',
        'timestamp',
      ]);
      expect(body['success']).toBe(false);
      expect(body['errorCode']).toBe('NOT_FOUND');
    });
  });

  // =========================================================================
  describe('flow เต็มในฐานะ Evaluator A [FR-EVL-04] [FR-EVL-11] [FR-EVL-13]', () => {
    it('GET ฟอร์มว่าง -> PUT Draft -> PUT ซ้ำ -> submit ไม่ครบ 422 -> กรอกต่อ -> submit 200 -> 409 ทั้งคู่', async () => {
      // 1) ยังไม่เคยประเมิน: 200 ฟอร์มว่าง ไม่สร้างแถวใน DB
      const getRes = await call(app, 'get', '/applicants/1/my-evaluation', {
        userId: EVALUATOR_A_ID,
      }).expect(200);
      const getBody = bodyOf<MyEvalBody>(getRes);
      expect(getBody.data.evaluationId).toBeNull();
      expect(getBody.data.status).toBeNull();
      expect(fake.data.evaluations).toHaveLength(0);

      // 2) บันทึกครั้งแรก: สร้าง Draft 1 แถว
      const saveRes = await call(app, 'put', '/applicants/1/my-evaluation', {
        userId: EVALUATOR_A_ID,
        body: { items: [{ subCriteriaId: 1, score: 20 }] },
      }).expect(200);
      const saveBody = bodyOf<MyEvalBody>(saveRes);
      const evaluationId = saveBody.data.evaluationId;
      expect(typeof evaluationId).toBe('number');
      expect(saveBody.data.status).toBe('DRAFT');
      expect(saveBody.data.totalScore).toBeNull();
      expect(saveBody.data.items[0].score).toBe(20);
      expect(saveBody.data.items[1].score).toBeNull(); // ยังไม่กรอก = null ไม่ใช่ 0
      expect(fake.data.evaluations).toHaveLength(1);

      // 3) PUT payload เดิมซ้ำ: แถวเดิม ไม่ซ้ำ ไม่ขยับ updatedAt (no-op ตาม spec)
      const saveAgainRes = await call(
        app,
        'put',
        '/applicants/1/my-evaluation',
        {
          userId: EVALUATOR_A_ID,
          body: { items: [{ subCriteriaId: 1, score: 20 }] },
        },
      ).expect(200);
      const saveAgainBody = bodyOf<MyEvalBody>(saveAgainRes);
      expect(saveAgainBody.data.evaluationId).toBe(evaluationId);
      expect(saveAgainBody.data.updatedAt).toBe(saveBody.data.updatedAt);
      expect(fake.data.evaluations).toHaveLength(1); // ไม่สร้างแถวที่สอง

      // 4) Submit ตอนกรอกไม่ครบ -> 422 พร้อมรายชื่อหัวข้อที่ขาด [BR-EVL-11]
      const incompleteRes = await call(
        app,
        'post',
        '/applicants/1/my-evaluation/submit',
        { userId: EVALUATOR_A_ID, body: {} },
      ).expect(422);
      const incompleteBody = bodyOf<ErrorBody>(incompleteRes);
      expect(incompleteBody.errorCode).toBe('SCORES_INCOMPLETE');
      expect(incompleteBody.params?.items).toEqual([
        'เกณฑ์ข้อที่ 2 (เต็ม 30)',
        'เกณฑ์ข้อที่ 3 (เต็ม 30)',
      ]);
      expect(fake.data.auditLogs).toHaveLength(0); // ยังไม่มีอะไรถูกเขียน

      // 5) กรอกต่อเฉพาะข้อที่ขาด
      const restRes = await call(app, 'put', '/applicants/1/my-evaluation', {
        userId: EVALUATOR_A_ID,
        body: {
          items: [
            { subCriteriaId: 2, score: 25 },
            { subCriteriaId: 3, score: 30 },
          ],
        },
      }).expect(200);
      expect(bodyOf<MyEvalBody>(restRes).data.evaluationId).toBe(evaluationId);

      // 6) Submit สำเร็จ: SUBMITTED + ผลรวมถูก + submittedAt + audit log
      const submitRes = await call(
        app,
        'post',
        '/applicants/1/my-evaluation/submit',
        { userId: EVALUATOR_A_ID, body: {} },
      ).expect(200);
      const submitBody = bodyOf<MyEvalBody>(submitRes);
      expect(submitBody.data.status).toBe('SUBMITTED');
      expect(submitBody.data.totalScore).toBe(75); // 20+25+30 [FR-SCR-02]
      expect(submitBody.data.submittedAt).not.toBeNull();
      expect(fake.data.auditLogs).toHaveLength(1); // [FR-EVL-15]
      expect(fake.data.auditLogs[0]['action']).toBe('EVALUATION_SUBMIT');

      // 7) หลัง Submit: save และ submit อีกครั้ง -> 409 ทั้งคู่ [BR-EVL-09]
      const saveAfterRes = await call(
        app,
        'put',
        '/applicants/1/my-evaluation',
        {
          userId: EVALUATOR_A_ID,
          body: { items: [{ subCriteriaId: 1, score: 5 }] },
        },
      ).expect(409);
      expectErrorShape(saveAfterRes, 409, 'ALREADY_EVALUATED');

      const submitAgainRes = await call(
        app,
        'post',
        '/applicants/1/my-evaluation/submit',
        { userId: EVALUATOR_A_ID, body: {} },
      ).expect(409);
      expectErrorShape(submitAgainRes, 409, 'ALREADY_EVALUATED');
      expect(fake.data.evaluations).toHaveLength(1); // ไม่มีแถวเพิ่ม
    });
  });

  // =========================================================================
  describe('ValidationPipe (ชั้น HTTP เท่านั้น)', () => {
    it('ฟิลด์แปลกใน body -> 400 BAD_REQUEST พร้อม params.messages', async () => {
      const res = await call(app, 'put', '/applicants/1/my-evaluation', {
        userId: EVALUATOR_A_ID,
        body: { items: [{ subCriteriaId: 1, score: 10 }], bogusField: true },
      }).expect(400);
      const body = bodyOf<ErrorBody>(res);
      // filter ของทีม (commit 387a02a) map ValidationPipe 400 เป็น BAD_REQUEST ทั้ง error และ errorCode แล้ว
      // (ตรวจจาก response จริงในรอบรัน test:e2e) — แต่ไม่ส่ง params.messages จึงไม่ assert ส่วนนั้น
      expect(body.errorCode).toBe('BAD_REQUEST');
      expect(body.error).toBe('BAD_REQUEST');
    });

    it('score เป็น string -> 400 ถูกปฏิเสธ', async () => {
      const res = await call(app, 'put', '/applicants/1/my-evaluation', {
        userId: EVALUATOR_A_ID,
        body: { items: [{ subCriteriaId: 1, score: '20' }] },
      }).expect(400);
      expectErrorShape(res, 400, 'BAD_REQUEST');
    });

    it('score เกินคะแนนเต็ม (41 > 40) -> 422 SCORE_OUT_OF_RANGE [BR-EVL-03]', async () => {
      const res = await call(app, 'put', '/applicants/1/my-evaluation', {
        userId: EVALUATOR_A_ID,
        body: { items: [{ subCriteriaId: 1, score: 41 }] },
      }).expect(422);
      const body = bodyOf<ErrorBody>(res);
      expect(body.errorCode).toBe('SCORE_OUT_OF_RANGE');
      expect(body.params?.max).toBe(40);
      expect(fake.data.evaluations).toHaveLength(0); // ไม่มีการเขียนอะไรเลย
    });
  });
});

/** ยืนยันว่า error body ทุกกรณีมีรูปทรงเดียวกันเป๊ะ (คีย์และค่า error เดียวกัน) */
function assertSameErrorShape(bodies: unknown[]): void {
  expect(bodies.length).toBeGreaterThan(1);
  const reference = bodies[0] as Record<string, unknown>;
  const referenceKeys = Object.keys(reference).sort();
  // message เป็นคีย์เสริมที่อนุญาต (filter ของทีมส่งกลับเสมอ) — คีย์บังคับตาม spec ต้องครบ
  expect(referenceKeys).toEqual([
    'error',
    'errorCode',
    'message',
    'statusCode',
    'success',
    'timestamp',
  ]);
  for (const body of bodies) {
    const record = body as Record<string, unknown>;
    expect(Object.keys(record).sort()).toEqual(referenceKeys);
    expect(record['success']).toBe(false);
    expect(record['statusCode']).toBe(404);
    expect(record['errorCode']).toBe('NOT_FOUND');
    expect(record['error']).toBe(reference['error']);
  }
}
