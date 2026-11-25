# SEMS-KKU — Reports Module API Specification

> **Base Prefix:** `/api/v1` (configured in `backend/src/main.ts`)  
> **Response Envelope:** JSON endpoints follow `TransformInterceptor` (`{ success, statusCode, data, meta? }`) and `HttpExceptionFilter` (`{ success: false, statusCode, errorCode, error, message, params?, timestamp }`).  
> **Auth Requirement:** All `/reports/*` endpoints require authenticated `ADMIN` role (`SessionAuthGuard` + `RolesGuard`).

---

## 1. Existing Endpoints Reused by Reports UI

| Method | Endpoint | Role | Purpose in Reports UI |
|---|---|---|---|
| `GET` | `/api/v1/scholarship-types` | `ADMIN` (currently unguarded in `ScholarshipTypesController` — must be guarded) | Populate Scholarship Type filter dropdown. |
| `GET` | `/api/v1/scholarship-rounds` | `ADMIN` | List/search rounds (`page`, `limit`, `search`, `academicYear`, `semester`, `status`). |
| `GET` | `/api/v1/scholarship-rounds/:roundId/evaluation-results` | `ADMIN` | Preview evaluation rankings if needed (already implemented in `EvaluationResultsController`). |

---

## 2. New Reports Endpoints (`ReportsController`)

### 2.1 `GET /api/v1/reports/rounds`
List scholarship rounds enriched with report readiness flags (`canExportEvaluation`, `canExportAllocation`, `allocationStatus`, `applicantCount`, `submittedEvaluationCount`) and filterable by `scholarshipTypeId`, `academicYear`, `semester`, `status`, `search`.

