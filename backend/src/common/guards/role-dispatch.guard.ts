/**
 * ชั่วคราว: จะถูกแทนที่ด้วย KKU SSO ภายหลัง [FR-AUTH-01]
 *
 * Guard สำหรับ "จำแนกบทบาท" บน route ที่ Admin และ Evaluator ใช้ร่วมกัน
 *
 * กฎการ resolve role:
 * 1) ต้องมี X-User-Id: authenticate โหลดจาก DB และต้อง active
 *    -> ใช้ role จาก DB (database wins)
 * 2) ถ้าไม่มี X-User-Id หรือระบุตัวตนไม่ได้: ตอบ 401 UNAUTHORIZED เสมอ (Fail-Closed)
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
    // 0) ป้องกันความปลอดภัย: ห้ามใช้ MockAuth บน Production เว้นแต่จะระบุชัดเจนว่าอนุญาต (เช่น สำหรับ Demo / Staging)
    const isMockAuthAllowed = process.env.ALLOW_MOCK_AUTH === 'true';
    if (process.env.NODE_ENV === 'production' && !isMockAuthAllowed) {
      throw new AppException(
        'MOCK_AUTH_PROHIBITED_IN_PRODUCTION',
        HttpStatus.FORBIDDEN,
      );
    }

    const request = context
      .switchToHttp()
      .getRequest<RequestWithResolvedRole>();

    // 1) ต้องส่ง X-User-Id มาเสมอ -> authenticate โหลดจาก DB และต้อง active [Fail-Closed]
    const rawUserId = request.headers['x-user-id'];
    const userIdText = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;

    if (userIdText === undefined || userIdText === '') {
      throw new AppException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
    }

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
    request.resolvedRole = user.role === UserRole.ADMIN ? 'ADMIN' : 'EVALUATOR';
    return true;
  }
}
