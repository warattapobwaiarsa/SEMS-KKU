import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

/** ชื่อ key ที่ใช้เก็บรายการ role ที่อนุญาต บน metadata ของ route (RolesGuard อ่านค่านี้) */
export const ROLES_KEY = 'roles';

/**
 * ประกาศว่า endpoint นี้อนุญาตเฉพาะ role ใด โดยใส่คู่กับ RolesGuard
 * ผ่าน @UseGuards(MockAuthGuard, RolesGuard) ที่หัว controller/handler เช่น
 *
 *   @Roles(UserRole.EVALUATOR)
 *   @Get('my')
 *   myEndpoint() { ... }
 *
 * รองรับบทบาท 2 แบบของระบบ (Admin / Evaluator) ตาม [FR-AUTH-04] [BR-USR-03]
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
