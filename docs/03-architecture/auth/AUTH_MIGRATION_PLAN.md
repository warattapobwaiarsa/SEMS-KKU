# AUTH_MIGRATION_PLAN.md — Phased Authentication Migration Plan

> **Status:** Architecture Design Only (Read-Only Mission 02 — No Changes Applied)

---

## 1. Verified Findings (ตรวจสอบจาก Source Code ปัจจุบัน)

1. ปัจจุบัน Backend ใช้ `MockAuthGuard` และ `RoleDispatchGuard` (`X-User-Id` header) และ Frontend ใช้ `localStorage` (`frontend/src/lib/mock-evaluator.ts`)
2. `docker-compose.prod.yml` กำหนด `ALLOW_MOCK_AUTH: "false"` ทำให้ Production ใช้งาน Protected Endpoints ไม่ได้ในสภาพปัจจุบัน
3. `backend/prisma/seed.ts` สร้างผู้ใช้ตัวอย่าง 4 บัญชี (`admin@kku.ac.th`, `evaluator1@kku.ac.th`, `evaluator2@kku.ac.th`, `evaluator3@kku.ac.th`) โดยไม่มี Credential

---

## 2. Proposed Design (3-Phase Migration Roadmap)

### Phase 1: Authentication Core + Local Auth (Ready for Production Interim)
**เป้าหมาย:** แทนที่ Mock Auth ด้วย Server-side Session + Local Authentication ทั้งระบบ โดยไม่มีช่องโหว่ Impersonation

1. **Database Migration:**
   - เพิ่ม `LocalCredential`, ขยาย `UserSession`, เพิ่ม `ExternalIdentity` / `AuthProvider` (โครงสร้างพร้อมใช้), เพิ่ม `AuditAction` enum values
   - ไม่ใส่รหัสผ่านใดๆ ใน Migration หรือ `seed.ts`
2. **Backend Implementation:**
   - สร้าง `AuthModule` (`AuthController`, `AuthService`, `SessionService`, `LocalAuthAdapter`, `SessionAuthGuard`, `@CurrentUser()`)
   - เปลี่ยน Guard ในทุก Controller จาก `MockAuthGuard` / `RoleDispatchGuard` เป็น `SessionAuthGuard` + `RolesGuard`
   - ลบ `@Headers('x-user-role')` และ `@Query('userRole')` ออกจาก `CriteriaController.findOne`, `RoundsController`, `ApplicantsController`
   - เพิ่ม `@UseGuards` ให้ `ScholarshipTypesController` (`findAll`, `findOne`)
   - อัปเดต `main.ts` CORS (`allowedHeaders` ถอด `X-User-Id` / `X-User-Role`)
   - ลบ `MockAuthGuard` และ `RoleDispatchGuard` (หรือจำกัดเฉพาะ Test harness ฝั่ง Unit/E2E ที่ไม่ถูกโหลดใน Production build)
3. **Frontend Implementation:**
   - สร้างหน้า `/login` และ Flow Logout
   - อัปเดต `api-client.ts` ให้ใช้ `credentials: 'include'` + `X-CSRF-Token` และลบการอ่าน `localStorage` / `X-User-Id`
   - เพิ่ม Server-side Session verification ใน `AdminLayout` และ `EvaluatorLayout` (Redirect ไป `/login` หาก `401`)
   - ลบ `EvaluatorSwitcher` และ `mock-evaluator.ts`
   - แก้ไข `allocation.service.ts` ไม่ให้กลืน Error
4. **Initial Admin Provisioning:**
   - รัน CLI Script (One-time bootstrap) สร้าง/ตั้งค่ารหัสผ่านให้ Admin คนแรกจาก Environment/Interactive Prompt พร้อมบังคับ `mustChangePassword = true`

### Phase 2: KKU SSO Integration (Post-KKU IT Confirmation)
**เป้าหมาย:** เชื่อมต่อ KKU SSO ผ่าน `IdentityProviderAdapter` โดยไม่กระทบ Session Core

