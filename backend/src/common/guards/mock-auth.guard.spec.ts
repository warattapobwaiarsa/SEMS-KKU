/**
 * Unit test ของ MockAuthGuard (ไม่ต่อฐานข้อมูลจริง ใช้ mock PrismaService)
 * ครอบเคส: ไม่ส่ง header / id ไม่ถูกต้อง / ไม่พบผู้ใช้ / บัญชีถูกปิด / ผู้ใช้ปกติ
 * [FR-AUTH-02] [BR-USR-12]
 */
import { ExecutionContext } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../exceptions/app.exception';
import { MockAuthGuard, RequestWithUser } from './mock-auth.guard';

// mock ฟังก์ชันของ PrismaService ที่ guard ใช้จริง (มีแค่ user.findUnique)
const findUniqueMock = jest.fn();
const mockPrismaService = {
  user: { findUnique: findUniqueMock },
} as unknown as PrismaService;

// ฟังก์ชันช่วยสร้าง ExecutionContext ปลอม ที่คืน request ซึ่งมี headers ตามที่กำหนด
// (และคืน request ตัวเดิมกลับมาด้วย เพื่อเช็คว่า user ถูกแนบหรือไม่)
function createContextWithHeaders(headers: RequestWithUser['headers']): {
  context: ExecutionContext;
  request: RequestWithUser;
} {
  const request: RequestWithUser = { headers };
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
  return { context, request };
}

// ฟังก์ชันช่วยสร้างข้อมูล User ปลอมให้ครบทุกฟิลด์ตาม type ของ Prisma
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

describe('MockAuthGuard', () => {
  let guard: MockAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new MockAuthGuard(mockPrismaService);
  });

  it('ปฏิเสธด้วย 401 UNAUTHORIZED เมื่อไม่ส่ง header X-User-Id', async () => {
    const { context } = createContextWithHeaders({});

    let caughtError: unknown;
    try {
      await guard.canActivate(context);
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(AppException);
    const appError = caughtError as AppException;
    expect(appError.errorCode).toBe('UNAUTHORIZED');
    expect(appError.getStatus()).toBe(401);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it('ปฏิเสธด้วย 401 UNAUTHORIZED เมื่อ X-User-Id ไม่ใช่ตัวเลข', async () => {
    const { context } = createContextWithHeaders({ 'x-user-id': 'abc' });

    let caughtError: unknown;
    try {
      await guard.canActivate(context);
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(AppException);
    const appError = caughtError as AppException;
    expect(appError.errorCode).toBe('UNAUTHORIZED');
    expect(appError.getStatus()).toBe(401);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it('ปฏิเสธด้วย 401 UNAUTHORIZED เมื่อไม่พบผู้ใช้ตาม id ในฐานข้อมูล', async () => {
    findUniqueMock.mockResolvedValue(null);
    const { context } = createContextWithHeaders({ 'x-user-id': '999' });

    let caughtError: unknown;
    try {
      await guard.canActivate(context);
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(AppException);
    const appError = caughtError as AppException;
    expect(appError.errorCode).toBe('UNAUTHORIZED');
    expect(appError.getStatus()).toBe(401);
    expect(findUniqueMock).toHaveBeenCalledWith({ where: { id: 999 } });
  });

  it('ปฏิเสธด้วย 401 ACCOUNT_DEACTIVATED เมื่อบัญชีถูกปิดใช้งาน', async () => {
    findUniqueMock.mockResolvedValue(createMockUser({ isActive: false }));
    const { context } = createContextWithHeaders({ 'x-user-id': '2' });

    let caughtError: unknown;
    try {
      await guard.canActivate(context);
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(AppException);
    const appError = caughtError as AppException;
    expect(appError.errorCode).toBe('ACCOUNT_DEACTIVATED');
    expect(appError.getStatus()).toBe(401);
  });

  it('อนุญาตและแนบข้อมูลผู้ใช้ไว้ที่ request.user เมื่อเป็นผู้ใช้ปกติ', async () => {
    const mockUser = createMockUser({});
    findUniqueMock.mockResolvedValue(mockUser);
    const { context, request } = createContextWithHeaders({
      'x-user-id': '2',
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(findUniqueMock).toHaveBeenCalledWith({ where: { id: 2 } });
    expect(request.user).toEqual(mockUser);
  });
});