- **Query DTO (`QueryReportRoundsDto`):**
  - `page?: number` (int >= 1, default `1`)
  - `limit?: number` (int 1..100, default `20`)
  - `scholarshipTypeId?: number` (int >= 1)
  - `academicYear?: number` (int)
  - `semester?: number` (int 1..3)
  - `status?: RoundStatus` (`DRAFT` | `OPEN` | `CLOSED`)
  - `search?: string` (maxLength 100)
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "data": [
      {
        "id": 1,
        "name": "ทุนขาดแคลนทุนทรัพย์ ประจำปี 2569",
        "academicYear": 2569,
        "semester": 1,
        "status": "CLOSED",
        "scholarshipType": { "id": 1, "name": "ทุนขาดแคลนทุนทรัพย์" },
        "allocationStatus": "FINALIZED",
        "totalApplicants": 120,
        "evaluatedApplicants": 120,
        "canExportEvaluation": true,
        "canExportAllocation": true
      }
    ],
    "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
  }
  ```

---

### 2.2 `GET /api/v1/reports/evaluation-results/preview`
Read-only, PII-safe preview of evaluation results and statistical summary before exporting.

- **Query DTO (`ReportPreviewQueryDto`):**
  - `roundId: number` (required, int >= 1)
  - `faculty?: string` (maxLength 100)
  - `search?: string` (maxLength 100)
  - `page?: number` (int >= 1, default `1`)
  - `limit?: number` (int 1..100, default `20`)
- **Authorization & PII Rules:** `ADMIN` only. **Must NOT** return `citizenId`, `citizenIdMasked`, `phone`, or `email`.
- **Response (`200 OK`):** Returns `round`, `statistics` (`totalApplicants`, `evaluatedApplicants`, `maxScore`, `minScore`, `meanScore`, `standardDeviation`), and paginated `items` (`rank`, `applicantId`, `studentCode`, `titlePrefix`, `firstName`, `lastName`, `faculty`, `major`, `studyYear`, `gpa`, `submittedCount`, `finalScore`).
- **Errors:** `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND` (round not found).

---

### 2.3 `GET /api/v1/reports/allocation/preview`
Read-only, PII-safe preview of allocation summary and recipients before exporting.

- **Query DTO (`ReportPreviewQueryDto`):**
  - `roundId: number` (required, int >= 1)
  - `isAwarded?: boolean`
  - `search?: string` (maxLength 100)
  - `page?: number` (int >= 1, default `1`)
  - `limit?: number` (int 1..100, default `20`)
- **Authorization & PII Rules:** `ADMIN` only. **Must NOT** return raw `citizenId`, `phone`, or `email` in preview lists (`BR-PDP-04`, `BR-PDP-05`). Does **not** auto-create `AllocationSummary` if absent.
- **Response (`200 OK`):** Returns `round`, `summary` (`totalBudget`, `allocatedAmount`, `remainingBudget`, `recipientsCount`, `status`), and paginated `items` (`rank`, `applicantId`, `studentCode`, `titlePrefix`, `firstName`, `lastName`, `faculty`, `major`, `gpa`, `finalScore`, `isAwarded`, `amount`).

---

### 2.4 `POST /api/v1/reports/evaluation-ranking/export`
Exports the **Evaluation Results & Rankings Report** (`.xlsx`, password-protected).

- **Request Body DTO (`ExportReportDto`):**
  ```ts
  export class ExportReportDto {
    @IsInt()
    @Min(1)
    roundId: number;

    @IsString()
    @IsNotEmpty()
    @MinLength(6) // Subject to BR-EXP-04 confirmation
    @MaxLength(128)
    password: string;
  }
  ```
- **Security Rules:**
  - Password MUST be sent in `POST` JSON body, **never** in URL query string.
  - Request logging / error filters MUST redact `password`.
  - Password MUST NOT be persisted in DB or `AuditLog`.
- **Business Rules:**
  - Round must exist (`404 NOT_FOUND` otherwise).
  - `round.status` MUST be `CLOSED` (`409 INVALID_ROUND_STATUS` / `MSG-27` otherwise) (`BR-EXP-01`).
  - Excludes `citizenId`, `phone`, `email` (`BR-EXP-06`).
  - Applicants with 0 `SUBMITTED` evaluations receive `finalScore = 0.00` (`BR-EXP-07`).
  - Records `AuditLog` (`action: AuditAction.EXPORT_EVALUATION_REPORT`, `actorId`, `roundId`, `entityType: 'ScholarshipRound'`, `entityId: String(roundId)`).
- **Success Response (`200 OK`):**
  - Binary `.xlsx` stream
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="sems_evaluation_results_round_{roundId}_{timestamp}.xlsx"`
- **Error Responses:** `400 BAD_REQUEST` (validation), `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 INVALID_ROUND_STATUS`, `429 TOO_MANY_REQUESTS`.

---

### 2.5 `POST /api/v1/reports/allocation/export`
Exports the **Allocation & Disbursement Report** (`.xlsx`, password-protected, includes full Citizen ID for university disbursement).

- **Request Body DTO (`ExportReportDto`):** `{ roundId: number, password: string }`
- **Business Rules:**
  - Round and `AllocationSummary` must exist (`404 NOT_FOUND` otherwise).
  - `allocationSummary.status` MUST be `FINALIZED` (`409 INVALID_ALLOCATION_STATUS` / `MSG-27` otherwise) (`BR-EXP-02`).
  - Decrypts `ApplicantContact.citizenIdEncrypted` via `decryptCitizenId()` and includes full 13-digit Citizen ID (`BR-EXP-06`, `FR-EXP-04`) plus contact/disbursement fields.
  - Records `AuditLog` (`action: AuditAction.EXPORT_ALLOCATION_REPORT`, `actorId`, `roundId`, `entityType: 'AllocationSummary'`, `entityId: String(summary.id)`).
- **Success Response (`200 OK`):**
  - Binary `.xlsx` stream
  - `Content-Disposition: attachment; filename="sems_allocation_disbursement_round_{roundId}_{timestamp}.xlsx"`
- **Error Responses:** `400`, `401`, `403`, `404`, `409 INVALID_ALLOCATION_STATUS`, `429 TOO_MANY_REQUESTS`, `500` (if decryption fails — fail closed, no partial file).
