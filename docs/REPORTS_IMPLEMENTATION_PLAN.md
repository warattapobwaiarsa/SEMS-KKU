# SEMS-KKU — Reports Module Implementation Plan

> **Mode:** Planning Only (Wait for Developer Approval before Phase 1 execution)  
> **Dependencies:** KKU SSO / Session Auth (separate pending track); File-Open Encryption decision (`exceljs` limitation)

---

## 1. Implementation Phases

### Phase 0: Security & Business Decision Gates (Pre-Implementation)
- Resolve open business decisions (see Section 3):
  1. Excel file-open encryption mechanism (`officecrypto-tool` / `xlsx-populate` vs. AES-256 encrypted `.zip` wrapping `.xlsx`).
  2. Export password rules (`BR-EXP-04` "any password" vs. `PasswordExportModal` 6-char minimum).
  3. Exact worksheet names & column order for both reports (`FR-EXP-05` `[TBD]`).
  4. Whether `phone` / `email` should be included in the Allocation Export (`BR-PDP-05`).
- Confirm `GET /api/v1/scholarship-types` is guarded with `@Roles(UserRole.ADMIN)` (or appropriate role) before linking it in Reports UI.

### Phase 1: Backend `ReportsModule` & Preview Endpoints
1. Create `backend/src/reports/`:
   - `dto/query-report-rounds.dto.ts`
   - `dto/report-preview-query.dto.ts`
   - `dto/export-report.dto.ts`
   - `reports.service.ts` (read-only round list with readiness flags, evaluation preview with stats, allocation preview without GET side-effects)
   - `reports.controller.ts` (protected with Auth Guard + `RolesGuard` + `@Roles(UserRole.ADMIN)`)
   - `reports.module.ts` (register in `AppModule`)
2. Reuse `calculateFinalScore` & `formatScoreDisplay` from `backend/src/evaluation/final-score.ts` and tie-break sorting (`BR-SCR-05`).

### Phase 2: Backend Excel Generation, Encryption & Audit Logging
1. Implement `backend/src/reports/excel-report-builder.service.ts`:
   - **Evaluation Results & Rankings Workbook:** Summary sheet (Round metadata, Max/Min/Mean/SD, export timestamp UTC+7) + Rankings & Evaluator Breakdown sheet (fixed columns, `0.00` for un-evaluated applicants, no Citizen ID/phone/email, formula-injection sanitization).
   - **Allocation & Disbursement Workbook:** Summary sheet (Budget, Allocated, Remaining, Recipients, Finalized timestamp) + Disbursement sheet (Awarded/All applicants, decrypted 13-digit Citizen ID via `decryptCitizenId`, allocated amount, formula-injection sanitization).
   - Apply approved file-open encryption using the request `password` in memory.
2. Implement `POST /api/v1/reports/evaluation-ranking/export` and `POST /api/v1/reports/allocation/export`:
   - Enforce `RoundStatus.CLOSED` (`BR-EXP-01`) and `AllocationStatus.FINALIZED` (`BR-EXP-02`).
   - Write `AuditLog` (`EXPORT_EVALUATION_REPORT` / `EXPORT_ALLOCATION_REPORT`) without logging `password`.
   - Stream binary buffer via `StreamableFile` with `Content-Disposition`, `Content-Type`, `Cache-Control: no-store`.
   - Apply rate limiting (5/min/user).

### Phase 3: Frontend Reports Center & Service Remediation
1. **Fix `frontend/src/services/reports.service.ts`:**
   - Replace `GET /api/scholarship-rounds/...?password=...` with `POST /api/v1/reports/evaluation-ranking/export` and `POST /api/v1/reports/allocation/export` using JSON body `{ roundId, password }`.
   - Remove the fake plaintext `.xlsx` fallback completely; throw `ApiError` with localized Thai error messages (`formatErrorMessage`).
   - Add `fetchReportRounds`, `fetchEvaluationReportPreview`, `fetchAllocationReportPreview`.
