# AUTHORIZATION_MATRIX.md — Role-Based & Object-Level Authorization Matrix

> **Status:** Architecture Design Only (Read-Only Mission 02 — No Source Code Modified)  
> **Roles:** `ADMIN`, `EVALUATOR` (from `enum UserRole` in `backend/prisma/schema.prisma`)

---

## 1. Verified Findings (ตรวจสอบจาก Source Code ปัจจุบัน)

| Controller | Endpoint | Current Guards & Role Source | Verified Security Gap |
| :--- | :--- | :--- | :--- |
| `AppController` | `GET /`, `GET /health` | None | Public (Expected for healthcheck) |
| `ScholarshipTypesController` | `GET /scholarship-types`, `GET /scholarship-types/:id` | **None** | **ไม่มี Authentication Guard** — เข้าถึงได้โดยไม่ล็อกอิน |
| `ScholarshipTypesController` | `POST`, `PUT`, `PATCH :id/toggle-active`, `DELETE` | `RoleDispatchGuard`, `RolesGuard`, `@Roles(ADMIN)` | ใช้ `X-User-Id` (Mock Auth) |
| `CriteriaController` | `GET /criteria` (`findAll`) | `RoleDispatchGuard` (No `@Roles`) | ไม่ตรวจ Role และไม่กรองรายการสำหรับ Evaluator |
| `CriteriaController` | `GET /criteria/:id` (`findOne`) | `RoleDispatchGuard` | **Authorization Bypass:** อ่าน `@Headers('x-user-role')` และ `@Query('userRole')` แทน `request.resolvedRole` |
| `CriteriaController` | `POST`, `PUT`, `DELETE` | `RoleDispatchGuard`, `RolesGuard`, `@Roles(ADMIN)` | ใช้ `X-User-Id` (Mock Auth) |
| `RoundsController` | `GET /scholarship-rounds` (`findAll`), `GET /:id` (`findOne`) | `RoleDispatchGuard` | ยังมี fallback `roleHeader \|\| roleQuery` |
| `RoundsController` | `POST`, `PATCH`, `DELETE`, `open`, `close`, `allocation/*` | `RoleDispatchGuard`, `RolesGuard`, `@Roles(ADMIN)` | ใช้ `X-User-Id` (Mock Auth) |
| `ApplicantsController` | `GET /scholarship-rounds/:roundId/applicants`, `GET /applicants/:id`, `GET /applicants/:id/travel-distance` | `RoleDispatchGuard` | ยังมี fallback `roleHeader \|\| roleQuery` |
| `ApplicantsController` | `preview-excel`, `import`, `import-previews`, `imports`, `history/:studentCode`, `reveal-citizen-id` | `RoleDispatchGuard`, `RolesGuard`, `@Roles(ADMIN)` | ใช้ `X-User-Id` (Mock Auth) |
| `EvaluationController` | `GET/PUT /applicants/:applicantId/my-evaluation`, `POST .../submit` | `MockAuthGuard`, `RolesGuard`, `@Roles(EVALUATOR)` | ใช้ `X-User-Id` (Mock Auth) |
| `EvaluationResultsController` | `GET /scholarship-rounds/:roundId/evaluation-results`, `GET /applicants/:applicantId/evaluation-results` | `RoleDispatchGuard`, `RolesGuard`, `@Roles(ADMIN)` | ใช้ `X-User-Id` (Mock Auth) |
| *(Missing)* Reports Module | `/scholarship-rounds/:roundId/reports/*` | **ไม่มี Backend Implementation** | `frontend/src/services/reports.service.ts` เรียก `/api/scholarship-rounds/...` และ fallback สร้าง mock file |

---

## 2. Proposed Design

### 2.1 Authorization Principles

1. **Authentication vs Authorization Separation:**
   - **401 Unauthorized:** ไม่มี Session Cookie, Session หมดอายุ/ถูกเพิกถอน, บัญชีถูกปิด (`isActive = false`), หรือบัญชีหมดอายุในกรณีที่ไม่อนุญาตให้ใช้งาน
   - **403 Forbidden:** ยืนยันตัวตนสำเร็จแล้ว แต่ `user.role` ไม่มีสิทธิ์ หรือไม่ผ่าน Object-level Authorization
