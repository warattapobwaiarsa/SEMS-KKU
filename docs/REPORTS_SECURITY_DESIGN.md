# SEMS-KKU — Reports Module Security Design

> **Classification:** Internal / Security Architecture  
> **References:** `docs/08-security/security-review.md`, `BR-PDP-01` – `BR-PDP-12`, `FR-EXP-01` – `FR-EXP-09`

---

## 1. Threat Model & Existing Vulnerabilities Addressed

| ID | Risk / Defect in Current Codebase | Remediation in Reports Design |
|---|---|---|
| **C1 / M6** | `MockAuthGuard` / `RoleDispatchGuard` trust client-controlled `X-User-Id` header; `frontend/src/services/reports.service.ts` injects `X-User-Id: getAdminId()`. | **Hard Dependency on Real Auth:** Reports MUST use real `SessionAuthGuard` + `RolesGuard` (`@Roles(UserRole.ADMIN)`). `X-User-Id` and `X-User-Role` MUST NEVER be trusted as identity. |
| **M7 (URL Leak)** | `reports.service.ts` sends `?password=...` in `GET` query string, leaking file passwords to server access logs, proxies, browser history, and `Referer` headers. | Switch to `POST` with JSON body `{ roundId, password }`. Add logging redaction so `password` is never logged. |
| **M7 (Fake Fallback)** | `reports.service.ts` catches errors and downloads a plaintext mock `.xlsx` Blob, giving false assurance of encryption. | Remove fallback completely. Return explicit HTTP error envelope and surface error state in UI. |
| **ExcelJS Encryption Gap** | `exceljs@4.4.0` only supports worksheet protection (`sheet.protect`), **not** OOXML file-open AES encryption (`FR-EXP-06`). | Require real file-open encryption (OOXML Agile Encryption or AES-256 encrypted ZIP) before production use. Do not ship unencrypted PII pretending to be encrypted. |
| **H2 / BR-PDP-04** | Exposing `citizenId`, `phone`, `email` in preview lists or evaluation reports. | Evaluation Report & all preview endpoints strictly omit `ApplicantContact`. Allocation Export decrypts `citizenIdEncrypted` only when `AllocationStatus.FINALIZED` and `ADMIN` session is verified. |
| **C6 / M4** | `crypto.util.ts` falls back to a hardcoded dev AES key if `AES_CITIZEN_ID_KEY` is missing outside `NODE_ENV=production`. | Enforce `AES_CITIZEN_ID_KEY` startup validation; fail closed if decryption fails during Allocation Export. |
| **M2 (Rate Limiting)** | No rate limiting on expensive export/decryption endpoints. | Apply per-user rate limit: **5 requests / minute / User** on `POST /api/v1/reports/*/export` (per `sems-rest-api-specification.md`). |

---

## 2. Authentication Dependency (Blocking Production Use)

Per security constraints, **Authentication integration (KKU SSO / OIDC + `UserSession` cookie) is a separate pending dependency**:
1. **Cannot Safely Operate Before Real Auth:**
   - `POST /api/v1/reports/allocation/export` — decrypts and exports full 13-digit Thai Citizen IDs (`BR-EXP-06`) and disbursement data. With `X-User-Id` header spoofing, any caller could impersonate Admin (`X-User-Id: 1`) and exfiltrate all applicant PII.
   - `POST /api/v1/reports/evaluation-ranking/export` — exports evaluator identities, per-criterion scores, and comments (`H2`).
   - `GET /api/v1/reports/evaluation-results/preview` & `GET /api/v1/reports/allocation/preview` — exposes confidential evaluation rankings and allocation amounts.
2. **Development/Testing Guardrail:**
   - During local development *only*, `ReportsController` may use the same guard composition (`@UseGuards(RoleDispatchGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)`) so automated tests can run against `MockAuthGuard` / `RoleDispatchGuard` (which fail closed with `401` when `X-User-Id` is absent and block in `NODE_ENV === 'production'` unless `ALLOW_MOCK_AUTH === 'true'`).
   - **Production Gate:** Before any network-accessible or production deployment, `RoleDispatchGuard` / `MockAuthGuard` MUST be replaced globally with `SessionAuthGuard` backed by `UserSession` (`HttpOnly`, `Secure`, `SameSite` cookie).

---

## 3. Data Protection & Privacy Controls (PDPA)

### 3.1 Data Minimization by Endpoint
| Endpoint / Report | `studentCode`, `name`, `faculty`, `gpa` | Scores & Comments | `phone`, `email` | `citizenIdMasked` | Full `citizenId` |
|---|---|---|---|---|---|
| `GET /reports/rounds` | No | Aggregate counts only | No | No | No |
| `GET /reports/evaluation-results/preview` | Yes | Aggregate `finalScore` + stats | **No** | **No** | **No** |
| `GET /reports/allocation/preview` | Yes | `finalScore` only | **No** | **No** | **No** |
| `POST /reports/evaluation-ranking/export` | Yes | Per-evaluator scores & comments | **No** | **No** | **No** |
| `POST /reports/allocation/export` | Yes | `finalScore` & rank | Yes (if required for disbursement) | No | **Yes (Decrypted)** |

### 3.2 Password Handling Rules
1. **Transport:** `POST` JSON body over HTTPS (`BR-PDP-06`). Never in `GET` query string.
2. **Zero Persistence (`FR-EXP-07`):** Export password is used in-memory to encrypt the output buffer, then discarded. Never stored in PostgreSQL, `AuditLog`, or application logs.
3. **Excel Formula Injection (CSV/XLSX Injection) Mitigation:** Prefix any user-supplied string cell (`comment`, `textValue`, `firstName`, `lastName`, `faculty`) starting with `=`, `+`, `-`, `@`, `\t`, or `\r` with a leading single quote (`'`) when writing cells so Excel does not execute formulas on open.

### 3.3 Audit Logging (`FR-EXP-09`, `BR-EXP-08`)
Every successful export MUST write an immutable `AuditLog` record:
- `actorId`: `request.user.id` (from authenticated session, never null in production)
- `action`: `AuditAction.EXPORT_EVALUATION_REPORT` or `AuditAction.EXPORT_ALLOCATION_REPORT`
- `entityType`: `'ScholarshipRound'` or `'AllocationSummary'`
- `entityId`: `String(roundId)` or `String(summary.id)`
- `roundId`: `roundId`
- `detail`: `{ roundName, totalApplicants, recipientsCount?, exportedAt }` (NO password, NO citizenId)
