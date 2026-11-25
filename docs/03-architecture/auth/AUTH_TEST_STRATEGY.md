# AUTH_TEST_STRATEGY.md — Authentication & Authorization Test Strategy

> **Status:** Architecture Design Only (Read-Only Mission 02 — No Tests Executed or Modified)  
> **Frameworks:** Backend: Jest + Supertest | Frontend: Vitest + React Testing Library

---

## 1. Verified Findings (ตรวจสอบจาก Source Code ปัจจุบัน)

1. `backend/package.json` ใช้ `jest` (`^30.0.0`) และ `supertest` (`^7.0.0`) สำหรับ Unit (`*.spec.ts`) และ E2E (`test/jest-e2e.json`)
2. `frontend/package.json` ใช้ `vitest` (`^5.0.3`) และ `@testing-library/react` (`^16.3.3`)
3. ปัจจุบันมีไฟล์ทดสอบที่อ้างอิง Mock Auth เช่น `backend/src/common/guards/mock-auth.guard.spec.ts`, `backend/test/evaluation-privacy.e2e-spec.ts`, และ `frontend/src/lib/mock-evaluator.spec.ts`

---

## 2. Proposed Design (Test Matrix for Future Implementation)

### 2.1 Backend Unit Tests (Jest)

| Component | Test Cases Required |
| :--- | :--- |
| `SessionService` | สร้าง Session ด้วย CSPRNG และเก็บ SHA-256 hash; ตรวจ Idle Timeout (60 นาที); ตรวจ Absolute Timeout (12 ชม.); บังคับ Single Active Session (Login ใหม่เพิกถอน Session เดิม); เพิกถอนเมื่อ Logout / `revokedAt` |
| `LocalAuthAdapter` | Verify Argon2id password ถูกต้อง/ผิด; นับ `failedAttempts`; ล็อกบัญชีเมื่อครบเกณฑ์ (`lockedUntil`); รีเซ็ต counter เมื่อ Login สำเร็จ; บังคับ `mustChangePassword` |
| `SessionAuthGuard` | ปฏิเสธเมื่อไม่มี Cookie (`401`); ปฏิเสธเมื่อ Cookie ปลอม/หมดอายุ/ถูกเพิกถอน (`401`); ปฏิเสธเมื่อ `user.isActive = false` (`401`); ตรวจ `user.expiresAt` ตาม `BR-USR-06`/`BR-USR-10`; ปฏิเสธ `X-User-Id` header โดยไม่เชื่อถือ |
| `RolesGuard` | คืน `401` เมื่อไม่มี `request.user`; คืน `403` เมื่อ `user.role` ไม่ตรง `@Roles(...)`; อนุญาตเมื่อตรง |
| `CsrfGuard` | ปฏิเสธ `POST`/`PUT`/`PATCH`/`DELETE` ที่ไม่มี `X-CSRF-Token` หรือไม่ตรงกับ `sems_csrf` cookie (`403`) |

### 2.2 Backend Integration & E2E Security Tests (Supertest)

| Security Scenario | Expected Result |
| :--- | :--- |
| **Impersonation Prevention** | ส่ง Header `X-User-Id: 1` โดยไม่มี Session Cookie → ต้องได้ `401 Unauthorized` ทุก Protected Endpoint |
| **Role Bypass Regression (`CriteriaController.findOne`)** | ล็อกอินเป็น `EVALUATOR` แล้วส่ง `X-User-Role: ADMIN` และ `?userRole=ADMIN` เพื่อขอดูเกณฑ์ที่ผูกกับรอบ `DRAFT` → ต้องถูกปฏิเสธ (`403`/`404`) ตาม `BR-CRT-10` |
| **Unprotected Endpoint Closure (`ScholarshipTypesController`)** | เรียก `GET /api/v1/scholarship-types` และ `/:id` โดยไม่ล็อกอิน → ต้องได้ `401 Unauthorized` |
| **Cross-Role Privilege Escalation** | ล็อกอินเป็น `EVALUATOR` แล้วเรียก Admin APIs (`/allocation/*`, `/evaluation-results`, `/applicants/import`, `/reveal-citizen-id`, `DELETE /scholarship-rounds/:id`) → ต้องได้ `403 Forbidden` |
| **Object-Level Authorization (`EvaluationController`)** | Evaluator A เรียก/แก้/ส่งผลประเมินในรอบ `CLOSED` → ต้องถูกปฏิเสธ; Evaluator A ไม่สามารถอ่าน Draft ของ Evaluator B (`my-evaluation` ผูกกับ `request.user.id` เสมอ) |
| **Single Active Session (`FR-AUTH-06`)** | Login เครื่อง A → Login เครื่อง B ด้วยบัญชีเดียวกัน → เครื่อง A เรียก API ต่อต้องได้ `401` (Session Invalidated) และข้อมูล Draft ที่ Auto-save ไว้ยังอยู่ครบ |
| **Brute-Force & Rate Limiting** | ยิง `POST /api/v1/auth/login` ผิดเกินเกณฑ์ → ถูก Rate Limit (`429`) หรือ Account Lockout และบันทึก `AuditLog` |
| **Production Fail-Closed** | ตั้ง `NODE_ENV=production` และไม่มี Secret → แอปต้องไม่ Boot หรือปฏิเสธ Mock Headers ทั้งหมด |

### 2.3 Frontend Tests (Vitest + RTL)

| Component / Flow | Test Cases Required |
| :--- | :--- |
| `apiClient` | ส่ง `credentials: 'include'`, แนบ `X-CSRF-Token` เฉพาะ Mutation, **ไม่ส่ง `X-User-Id`**, ไม่ใช้ `localStorage` |
| `LoginPage` | Validation อีเมล/รหัสผ่าน, แสดง Error (401/429/Account Locked), Redirect ตาม Role (`ADMIN` → `/admin/...`, `EVALUATOR` → `/evaluator/...`) |
| `Protected Layouts` | เมื่อ `/auth/me` คืน `401` ให้ Redirect ไป `/login?reason=session_expired`; เมื่อ Role ไม่ตรงให้แสดง `403` หรือ Redirect |
| `allocation.service.ts` | เมื่อ API คืน `401`/`403`/`500` ต้อง Throw `ApiError` (ห้ามคืน `success: true` ปลอม) |

---

## 3. Assumptions

1. E2E Tests ในระยะ Phase 1 จะใช้ Test Database แยก และสร้าง Session ผ่าน `POST /api/v1/auth/login` จริง

---

## 4. Open Questions

1. ต้องการให้แยก `jest-security.json` สำหรับ Security Regression Suite ใน CI Pipeline หรือรวมไว้ใน `test:e2e`?

---

## 5. Risks

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **E2E Tests เก่าพึ่งพา `X-User-Id`** | เทสเดิมล้มเหลวจำนวนมากเมื่อเปิดใช้ `SessionAuthGuard` | สร้าง `loginAs(role)` helper สำหรับ Supertest agent ที่เก็บ cookie jar |

---

## 6. Decisions Required from Developer

1. **อนุมัติการบังคับ Security Regression Tests** (Impersonation, `CriteriaController.findOne`, `ScholarshipTypesController`, `401` vs `403`) เป็น Gate ใน CI ก่อน Merge Phase 1
