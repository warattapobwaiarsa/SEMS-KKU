# ARCHITECTURE_DECISIONS.md — Architecture Decision Records (ADRs)

> **Status:** Architecture Design Only (Read-Only Mission 02 — Pending Developer Approval)

---

## 1. Verified Findings (บริบทที่ยืนยันจาก Source Code)

1. ระบบปัจจุบันใช้ `X-User-Id` (`MockAuthGuard`, `RoleDispatchGuard`), `localStorage` (`mock-evaluator.ts`), และไม่มี Backend Session Validation
2. `UserSession` มีอยู่ใน `backend/prisma/schema.prisma` (`userId @unique`, `sessionId @unique`)
3. `frontend/next.config.ts` มี `rewrites()` สำหรับ `/api/v1/:path*` ไปยัง `BACKEND_INTERNAL_URL`
4. ยังไม่มีข้อมูล Technical Specification ของ KKU SSO จาก KKU IT

---

## 2. Proposed Design (Architecture Decision Records)

### ADR-001: Server-Side Opaque Session in PostgreSQL + HttpOnly Cookie (vs Stateless JWT)
- **Context:** ระบบต้องการ Single Active Session (`FR-AUTH-06`), Idle Timeout 60 นาที (`FR-AUTH-07`), และการเพิกถอน Session ทันทีเมื่อ Admin ปิดบัญชี (`BR-USR-12`)
- **Decision:** ใช้ **Opaque Session Token** ใน `HttpOnly`, `SameSite=Lax`, `Secure` Cookie คู่กับตาราง `UserSession` ใน PostgreSQL (เก็บ SHA-256 hash)
- **Alternatives Considered:**
  - *Stateless JWT:* เพิกถอนทันทีไม่ได้ (ต้องมี Blocklist ซึ่งสุดท้ายต้องพึ่ง DB/Redis อยู่ดี) และเสี่ยงต่อการเก็บใน `localStorage`
  - *Redis Session Store:* เร็วกว่า PostgreSQL แต่เพิ่ม Infrastructure dependency ใหม่ใน `docker-compose` โดยไม่จำเป็นสำหรับสเกลผู้ใช้ระดับคณะ
- **Status:** Proposed — Pending Developer Approval

### ADR-002: IdentityProviderAdapter Abstraction (Protocol-Agnostic SSO Boundary)
- **Context:** ยังไม่ทราบว่า KKU SSO ใช้ OIDC, OAuth 2.0, SAML 2.0 หรือโปรโตคอลอื่น
- **Decision:** แยก `AuthService` + `SessionService` ออกจาก `IdentityProviderAdapter` interface; Phase 1 ใช้ `LocalAuthAdapter` และ Phase 2 เพิ่ม `KkuSsoAdapter` โดยไม่แก้ Session Core หรือ Guards
- **Consequences:** สามารถพัฒนาและขึ้น Production ด้วย Local Auth ได้ทันทีโดยไม่ติด KKU IT
- **Status:** Proposed — Pending Developer Approval

### ADR-003: Interim Local Authentication with Argon2id
- **Context:** `FR-AUTH-01` กำหนด KKU SSO เท่านั้น แต่ Production ปัจจุบันใช้ไม่ได้เพราะ `ALLOW_MOCK_AUTH=false`
- **Decision:** เปิดใช้ Local Authentication ชั่วคราวใน Phase 1 โดยใช้ `Argon2id` (memory-hard), Rate Limiting, Lockout 5 ครั้ง/15 นาที, และ CLI Bootstrap Admin (ไม่มี Default Password ในโค้ด)
- **Alternatives Considered:** *bcrypt* (อ่อนไหวต่อ GPU/ASIC มากกว่าและจำกัด 72 bytes)
- **Status:** Proposed — Requires Business/Owner Sign-off (Temporary Deviation from `FR-AUTH-01`)

### ADR-004: Fail-Closed Global `SessionAuthGuard` + `@Public()` Decorator
- **Context:** ปัจจุบัน `ScholarshipTypesController.findAll`/`findOne` ไม่มี Guard และ `CriteriaController.findOne` อ่าน Header/Query ปลอม
- **Decision:** ลงทะเบียน `SessionAuthGuard` และ `RolesGuard` เป็น Global Guards (`APP_GUARD` ใน `AppModule`) และอนุญาตเฉพาะ Route ที่ติด `@Public()` (`/health`, `/auth/login`)
- **Consequences:** ป้องกันความเสี่ยง "ลืมติด `@UseGuards`" ใน Endpoint ใหม่ในอนาคต (รวมถึง Reports Module ที่กำลังจะพัฒนา)
- **Status:** Proposed — Pending Developer Approval

### ADR-005: Same-Origin Proxy (`/api/v1/*`) + Double-Submit CSRF Protection
- **Context:** `next.config.ts` rewrite `/api/v1/*` ไปยัง Backend อยู่แล้ว
- **Decision:** ใช้ Same-Origin First-Party Cookie (`SameSite=Lax`) ผ่าน Proxy ของ Next.js/Reverse Proxy ร่วมกับ Double-Submit CSRF Token (`sems_csrf` cookie + `X-CSRF-Token` header)
- **Status:** Proposed — Pending Developer Approval

### ADR-006: Criteria Visibility Policy (`BR-CRT-10`)
- **Context:** `CriteriaController.findOne` มี Bypass จาก `x-user-role`/`userRole`; `CriteriaController.findAll` ยังไม่กรอง Role
- **Decision:**
  - `findOne`: ใช้ `request.user.role` จาก DB เท่านั้น; `EVALUATOR` ดูได้เฉพาะเกณฑ์ที่ผูกกับรอบ `OPEN` (`BR-CRT-10`)
  - `findAll`: เสนอจำกัดเฉพาะ `ADMIN` (Option A) หรือกรองเฉพาะรอบ `OPEN` สำหรับ `EVALUATOR` (Option B)
- **Status:** Open Decision Required from Developer

---

## 3. Assumptions

1. โครงสร้าง Infrastructure ใน Production รองรับ Reverse Proxy แบบ Same-Origin และ HTTPS

---

## 4. Open Questions

1. การตอบสนองเมื่อ `EVALUATOR` เข้าถึง Criteria/Round ที่ไม่ใช่ `OPEN` ควรคืน `403 FORBIDDEN` หรือ `404 NOT_FOUND`?
2. ใน Phase 3 หลังเปิด KKU SSO ต้องการปิด Local Auth ทั้งหมดหรือคง Break-glass Admin ไว้ 1 บัญชี?

---

## 5. Risks

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **ความล่าช้าในการตัดสินใจ ADR-003 / ADR-006** | ชะลอการเริ่ม Phase 1 Implementation | สรุปตัวเลือกที่ชัดเจนให้ Developer อนุมัติก่อนเริ่ม Mission ถัดไป |

---

## 6. Decisions Required from Developer

1. อนุมัติ **ADR-001** (PostgreSQL Opaque Session + HttpOnly Cookie)
2. อนุมัติ **ADR-002** (`IdentityProviderAdapter` Boundary)
3. อนุมัติ **ADR-003** (Interim Local Auth + Argon2id — ยอมรับการเบี่ยงเบนชั่วคราวจาก `FR-AUTH-01`)
4. อนุมัติ **ADR-004** (Global `SessionAuthGuard` + `@Public()`)
5. อนุมัติ **ADR-005** (Same-Origin Proxy + Double-Submit CSRF)
6. เลือกแนวทางสำหรับ **ADR-006** (`CriteriaController.findAll` Option A vs Option B และ `403` vs `404`)
