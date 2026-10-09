/**
 * ชั่วคราว: จะถูกแทนที่ด้วย KKU SSO ภายหลัง [FR-AUTH-01]
 *
 * Guard สำหรับ "จำแนกบทบาท" บน route ที่ Admin และ Evaluator ใช้ร่วมกัน
 * (ใช้กับ 3 เส้น shared routes เท่านั้น: GET /scholarship-rounds/:id,
 *  GET /scholarship-rounds/:roundId/applicants, GET /applicants/:id)
 *
 * กฎการ resolve role (สำหรับ 3 เส้น read routes นี้เท่านั้น):
 * 1) มี X-User-Id: authenticate แบบ MockAuthGuard (โหลดจาก DB, ต้อง active)
 *    -> ใช้ role จาก DB (database wins, x-user-role ถูกข้าม)
 * 2) ไม่มี X-User-Id + x-user-role = ADMIN: admin path (legacy behavior)
 * 3) ไม่มี X-User-Id + x-user-role = EVALUATOR (หรือค่าอื่น): 401
 * 4) ไม่มี X-User-Id + ไม่มี x-user-role header: legacy admin path
 *    (TEMPORARY relaxation จนกว่าจะมี KKU SSO [FR-AUTH-01];
 *     Evaluator ต้องส่ง X-User-Id เสมอถึงจะได้ข้อมูล evaluator)
 */
import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../exceptions/app.exception';
import { RequestWithUser } from './mock-auth.guard';

export type ResolvedRole = 'ADMIN' | 'EVALUATOR' | null;

// Extend RequestWithUser to include resolvedRole
export interface RequestWithResolvedRole extends RequestWithUser {
  resolvedRole?: ResolvedRole;
  query?: Record<string, unknown>;
}

@Injectable()
export class RoleDispatchGuard implements CanActivate {
  constructor(private readonly prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithResolvedRole>();

    // 1) ถ้ามี X-User-Id -> authenticate แบบ MockAuthGuard (โหลดจาก DB, ต้อง active)
    const rawUserId = request.headers['x-user-id'];
    const userIdText = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;

    if (userIdText !== undefined && userIdText !== '') {
      const userId = Number(userIdText);
      if (!Number.isInteger(userId) || userId <= 0) {
        throw new AppException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
      }

      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });
      if (user === null) {
        throw new AppException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
      }
      if (!user.isActive) {
        throw new AppException('ACCOUNT_DEACTIVATED', HttpStatus.UNAUTHORIZED);
      }

      // แนบ user ไว้ให้ RolesGuard / controller ใช้ต่อ
      request.user = user;

      // เก็บ resolved role ไว้บน request (database wins)
      request.resolvedRole =
        user.role === UserRole.ADMIN ? 'ADMIN' : 'EVALUATOR';
      return true;
    }

    // 2) ไม่มี X-User-Id -> ตรวจสอบ x-user-role / userRole
    const rawRoleHeader = request.headers['x-user-role'];
    const roleHeader = Array.isArray(rawRoleHeader)
      ? rawRoleHeader[0]
      : rawRoleHeader;
    const rawRoleQuery = request.query?.userRole;
    const roleQuery = Array.isArray(rawRoleQuery)
      ? (rawRoleQuery[0] as string | undefined)
      : (rawRoleQuery as string | undefined);
    const legacyRole = roleHeader || roleQuery;

    if (legacyRole === 'ADMIN') {
      // legacy admin: ไม่มี user object (เพราะไม่ได้ verify ผ่าน DB)
      // controller จะต้อง handle เองว่าเรียก service admin path
      request.resolvedRole = 'ADMIN';
      return true;
    }

    // 3) x-user-role = EVALUATOR (หรือค่าอื่น) โดยไม่มี X-User-Id -> 401
    // Evaluator ต้องส่ง X-User-Id เสมอถึงจะได้ข้อมูล evaluator
    if (legacyRole !== undefined && legacyRole !== '') {
      throw new AppException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
    }

    // 4) ไม่มี X-User-Id + ไม่มี x-user-role header -> legacy admin path
    // TEMPORARY relaxation สำหรับ 3 เส้น read routes นี้จนกว่าจะมี KKU SSO [FR-AUTH-01]
    // หมายเหตุ: Evaluator ต้องส่ง X-User-Id เสมอถึงจะได้ข้อมูล evaluator
    request.resolvedRole = 'ADMIN';
    return true;
  }
}
