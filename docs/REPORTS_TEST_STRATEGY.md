# SEMS-KKU — Reports Module Test Strategy

> **Backend Framework:** Jest 30 + Supertest 7 (`backend/test/jest-e2e.json`)  
> **Frontend Framework:** Vitest 5 + React Testing Library 16

---

## 1. Backend Unit Tests (`backend/src/reports/*.spec.ts`)

| Test Target | Test Cases |
|---|---|
| `ReportsService` | - `getReportRounds`: filters by `scholarshipTypeId`, `academicYear`, `semester`, `status`, `search`; computes `canExportEvaluation` (`CLOSED`) and `canExportAllocation` (`FINALIZED`) accurately.<br>- `getEvaluationPreview`: includes only `SUBMITTED` evaluations; assigns `0.00` to applicants with 0 submitted evaluations (`BR-EXP-07`); computes Max, Min, Mean, SD accurately; excludes `ApplicantContact` fields.<br>- `getAllocationPreview`: does **not** create `AllocationSummary` if missing; excludes raw `citizenId`, `phone`, `email`.<br>- `exportEvaluationReport`: throws `409 INVALID_ROUND_STATUS` for `DRAFT`/`OPEN`; throws `404` for missing round; writes `AuditLog` (`EXPORT_EVALUATION_REPORT`) with non-sensitive `detail`.<br>- `exportAllocationReport`: throws `409 INVALID_ALLOCATION_STATUS` for `EDITING` or missing summary; decrypts `citizenIdEncrypted` via `decryptCitizenId`; writes `AuditLog` (`EXPORT_ALLOCATION_REPORT`). |
| `ExcelReportBuilderService` | - Generates valid `.xlsx` buffer readable by ExcelJS (when decrypted with password).<br>- Verifies fixed columns and absence of `citizenId`/`phone`/`email` in Evaluation workbook.<br>- Verifies presence of decrypted 13-digit `citizenId` in Allocation workbook.<br>- Verifies formula-injection neutralization (`=SUM(A1)` -> `'=SUM(A1)`).<br>- Verifies encrypted output fails to open with wrong/empty password and succeeds with correct password (`FR-EXP-06`). |
| `ExportReportDto` | - Rejects missing/empty `password`, non-integer `roundId`, `roundId <= 0`, and extra whitelisted properties. |

---

## 2. Backend Integration & E2E Tests (`backend/test/reports.e2e-spec.ts`)

Using `backend/test/helpers/test-app.ts` and `FakePrismaService` (or test DB):
1. **Authentication & RBAC (Fail-Closed):**
   - Anonymous request (no auth/session) to every `/api/v1/reports/*` endpoint -> `401 UNAUTHORIZED`.
   - `EVALUATOR` role on every `/api/v1/reports/*` endpoint -> `403 FORBIDDEN`.
   - `ADMIN` role -> allowed (when business state preconditions pass).
2. **State Machine Gates:**
   - `POST /api/v1/reports/evaluation-ranking/export` on `OPEN` round -> `409 INVALID_ROUND_STATUS`.
   - `POST /api/v1/reports/allocation/export` on `CLOSED` round with `EDITING` allocation -> `409 INVALID_ALLOCATION_STATUS`.
3. **Security & Privacy:**
   - Verify `password` is **never** accepted in query string (`?password=...` on `POST` is ignored/rejected by `forbidNonWhitelisted`).
   - Verify response headers: `Content-Disposition: attachment; ...`, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`.
   - Verify `AuditLog` entry is created and `detail` contains no `password` or `citizenId`.
   - Verify rate limiting returns `429 TOO_MANY_REQUESTS` after 5 export requests/minute/user.

---

## 3. Frontend Tests (`frontend/src/**/*.spec.tsx`)

| Test Target | Test Cases |
|---|---|
| `reports.service.ts` | - Calls `POST /api/v1/reports/evaluation-ranking/export` and `POST /api/v1/reports/allocation/export` with `{ roundId, password }` in JSON body (never in URL query string).<br>- Triggers Blob download on `200 OK`.<br>- Throws `ApiError` on `401`/`403`/`409`/`500` and **never** creates a fake `.xlsx` fallback Blob. |
| `ReportsPage` (`/admin/reports`) | - Renders filter controls (Scholarship Type, Academic Year, Semester, Status, Search) and empty/unselected state (`p1`).<br>- Disables Evaluation export when round is `OPEN` (`p2`), enables when `CLOSED` (`p3`).<br>- Disables Allocation export when allocation is `EDITING`, enables when `FINALIZED` (`p4`).<br>- Displays preview table without `citizenId`, `phone`, or `email`.<br>- Shows error banner when export fails (`p9`). |
| `PasswordExportModal` & `RoundReportsTab` | - Existing `password-export-modal.spec.tsx` continues to pass; add test verifying error propagation from `onExport` keeps error visible without false success. |