1. รับคำตอบจาก `QUESTIONS_FOR_KKU_IT.md` และลงทะเบียน Application กับ KKU IT
2. พัฒนา `KkuSsoAdapter` ตาม Protocol ที่ KKU IT กำหนด (OIDC / OAuth2 / SAML ฯลฯ)
3. เปิดใช้งาน Endpoints `/api/v1/auth/sso/login` และ `/api/v1/auth/sso/callback`
4. ทดสอบ Account Linking กับ `ExternalIdentity` (จับคู่กับ `User.email` ที่มีอยู่แล้วโดยตรวจ `isActive` และ `role` จาก DB)
5. อัปเดตหน้า `/login` ให้แสดงปุ่มเข้าสู่ระบบผ่าน KKU SSO

### Phase 3: SSO Cutover & Local Auth Sunset
**เป้าหมาย:** ปิด Local Authentication เมื่อ KKU SSO เสถียร (ตาม `FR-AUTH-01`)

1. ทดสอบคู่ขนาน (`AUTH_MODE=hybrid`) ใน Staging และ Production ช่วงเปลี่ยนผ่าน
2. สลับ `AUTH_MODE=sso_only` (ปิด Endpoint `/auth/login` แบบรหัสผ่าน)
3. ยกเลิก/ล้าง `LocalCredential` ที่ไม่จำเป็น (คงไว้เฉพาะหากมีมติให้มี Break-glass Admin Account)

---

## 3. Rollback Plan

- **Phase 1 Rollback (Pre-Go-Live / Staging):** Revert code + rollback Prisma migration (Production ห้ามถอยกลับไปใช้ `MockAuthGuard` เด็ดขาด)
- **Phase 2/3 Rollback:** หาก KKU SSO ขัดข้องระหว่าง Cutover สามารถสลับ `AUTH_MODE` จาก `sso_only` กลับเป็น `hybrid` ผ่าน Environment Variable เพื่อใช้ Local Auth สำรองชั่วคราวโดยไม่ต้อง Deploy โค้ดใหม่

---

## 4. Assumptions

1. ช่วง Phase 1 สามารถใช้งาน Local Authentication แทน KKU SSO ชั่วคราวได้จนกว่าจะได้ข้อมูลจาก KKU IT
2. ผู้ใช้งานเดิมในระบบมีเพียง Admin และ Evaluator ที่ถูกสร้างโดย Admin ในตาราง `users` (ไม่มี Self-registration)

---

## 5. Open Questions

1. ช่วง Phase 2 ต้องการเปิด `AUTH_MODE=hybrid` นานเท่าใดก่อนตัดเข้า `sso_only`?
2. ใน `backend/test/*.e2e-spec.ts` ปัจจุบันมีการส่ง `X-User-Id` จำนวนมาก — ยืนยันแนวทางการอัปเดต E2E tests ให้ Login ผ่าน `/api/v1/auth/login` ใน Phase 1

---

## 6. Risks

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Test Suite เดิมพังทั้งหมดเมื่อเปลี่ยนจาก `X-User-Id`** | CI ล้มเหลวระหว่างเปลี่ยนผ่าน | เตรียม Auth Test Helper สำหรับ E2E ใน Phase 1 ควบคู่กับการเปลี่ยน Guard |
| **ลืมลบ Mock Fallback ใน Frontend** | ผู้ใช้เห็นข้อมูลปลอมแทน Error จริง | ตรวจสอบ `allocation.service.ts`, `reports.service.ts`, `navigation.ts` ทุกจุด |

---

## 7. Decisions Required from Developer

1. **อนุมัติ Roadmap 3 ระยะ** (Phase 1 Local Auth → Phase 2 Hybrid SSO → Phase 3 SSO Only)
2. **อนุมัติการลบ `MockAuthGuard` และ `RoleDispatchGuard` ออกจาก Production Runtime** ใน Phase 1
3. **กำหนดนโยบาย Break-glass Account** ใน Phase 3 (ปิด Local Auth 100% หรือคง Emergency Admin ไว้ 1 บัญชี)