2. **Database Wins:** `user.id` และ `user.role` ต้องมาจาก `UserSession -> User` บน Server เท่านั้น **ห้ามเชื่อถือ `X-User-Id`, `X-User-Role`, หรือ Query `userRole` โดยเด็ดขาด**
3. **Fail-Closed Default:** ใช้ Global `SessionAuthGuard` + `RolesGuard`; เฉพาะ Route ที่ประกาศ `@Public()` เท่านั้นที่เข้าถึงได้โดยไม่ต้องมี Session

### 2.2 Complete Endpoint Authorization Matrix

| Module / Controller | Endpoint | Auth | Allowed Roles | Object-Level & Business Rules |
| :--- | :--- | :--- | :--- | :--- |
| **App** | `GET /`, `GET /health` | `@Public()` | Public | ไม่เปิดเผยข้อมูล sensitive ใน `/health` |
| **Auth** | `POST /auth/login` | `@Public()` | Public | Rate-limited, Lockout check |
| **Auth** | `POST /auth/logout`, `GET /auth/me`, `POST /auth/change-password` | Session | `ADMIN`, `EVALUATOR` | ทำงานเฉพาะบน `request.user.id` ของตนเอง |
| **ScholarshipTypes** | `GET /scholarship-types`, `GET /scholarship-types/:id` | Session | `ADMIN` *(or `ADMIN`, `EVALUATOR` — see Decision #2)* | ต้องมี Authentication Guard; ตรวจสอบว่า Evaluator จำเป็นต้องดูรายการประเภททุนหรือไม่ |
| **ScholarshipTypes** | `POST`, `PUT`, `PATCH :id/toggle-active`, `DELETE` | Session | `ADMIN` | Admin only |
| **Criteria** | `GET /criteria` (`findAll`) | Session | `ADMIN` *(Proposed — see 2.3)* | Admin ดูได้ทั้งหมด; หากเปิดให้ Evaluator ต้องกรองเฉพาะเกณฑ์ที่ผูกกับรอบ `OPEN` |
| **Criteria** | `GET /criteria/:id` (`findOne`) | Session | `ADMIN`, `EVALUATOR` | **ใช้ `request.user.role` จาก DB เท่านั้น**; หากเป็น `EVALUATOR` ต้องตรวจว่าเกณฑ์นี้ผูกกับรอบ `OPEN` อย่างน้อย 1 รอบ (`BR-CRT-10`) มิฉะนั้นตอบ `403` หรือ `404` |
| **Criteria** | `POST`, `PUT`, `DELETE` | Session | `ADMIN` | Admin only; `BR-CRT-09` (ล็อกหากใช้ในรอบ `OPEN`/`CLOSED`) |
| **Rounds** | `GET /scholarship-rounds`, `GET /scholarship-rounds/:id` | Session | `ADMIN`, `EVALUATOR` | **ใช้ `request.user.role` จาก DB**; `EVALUATOR` เห็นเฉพาะรอบ `OPEN` (`BR-RND-11`) และไม่เห็นข้อมูลบริหารภายในของ Admin |
| **Rounds** | `POST`, `PATCH`, `PATCH :id/criteria`, `open-check`, `open`, `close-check`, `close`, `DELETE` | Session | `ADMIN` | Admin only |
| **Allocation** | `GET :id/allocation`, `POST budget`, `PUT items`, `POST finalize`, `POST reopen` | Session | `ADMIN` | Admin only; ห้าม Evaluator เข้าถึงข้อมูลงบประมาณ/การจัดสรร |
| **Applicants** | `GET /scholarship-rounds/:roundId/applicants`, `GET /applicants/:id`, `GET /applicants/:id/travel-distance` | Session | `ADMIN`, `EVALUATOR` | **ใช้ `request.user.role` จาก DB**; `EVALUATOR` เข้าถึงได้เฉพาะผู้สมัครในรอบ `OPEN` และต้อง**ไม่คืนข้อมูล `citizenId` หรือข้อมูลติดต่อต้องห้าม** ตามนโยบาย PDPA |
| **Applicants** | `preview-excel`, `import`, `import-previews`, `imports`, `history/:studentCode`, `reveal-citizen-id` | Session | `ADMIN` | Admin only; `reveal-citizen-id` บันทึก `AuditLog` (`VIEW_CITIZEN_ID`) |
| **Evaluation** | `GET /applicants/:applicantId/my-evaluation`, `PUT ...`, `POST .../submit` | Session | `EVALUATOR` | **Object-level:** ต้องเป็นผลประเมินของ `evaluatorId === request.user.id` เท่านั้น; รอบต้องเป็น `OPEN` (`BR-RND-13`); ตรวจ `expiresAt` (`BR-USR-10`/`BR-USR-11`: หากหมดอายุแล้วแก้ไขได้เฉพาะ Draft เดิม ห้ามสร้าง Draft ใหม่) |
| **EvaluationResults** | `GET /scholarship-rounds/:roundId/evaluation-results`, `GET /applicants/:applicantId/evaluation-results` | Session | `ADMIN` | Admin only; Evaluator ห้ามดูคะแนนของผู้ประเมินคนอื่น |
| **Reports (Future)** | `GET /scholarship-rounds/:roundId/reports/evaluation-results`, `GET .../allocation-disbursement` | Session | `ADMIN` | Admin only; บันทึก `AuditLog` (`EXPORT_EVALUATION_REPORT`, `EXPORT_ALLOCATION_REPORT`); ห้ามส่ง Password ใน URL Query |

### 2.3 Criteria Visibility Policy (`BR-CRT-10`)

- **Confirmed in Code (`criteria.service.ts:209-218`):** `findOne` อนุญาตให้ `EVALUATOR` ดูเฉพาะเกณฑ์ที่ผูกกับรอบสถานะ `OPEN` อย่างน้อย 1 รอบ (`BR-CRT-10`)
- **Gap in `findAll`:** `CriteriaController.findAll` ยังไม่มี Role check
- **Proposed Options for `CriteriaController.findAll`:**
  - **Option A (Recommended):** จำกัด `GET /api/v1/criteria` ให้เป็น `@Roles(UserRole.ADMIN)` เท่านั้น (เนื่องจาก Evaluator ดูเกณฑ์ผ่านหน้าประเมินผู้สมัคร `/applicants/:id/my-evaluation` หรือ `GET /criteria/:id` ของรอบที่เปิดอยู่แล้ว)
  - **Option B:** อนุญาต `EVALUATOR` แต่ Backend บังคับกรอง `rounds: { some: { status: RoundStatus.OPEN } }`

---

## 3. Assumptions

1. ไม่มีบทบาทที่ 3 นอกจาก `ADMIN` และ `EVALUATOR` ในระยะนี้
2. `EVALUATOR` ทุกคนที่ Active สามารถประเมินผู้สมัครในรอบ `OPEN` ได้ทุกรอบ (ไม่มีตาราง Assignment แยก Evaluator รายรอบใน Schema ปัจจุบัน)

---

## 4. Open Questions

1. `GET /api/v1/scholarship-types` และ `GET /api/v1/scholarship-types/:id` จำเป็นต้องเปิดให้ `EVALUATOR` อ่านด้วยหรือไม่ หรือจำกัดเฉพาะ `ADMIN`?
2. สำหรับ `CriteriaController.findOne` เมื่อ `EVALUATOR` เรียกเกณฑ์ที่ไม่ได้ผูกกับรอบ `OPEN` ต้องการให้คืน `404 NOT_FOUND` (เพื่อซ่อนการมีอยู่) หรือ `403 FORBIDDEN`?

---

## 5. Risks

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **คง `roleHeader \|\| roleQuery` ไว้ในบางเมธอด** | Authorization Bypass | ลบ Parameter `@Headers('x-user-role')` และ `@Query('userRole')` ออกจากทุก Controller |
| **ลืมตรวจ `expiresAt` สำหรับ Evaluator ที่ยัง `isActive=true`** | Evaluator หมดอายุยังสร้าง Draft ใหม่ได้ | บังคับตรวจ `expiresAt` ทั้งใน `SessionAuthGuard` (login/session) และ `EvaluationWriteService` ตาม `BR-USR-10`, `BR-USR-11` |

---

## 6. Decisions Required from Developer

1. **Criteria `findAll` Policy (`BR-CRT-10`):** เลือก Option A (`ADMIN` only) หรือ Option B (`EVALUATOR` เห็นเฉพาะเกณฑ์ในรอบ `OPEN`)
2. **ScholarshipTypes Read Access:** กำหนดเป็น `ADMIN` only หรือ `ADMIN` + `EVALUATOR`
3. **Unauthorized Resource Response:** กรณี Evaluator เข้าถึง Criteria/Round ที่ไม่ใช่ `OPEN` ให้ตอบ `403 FORBIDDEN` หรือ `404 NOT_FOUND`
