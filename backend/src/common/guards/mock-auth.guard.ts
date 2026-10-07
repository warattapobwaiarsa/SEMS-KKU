/**
 * ชั่วคราว: จะถูกแทนที่ด้วย KKU SSO ภายหลัง [FR-AUTH-01]
 *
 * Guard นี้เป็นการล้อกล่อม (mock) เพื่อให้พัฒนา feature อื่นต่อได้ก่อน
 * โดยระบุตัวตนผู้ใช้จาก header `X-User-Id` (คือ id ของ User ในฐานข้อมูล)
 * แล้วโหลดข้อมูลผู้ใช้จริงจากฐานข้อมูลมาแนบไว้ที่ request.user
 *
 * เมื่อทำ KKU SSO จริง ให้แทนที่ Guard นี้ด้วย SessionAuthGuard
 * ที่อ่าน session จาก Cookie แทน header แต่ให้คงรูปแบบ "แนบ user ที่ request.user"
 * เพื่อที่ RolesGuard และ Controller จะไม่ต้องแก้ไขอะไร
 */
import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../exceptions/app.exception';

/** รูปแบบ request ที่ผ่าน MockAuthGuard แล้ว (มีข้อมูล user แนบอยู่) */
export interface RequestWithUser {
  headers: Record<string, string | string[] | undefined>;
  user?: User;
}

@Injectable()
export class MockAuthGuard implements CanActivate {
  constructor(private readonly prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    // 1) ต้องส่ง header X-User-Id มา ไม่งั้นถือว่าไม่ได้ล็อกอิน [FR-AUTH-02]
    const rawUserId = request.headers['x-user-id'];
    const userIdText = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
    if (userIdText === undefined || userIdText === '') {
      throw new AppException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
    }

    // 2) id ต้องเป็นตัวเลขจำนวนเต็มที่ถูกต้อง
    const userId = Number(userIdText);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new AppException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
    }

    // 3) ต้องมีบัญชีนี้อยู่ในระบบจริง [FR-AUTH-02]
    const evaluatorUser = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (evaluatorUser === null) {
      throw new AppException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
    }

    // 4) บัญชีที่ถูกปิดใช้งานเข้าใช้ระบบไม่ได้ [FR-AUTH-02] [BR-USR-12]
    if (!evaluatorUser.isActive) {
      throw new AppException('ACCOUNT_DEACTIVATED', HttpStatus.UNAUTHORIZED);
    }

    // ผ่านทั้งหมด -> แนบข้อมูลผู้ใช้ไว้ที่ request.user ให้ส่วนอื่นใช้ต่อ
    request.user = evaluatorUser;
    return true;
  }
}
