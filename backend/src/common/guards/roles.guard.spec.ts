/**
 * Unit test ของ RolesGuard (RBAC) [FR-AUTH-04]
 * ครอบเคส: ไม่ประกาศ @Roles / role ตรง / role ไม่ตรง (403) / ไม่มี request.user (401)
 */
import { ExecutionContext } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { Reflector } from '@nestjs/core';
import { AppException } from '../exceptions/app.exception';
import { RequestWithUser } from './mock-auth.guard';
import { RolesGuard } from './roles.guard';

// mock Reflector (ตัวอ่าน metadata จาก @Roles)
const getAllAndOverrideMock = jest.fn();
const mockReflector = {
  getAllAndOverride: getAllAndOverrideMock,
} as unknown as Reflector;

// ฟังก์ชันช่วยสร้าง ExecutionContext ปลอม ที่ request มี (หรือไม่มี) user แนบอยู่
function createContextWithUser(user: User | undefined): {
  context: ExecutionContext;
  request: RequestWithUser;
} {
  const request = { headers: {}, user } as RequestWithUser;
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    // RolesGuard ใช้คู่กับ Reflector จึงต้องมี getHandler/getClass ด้วย
    // (ใน test จริงเราไม่สนใจค่า จึงคืน undefined ไปก่อน)
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
  return { context, request };
}

// ฟังก์ชันช่วยสร้างข้อมูล User ปลอม
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

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(mockReflector);
  });

  it('อนุญาตเมื่อ endpoint ไม่ได้ประกาศ @Roles (ไม่มี metadata)', () => {
    getAllAndOverrideMock.mockReturnValue(undefined);
    const { context } = createContextWithUser(createMockUser({}));

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('อนุญาตเมื่อ role ของผู้ใช้ตรงกับ @Roles ที่ประกาศ', () => {
    getAllAndOverrideMock.mockReturnValue([UserRole.EVALUATOR]);
    const { context } = createContextWithUser(
      createMockUser({ role: UserRole.EVALUATOR }),
    );

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('ปฏิเสธด้วย 403 FORBIDDEN เมื่อ role ของผู้ใช้ไม่ตรง (Evaluator เรียกของ Admin)', () => {
    getAllAndOverrideMock.mockReturnValue([UserRole.ADMIN]);
    const { context } = createContextWithUser(
      createMockUser({ role: UserRole.EVALUATOR }),
    );

    let caughtError: unknown;
    try {
      guard.canActivate(context);
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(AppException);
    const appError = caughtError as AppException;
    expect(appError.errorCode).toBe('FORBIDDEN');
    expect(appError.getStatus()).toBe(403);
  });

  it('ปฏิเสธด้วย 401 UNAUTHORIZED เมื่อยังไม่มีข้อมูลผู้ใช้แนบมา', () => {
    getAllAndOverrideMock.mockReturnValue([UserRole.EVALUATOR]);
    const { context } = createContextWithUser(undefined);

    let caughtError: unknown;
    try {
      guard.canActivate(context);
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(AppException);
    const appError = caughtError as AppException;
    expect(appError.errorCode).toBe('UNAUTHORIZED');
    expect(appError.getStatus()).toBe(401);
  });
});
