/**
 * Guard ตรวจสอบสิทธิ์ตามบทบาท (RBAC) [FR-AUTH-04]
 *
 * อ่านรายการ role ที่ประกาศด้วย @Roles(...) แล้วเทียบกับ request.user
 * ที่ MockAuthGuard (หรือ auth guard จริงในอนาคต) แนบมาให้
 * ถ้า role ไม่ตรงให้ตอบ 403 FORBIDDEN (spec หัวข้อ 2.1 ข้อ 5)
 *
 * หมายเหตุ: Guard นี้ต้องถูกรัน "หลัง" auth guard เสมอ เช่น
 *   @UseGuards(MockAuthGuard, RolesGuard)
 */
import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AppException } from '../exceptions/app.exception';
import { RequestWithUser } from './mock-auth.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // ดึง @Roles จากทั้งระดับ method และ class (method มี priority สูงกว่า)
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // ถ้า endpoint ไม่ได้ประกาศ @Roles ให้ผ่าน
    // (การบังคับล็อกอินเป็นหน้าที่ของ auth guard ที่รันก่อนหน้าอยู่แล้ว)
    if (requiredRoles === undefined || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // ยังไม่มีข้อมูลผู้ใช้ = ล็อกอินไม่ผ่าน (auth guard ไม่ได้รันก่อนหน้า)
    if (user === undefined) {
      throw new AppException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
    }

    // role ไม่ตรงกับที่ endpoint อนุญาต -> ตอบ 403 [FR-AUTH-04] [BR-USR-03]
    if (!requiredRoles.includes(user.role)) {
      throw new AppException('FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
