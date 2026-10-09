/**
 * ชั่วคราว: จะถูกแทนที่ด้วย KKU SSO ภายหลัง [FR-AUTH-01]
 *
 * Guard สำหรับ "จำแนกบทบาท" บน route ที่ Admin และ Evaluator ใช้ร่วมกัน
 * - ถ้ามี header X-User-Id: ใช้ MockAuthGuard logic (โหลด user จาก DB, ต้อง active) -> ใช้ role จาก DB
 * - ถ้าไม่มี X-User-Id: อนุญาตเฉพาะ legacy admin path เมื่อ header x-user-role = ADMIN
 * - คืนค่า: 'ADMIN' | 'EVALUATOR' | null (null = 401 UNAUTHORIZED)
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

      // เก็บ resolved role ไว้บน request
      request.resolvedRole =
        user.role === UserRole.ADMIN ? 'ADMIN' : 'EVALUATOR';
      return true;
    }

    // 2) ไม่มี X-User-Id -> อนุญาต legacy admin path เฉพาะ x-user-role = ADMIN
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

    // 3) อื่นๆ ทั้งหมด -> 401 (Evaluator ต้องส่ง X-User-Id เสมอ)
    throw new AppException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
  }
}