2. **Build `/admin/reports` (`frontend/src/app/(admin)/admin/reports/page.tsx`):**
   - Replace `PlaceholderPage` with full Reports Center matching wireframes `p1`–`p9`:
     - Filter bar (Scholarship Type, Academic Year, Semester, Status, Search).
     - Round selector & status readiness cards.
     - Read-only preview table (PII-safe) + statistical summary.
     - Export buttons wired to `PasswordExportModal`.
3. **Update `RoundReportsTab` (`frontend/src/components/rounds/round-reports-tab.tsx`):**
   - Ensure it uses the updated `reports.service.ts` `POST` methods and handles errors cleanly without fake fallbacks.

### Phase 4: Verification, Security Review & Auth Swap Readiness
1. Run Backend Jest unit & Supertest E2E tests (`npm run test:backend`, `npm run test:e2e --workspace=backend`).
2. Run Frontend Vitest & React Testing Library tests (`npm run test:frontend`).
3. Verify `git diff` against `AGENTS.md` and `docs/08-security/security-review.md` checklist.
4. Once KKU SSO (`SessionAuthGuard`) is implemented in its dedicated mission, swap `RoleDispatchGuard` -> `SessionAuthGuard` on `ReportsController` and remove `X-User-Id` injection from `apiClient` / `reports.service.ts`.

---

## 2. Acceptance Criteria

- [ ] `GET /api/v1/reports/rounds`, `preview`, and `POST /export` endpoints return `401 UNAUTHORIZED` when unauthenticated and `403 FORBIDDEN` for `EVALUATOR` role.
- [ ] Evaluation export returns `409 INVALID_ROUND_STATUS` (`MSG-27`) when round is `DRAFT` or `OPEN`.
- [ ] Allocation export returns `409 INVALID_ALLOCATION_STATUS` (`MSG-27`) when allocation is `EDITING` or missing.
- [ ] Exported `.xlsx` (or encrypted `.zip`) cannot be opened without the exact user-supplied password (`FR-EXP-06`).
- [ ] Evaluation export contains **zero** `citizenId`, `phone`, or `email` fields (`FR-EXP-02`, `BR-EXP-06`).
- [ ] Allocation export contains valid 13-digit decrypted `citizenId` (`FR-EXP-04`, `BR-EXP-06`).
- [ ] `AuditLog` records `EXPORT_EVALUATION_REPORT` / `EXPORT_ALLOCATION_REPORT` on every export, with **no** `password` or `citizenId` in logs or DB (`FR-EXP-07`, `FR-EXP-09`).
- [ ] Frontend `reports.service.ts` never sends passwords in URLs and never generates fake `.xlsx` blobs on failure.
- [ ] `/admin/reports` replaces `PlaceholderPage` with working filters, preview table, and export modal.

---

## 3. Unresolved Business Decisions (Require Developer / Stakeholder Input)

1. **File-Open Encryption Mechanism:** `exceljs@4.4.0` cannot encrypt `.xlsx` files for open-password protection. Should we (a) add an OOXML encryption package (requires dependency approval), or (b) wrap the `ExcelJS`-generated `.xlsx` inside an AES-256 password-protected `.zip`?
2. **Password Policy Mismatch:** `BR-EXP-04` states *"no length/complexity rules"*, whereas `PasswordExportModal` (`frontend/src/components/reports/password-export-modal.tsx:80`) enforces `password.length < 6`. Which rule should be canonical?
3. **Allocation Export Scope:** Should the Allocation & Disbursement Excel include **only `isAwarded = true`** recipients or **all applicants** in the round with an `isAwarded` status column? Also confirm whether `phone` and `email` should be included (`BR-PDP-05`).
4. **Worksheet & Column Layout (`FR-EXP-05` `[TBD]`):** Confirm exact Thai/English column headers and sheet structure (e.g., Summary sheet + Detail sheet, and whether Evaluation Report shows per-evaluator columns dynamically).
