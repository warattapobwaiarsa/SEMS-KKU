# SEMS-KKU — Security Review Report

> **Classification:** Internal / Confidential — do not publish before remediation.
> **Report date:** 2026-11-23
> **Scope:** Backend (NestJS 11), Prisma 6 schema, Frontend (Next.js 16), Docker and CI configuration.
> **Method:** Manual source-code review. No runtime exploitation was performed against a live environment.
> **Status:** Findings recorded only. No application code was modified as part of this review.

---

## 1. Executive summary

The application is **not safe to expose outside a trusted local/development environment**.

The core problem is that authentication is implemented as a client-controlled HTTP header (`X-User-Id`), and the shared-route guard intentionally treats requests with no identity headers as **ADMIN**. Several administrative controllers have no guard at all. As a result, an unauthenticated caller can read applicant PII, decrypt citizen IDs, read evaluator scores and comments, import/delete applicant data, change budgets, allocate scholarship money, finalize results, and delete rounds.

| ID | Severity | Finding |
| --- | --- | --- |
| C1 | Critical | `X-User-Id` header is trusted as identity — full account impersonation |
| C2 | Critical | Missing identity headers are treated as ADMIN — anonymous admin access |
| C3 | Critical | Multiple admin controllers/endpoints have no authentication guard |
| C4 | Critical | Full citizen ID can be decrypted and returned to an unauthenticated caller |
| C5 | Critical | Evaluator can set budgets, allocate money, finalize results, and delete rounds |
| C6 | Critical | Production configuration has no real auth, no encryption key, and default DB credentials |
| H1 | High | SSRF through applicant-controlled map URL in travel-distance calculation |
| H2 | High | PII and evaluation results exposed through anonymous shared routes |
| H3 | High | Unauthenticated Excel upload enables memory/CPU exhaustion and zip-bomb DoS |
| H4 | High | CORS allows any `*.vercel.app` origin with credentials |
| H5 | High | Allocation API accepts cross-round applicants and can bypass budget limits |
| M1–M10 | Medium | Unbounded pagination, no rate limiting, weak key management, audit spoofing, weak frontend authorization, password in URL, missing security headers, container defaults, missing input caps, PII in error details |
| L1–L6 | Low | Preview-token cancellation, import-history PII, unvalidated toggle body, public Maps key, unused session model, CI/SCA gaps |

**Overall risk:** Critical. Remediation of C1–C5 is required before any network-accessible deployment.

---

## 2. Scope and methodology

Reviewed areas:

- `backend/src/**` — modules, controllers, services, guards, DTOs, filters, interceptors.
- `backend/prisma/schema.prisma` and `backend/prisma/seed.ts`.
- `backend/test/**` — security-relevant e2e expectations.
- `frontend/src/**` — API client, identity helpers, services, layouts.
- `.github/workflows/ci.yml`, `docker-compose.yml`, `docker-compose.prod.yml`, Dockerfiles.
- Environment templates and git tracking of secret files.

Not covered:

- Dependency CVE scanning (`npm audit` could not run because `node` was unavailable in the review shell).
- Actual SSO/OIDC integration (not yet implemented).
- Infrastructure-level controls, TLS termination, WAF, and secret-manager configuration.
- Runtime penetration testing.

---

## 3. Critical findings

### C1. Authentication is spoofable via `X-User-Id`

**Severity:** Critical

**Evidence**

- `backend/src/common/guards/mock-auth.guard.ts:45-71` — identity is read from the `x-user-id` header, loaded from the database, and attached to `request.user`.
- `backend/src/common/guards/roles.guard.ts:27-53` — authorization trusts that attached user object.
- `backend/src/main.ts:47-49` — CORS explicitly allows `x-user-id` and `x-user-role`.
- `frontend/src/lib/mock-evaluator.ts:39-51,70-82` — evaluator ID defaults to `2`; admin ID defaults to `1`.
- `frontend/src/components/evaluator/evaluator-switcher.tsx` — the UI provides an evaluator switcher backed by localStorage.

**Impact**

Any caller can impersonate any evaluator or admin by setting a header. This enables:

- Reading another evaluator's drafts.
- Saving or submitting scores as another evaluator.
- Accessing admin-only data by using admin user ID `1`.
- Spoofing audit-log actors.

The guard blocks mock auth only when `NODE_ENV === 'production'` **and** `ALLOW_MOCK_AUTH !== 'true'`; enabling `ALLOW_MOCK_AUTH=true` re-enables impersonation in production.

**Remediation**

Remove mock authentication. Implement KKU SSO/OIDC with a server-validated session (HttpOnly, Secure, SameSite cookie). Derive identity exclusively from the session; never accept user ID or role from request headers.

---

### C2. Missing headers are interpreted as ADMIN

**Severity:** Critical

**Evidence**

- `backend/src/common/guards/role-dispatch.guard.ts:92-102` — when there is no `X-User-Id` and no role header, the guard sets `resolvedRole = 'ADMIN'` and returns `true`.
- `backend/test/evaluation-privacy.e2e-spec.ts:402-423,631-650` — tests assert this anonymous-admin behavior as expected.
- Unlike `MockAuthGuard`, `RoleDispatchGuard` has no `NODE_ENV` / `ALLOW_MOCK_AUTH` production check.

**Impact**

Every route protected only by `RoleDispatchGuard` is anonymously accessible with ADMIN privileges. This is the primary enabler for most other findings.

**Remediation**

Delete the legacy admin path. Fail closed with `401 UNAUTHORIZED` unless a valid session exists. Add tests asserting anonymous requests receive `401` on every protected route.

---

### C3. Admin controllers and endpoints with no guard

**Severity:** Critical

**Evidence**

- `backend/src/criteria/criteria.controller.ts:19-61` — create, update, and delete criteria have no guards.
- `backend/src/applicants/applicants.controller.ts:45-95,130-133` — Excel preview, import confirmation, preview cancellation, and import history are unguarded.
- `backend/src/rounds/rounds.controller.ts:66-70,90-106,113-130` — create round, update round, link criteria, open round, and close round are unguarded.
- `backend/src/scholarship-types/scholarship-types.controller.ts:54-61,76-83,97-104,117-124` — role checks are bypassed by omitting headers because the guard resolves the request to ADMIN.

**Impact**

- Anyone can create, modify, or delete evaluation criteria.
- Anyone can import applicants with `OVERWRITE`; this deletes existing applicants in the round (`backend/src/applicants/applicants.service.ts:247-253`).
- Anyone can open or close scholarship rounds and change round configuration.
- Anyone can create or delete scholarship types.

**Remediation**

Apply authentication and `@Roles(ADMIN)` authorization to every administrative route. Prefer a global deny-by-default guard with an explicit `@Public()` decorator.

---

### C4. Full citizen ID disclosure without authentication

**Severity:** Critical

**Evidence**

- `backend/src/applicants/applicants.controller.ts:192-213` — `POST /applicants/:id/reveal-citizen-id`.
- `backend/src/applicants/applicants.service.ts:690-725` — decrypts and returns the full citizen ID.
- The route uses only `RoleDispatchGuard`; with no headers, `resolvedRole` becomes ADMIN, so the role check passes.

**Impact**

A direct PDPA breach. Full Thai citizen IDs can be enumerated and retrieved. Audit entries can be attributed to a spoofed `x-user-id` or recorded with a `null` actor.

**Remediation**

Require a real admin session. Apply re-authentication/MFA before reveal, strict rate limiting, and a recorded justification. Consider returning a one-time token rather than the raw value. Audit every reveal with a non-null, session-derived actor.

---

### C5. Evaluator → ADMIN privilege escalation on allocation and money routes

**Severity:** Critical

**Evidence**

- `backend/src/rounds/rounds.controller.ts:132-193` — `GET allocation`, `POST budget`, `PUT items`, `POST finalize`, `POST reopen`, and `DELETE round` use only `RoleDispatchGuard`.
- None of these handlers checks `request.resolvedRole === 'ADMIN'`.
- A genuine evaluator (`X-User-Id: 2`) resolves to `EVALUATOR` but still passes the guard and executes `backend/src/rounds/rounds.service.ts:879-1228`.

**Impact**

Any evaluator — and, because of C2, any anonymous caller — can:

- Read every applicant's phone number, email, and masked citizen ID via the allocation summary (`backend/src/rounds/rounds.service.ts:738-877`).
- Set or replace the round budget.
- Award, deny, or change amounts.
- Finalize or reopen allocation results.
- Delete DRAFT rounds and all related data.

**Remediation**

Add explicit `@Roles(ADMIN)` and server-side role checks to every allocation, budget, finalize/reopen, and delete route. Do not rely on a "resolved role" that may be anonymous.

---

### C6. Production configuration is not secure by default

**Severity:** Critical

**Evidence**

- `docker-compose.prod.yml:29-32` does not inject `AES_CITIZEN_ID_KEY`, `JWT_SECRET`, `ALLOW_MOCK_AUTH`, or `CORS_ORIGIN`.
- `backend/src/common/crypto.util.ts:6-11` falls back to a hardcoded public AES key if `AES_CITIZEN_ID_KEY` is missing.
- `docker-compose.prod.yml:6-9,32` defaults the database to `postgres/postgres`.
- `JWT_SECRET` in `.env.example:21` is not used anywhere in the code.
- In production, `MockAuthGuard` blocks evaluator calls with `403`, while `RoleDispatchGuard` still allows anonymous admin access. The resulting production auth model is both broken and insecure.

**Impact**

- Citizen-ID encryption uses a known key if the environment variable is omitted, so any DB leak becomes decryptable.
- The database can start with default credentials.
- Evaluator functionality is unusable in production while the admin API remains open.

**Remediation**

Fail application startup if `AES_CITIZEN_ID_KEY` is missing or equals a development value. Use a secret manager or KMS. Require a strong `POSTGRES_PASSWORD` with no fallback. Inject all secrets explicitly. Complete SSO before any production deployment.

---

## 4. High findings

### H1. SSRF through applicant-controlled map URL

**Severity:** High

**Evidence**

- `backend/src/applicants/location-routing.service.ts:168-184` — if the stored `accommodationMapUrl` contains `goo.gl` or `maps.app` anywhere in the string, the server calls `fetch(mapUrl, { method: 'HEAD', redirect: 'follow' })`.
- There is no scheme, host, or IP allowlist, and redirects are followed.
- The URL originates from imported Excel data (`backend/src/applicants/excel-parser.service.ts:486-496,320-321`); validation only checks the `http://` or `https://` prefix.
- Import is unauthenticated (C3), so an attacker can chain: create DRAFT round → upload malicious `.xlsx` → import → call `/applicants/:id/travel-distance`.

**Impact**

Server-side requests to internal services, cloud metadata endpoints, and internal DNS/ports. Only `HEAD` is used, but that is sufficient for network mapping and some state changes. Separately, applicant addresses are sent to third-party Nominatim/OSRM services (`backend/src/applicants/location-routing.service.ts:192-227,291-306`), which is a PDPA privacy concern.

**Remediation**

Do not fetch arbitrary user-supplied URLs. If external lookup is required:

- Parse with `new URL` and allow only known Google Maps hosts over HTTPS.
- Resolve DNS and block loopback, private, link-local, and metadata ranges.
- Disallow cross-host redirects.
- Enforce a short timeout.

Prefer extracting validated coordinates client-side or storing validated coordinates at import time.

---

### H2. PII and evaluation confidentiality exposure

**Severity:** High

**Evidence**

- `GET /scholarship-rounds/:id/allocation` — `backend/src/rounds/rounds.service.ts:738-877` returns `phone`, `email`, and `maskedCitizenId` for every applicant. Protected only by `RoleDispatchGuard`.
- `GET /applicants/history/:studentCode` — `backend/src/applicants/applicants.service.ts:528-688` returns full cross-round history, submitted evaluation scores, comments, text values, evaluator names, and award amounts. The role check at `backend/src/applicants/applicants.controller.ts:176-184` passes when no headers are sent.
- `GET /applicants/:id/evaluation-results` and `GET /scholarship-rounds/:id/evaluation-results` — `backend/src/evaluation/evaluation-results.service.ts:265-383` returns evaluator names and emails, per-criterion scores, comments, and text values. The `resolvedRole !== 'ADMIN'` check in `backend/src/evaluation/evaluation-results.controller.ts:43-45,63-65` is satisfied by the anonymous admin fallback.
- `GET /scholarship-rounds/:id/close-check` (`backend/src/rounds/rounds.service.ts:595-637`) and `GET /scholarship-rounds/:id/applicants/imports` (`backend/src/applicants/applicants.service.ts:510-526`) expose applicant names and importer emails without guards.

**Impact**

Applicant PII, evaluator identities, peer scores, comments, and award decisions can be read anonymously. Student codes are enumerable, so history disclosure can be automated.

**Remediation**

Apply ADMIN authorization to all listed routes, remove the anonymous fallback, add object-level checks, and audit access. Consider redacting phone and email from allocation views unless explicitly required.

---

### H3. Unauthenticated upload enables DoS and zip bombs

**Severity:** High

**Evidence**

- `backend/src/applicants/applicants.controller.ts:45-74` — 50 MB limit, extension-only validation, and no authentication.
- `backend/src/applicants/excel-parser.service.ts:109-233` — loads the entire workbook into memory with no limits on uncompressed size, sheet count, row count, or cell count.
- `backend/src/applicants/applicants.service.ts:36,56-63,105-113` — an unbounded in-memory `Map` stores every parsed applicant, including raw citizen IDs and all valid rows, for up to 30 minutes. Cleanup runs every 5 minutes.
- `cancelPreview` accepts the token in the URL path (`backend/src/applicants/applicants.controller.ts:87-95`), so tokens may appear in access logs.

**Impact**

An unauthenticated attacker can exhaust memory/CPU with large or highly compressed `.xlsx` files and by opening many preview sessions. This is a straightforward denial of service.

**Remediation**

- Authenticate and authorize uploads.
- Validate MIME type and file signature (magic bytes), not only the extension.
- Parse in a worker or streaming mode.
- Enforce uncompressed-size, sheet, row, and cell limits.
- Store previews in a bounded cache or temp store with quotas, and purge immediately on cancel/confirm.

---

### H4. Over-permissive CORS

**Severity:** High

**Evidence**

- `backend/src/main.ts:15-51` — `credentials: true`, any `https://*.vercel.app` origin is allowed, optional `*` in `CORS_ORIGIN`, and requests without an Origin header are always allowed.
- `x-user-id` and `x-user-role` are explicitly listed in `allowedHeaders`.

**Impact**

Any attacker-controlled Vercel deployment can make credentialed cross-origin requests and read responses. Today this compounds C1/C2; if cookie-based SSO is added later, it becomes a serious cross-site data-theft vector.

**Remediation**

Use an exact origin allowlist from `CORS_ORIGIN` only. Never allow `*` or wildcard Vercel domains in production. Avoid `credentials: true` unless cookie auth is actually used, and remove identity headers from CORS once they are no longer part of the auth design.

---

### H5. Allocation integrity and budget bypass

**Severity:** High

**Evidence**

- `backend/src/rounds/rounds.service.ts:942-1036` — `saveAllocations` upserts by `applicantId` without verifying that the applicant belongs to `roundId`.
- The budget check at `backend/src/rounds/rounds.service.ts:989-1000` sums only the items in the current request. Awards already stored but omitted from the payload are ignored.
- `finalizeAllocation` (`backend/src/rounds/rounds.service.ts:1038-1073`) does not verify the round is CLOSED, that evaluations are complete, or that the allocation is internally consistent.
- `getAllocationSummary` creates an allocation summary on a **GET** request (`backend/src/rounds/rounds.service.ts:767-780`).

**Impact**

An authorized caller — or an anonymous caller via C2 — can assign an applicant from a different round, bypass the remaining-budget check, and finalize an inconsistent or over-budget allocation. A GET request mutates state.

**Remediation**

- Validate every `applicantId` against `roundId` inside the transaction.
- Recompute `allocatedAmount` from all persisted allocations.
- Enforce the budget with a database lock.
- Require ADMIN and a CLOSED round for finalization.
- Make GET operations side-effect-free.

---

## 5. Medium findings

### M1. Unbounded pagination / query DoS

`backend/src/rounds/rounds.service.ts:33-35`, `backend/src/criteria/criteria.service.ts:78-80`, and `backend/src/scholarship-types/scholarship-types.service.ts:19-21` accept arbitrary `limit` and `page` values with no maximum. `limit=1000000` can trigger heavy queries and negative values can cause `500` responses. Add validated DTOs with `@Max(100)` and parse query parameters at the controller boundary.

### M2. No rate limiting or account lockout

No throttler, rate limiter, or lockout exists in `backend/src`. Citizen-ID reveal and history endpoints are especially sensitive to enumeration and brute force. Add per-IP and per-session throttling and audit failed attempts.

### M3. Audit-trail integrity is weak

- Actors are taken from spoofable `x-user-id` headers (`backend/src/applicants/applicants.controller.ts:81-84,209-211`, `backend/src/rounds/rounds.controller.ts:144-191`).
- If import has no actor, the service silently attributes the action to the first active admin (`backend/src/applicants/applicants.service.ts:200-218`).
- Criteria create/update write `actorId: null` (`backend/src/criteria/criteria.service.ts:291-302,428-440`).
- Criteria delete and scholarship-type delete write no audit log.
- Draft-round deletion is logged as `ROUND_STATUS_CHANGE` (`backend/src/rounds/rounds.service.ts:1203-1206`).

This breaks non-repudiation and can frame an innocent admin or evaluator.

### M4. Weak encryption key management

`backend/src/common/crypto.util.ts:3-11` has a hardcoded fallback key, derives the key via SHA-256 of a passphrase, has no key versioning or rotation, and does not fail startup when misconfigured. `validateThaiCitizenId` accepts mock IDs in production when `ALLOW_MOCK_AUTH=true` (`backend/src/common/crypto.util.ts:75-90`). Require a 32-byte key from a secret manager, use an appropriate KDF, version the ciphertext, and fail closed.

### M5. Missing security headers

No `helmet` or equivalent is configured in `backend/src/main.ts`. `frontend/next.config.ts` defines no CSP, frame-ancestors, HSTS, or `X-Content-Type-Options` policy. This enables clickjacking of admin/evaluator screens and MIME sniffing. Add security headers at both layers.

### M6. Frontend authorization is cosmetic

`frontend/src/app/(admin)/admin/layout.tsx` and `frontend/src/app/(evaluator)/evaluator/layout.tsx` render role shells without authentication or redirects. Identity is localStorage-driven (`frontend/src/lib/mock-evaluator.ts:36-62`), and client services send `x-user-role: ADMIN` from the browser (`frontend/src/services/applicants.service.ts:81,94,110`, `frontend/src/services/allocation.service.ts:19-102`, `frontend/src/services/evaluation-results.service.ts:29,47`). Add server-side route protection and never trust client-provided roles.

### M7. Report password leaked in URL and fake "encrypted" fallback

`frontend/src/services/reports.service.ts:12-15,45-48` places the export password in the query string, exposing it to server logs, proxies, browser history, and referrers. The same file silently generates a plaintext mock `.xlsx` file if the endpoint fails (`frontend/src/services/reports.service.ts:32-37,65-70`), which can mislead users into believing the file is encrypted. Use `POST` with a body and real server-side encryption, and remove the misleading fallback.

### M8. Container and database hardening

`docker-compose.prod.yml:6-9,32` defaults to `postgres/postgres` and does not inject secrets. The development compose exposes Adminer on `8080` and Postgres on `5432` (`docker-compose.yml:11-12,25-26`) and uses mutable `adminer:latest`. Pin image digests, remove Adminer from shared environments, require secrets, and terminate TLS properly.

### M9. Missing input and resource caps

`backend/src/rounds/dto/allocation.dto.ts:30-35` (`SaveAllocationsDto`) has no `ArrayMaxSize`; `backend/src/evaluation/dto/save-my-evaluation.dto.ts:51-57` has the same gap. Many string fields (criteria names/titles, round names, comments, `textValue`) have no `MaxLength`. Add caps to prevent oversized payloads and storage abuse.

### M10. PII in Excel validation errors

`backend/src/applicants/excel-parser.service.ts:441-458` includes the raw invalid phone number in the error message. These errors are returned in previews and stored in `ImportBatch.errorDetails` (`backend/src/applicants/applicants.service.ts:263-266`). Mask or redact sensitive invalid values before returning or storing them.

---

## 6. Low findings

- **L1.** `cancelPreview` requires no authentication and uses a token in the URL (`backend/src/applicants/applicants.controller.ts:87-95`). UUIDs make guessing impractical, but tokens can leak through logs.
- **L2.** `GET /scholarship-rounds/:id` returns the latest import batch, including `errorDetails`, to the anonymous legacy-admin path (`backend/src/rounds/rounds.service.ts:135-138,156-175`).
- **L3.** `PATCH /scholarship-types/:id/toggle-active` reads `@Body('isActive')` without validation (`backend/src/scholarship-types/scholarship-types.controller.ts:88-96`); the string `"false"` is truthy and would activate the type.
- **L4.** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is shipped to the browser (`frontend/src/lib/google-maps.ts:53`). This is expected for browser keys, but the key must be restricted by HTTP referrer and API scope to prevent quota abuse.
- **L5.** The `UserSession` model (`backend/prisma/schema.prisma:81-89`) and `JWT_SECRET` (`.env.example:21`) are unused. The README's claims of KKU SSO and 60-minute single-active-session enforcement are not implemented.
- **L6.** CI performs only a secret-file scan (`.github/workflows/ci.yml:18-40`); there is no dependency/SCA audit. GitHub Actions are pinned by tag (`@v4`) rather than commit SHA.

---

## 7. Positive controls observed

- Prisma is used consistently; the only raw query is a parameterized tagged template in `backend/src/evaluation/evaluation-write.service.ts:299`.
- No `dangerouslySetInnerHTML`, `eval`, `new Function`, or `child_process` usage was found in the frontend.
- Evaluator-facing reads use explicit `select` lists and do not load contact data (`backend/src/evaluation/evaluation-read.service.ts:140-282`, `backend/src/evaluation/evaluation.service.ts:80-114`).
- Citizen IDs are encrypted with AES-256-GCM using a random 96-bit IV and an authentication tag (`backend/src/common/crypto.util.ts`).
- The global `ValidationPipe` uses `whitelist` and `forbidNonWhitelisted`, and most DTOs validate their inputs.
- Citizen-ID masking and Mod-11 checksum validation exist.
- `.env` is gitignored and no real secret file is tracked.
- The production backend container runs as a non-root user.

---

## 8. Verification checklist

Use only local test data. These requests demonstrate the authorization problems without performing destructive writes:

```bash
# Anonymous access to allocation PII
curl -s http://localhost:4000/api/v1/scholarship-rounds/1/allocation

# Anonymous access to evaluation results
curl -s http://localhost:4000/api/v1/scholarship-rounds/1/evaluation-results

# Anonymous access to cross-round applicant history
curl -s http://localhost:4000/api/v1/applicants/history/6600000000

# Impersonation of admin user 1
curl -s -H 'X-User-Id: 1' http://localhost:4000/api/v1/scholarship-rounds

# Impersonation of evaluator user 2
curl -s -H 'X-User-Id: 2' http://localhost:4000/api/v1/applicants/1/my-evaluation
```

Expected after remediation: all of the above return `401 UNAUTHORIZED` without a valid session, except endpoints explicitly marked public.

---

## 9. Remediation roadmap

### P0 — before any shared or production deployment

1. Remove `MockAuthGuard` / `RoleDispatchGuard` header trust and the anonymous ADMIN fallback.
2. Implement real SSO/session authentication and a global deny-by-default guard with explicit `@Public()` exceptions.
3. Add per-route `@Roles(ADMIN)` / `@Roles(EVALUATOR)` authorization, including allocation, budget, finalize/reopen, delete, history, results, and reveal.
4. Protect citizen-ID reveal with admin authorization, re-authentication, rate limiting, and session-derived audit actors.
5. Fix the SSRF path in the travel-distance feature.
6. Require the AES key and DB password at startup; remove hardcoded/default secrets from production compose.
7. Restrict CORS to exact production origins.

### P1 — before pilot use

1. Harden uploads: authentication, MIME/signature checks, streaming, decompression limits, bounded preview storage.
2. Enforce allocation invariants and recompute budgets inside transactions.
3. Add rate limiting and security headers.
4. Harden the audit trail: non-null session actors, complete coverage, append-only DB permissions.
5. Add server-side route protection to the frontend and remove password-in-URL export behavior.
6. Add input caps (`ArrayMaxSize`, `MaxLength`) and query pagination limits.

### P2 — ongoing

1. Add dependency/SCA scanning to CI and pin GitHub Actions by commit SHA.
2. Pin container image digests, remove Adminer from shared environments, and require TLS.
3. Add periodic security regression tests, including anonymous-access tests for every route.
4. Plan key rotation and ciphertext versioning for citizen-ID encryption.
5. Conduct an external penetration test after P0/P1 fixes.

---

## 10. Limitations

- This was a manual code review; no live exploitation or authenticated session testing was performed.
- Dependency vulnerabilities were not assessed because `npm audit` could not run in the review environment.
- The future KKU SSO/OIDC integration was not reviewed because it is not implemented.
- Findings are based on the repository state at the time of review and should be re-validated after remediation.

---

## Appendix A — Key files reviewed

- `backend/src/common/guards/mock-auth.guard.ts`
- `backend/src/common/guards/role-dispatch.guard.ts`
- `backend/src/common/guards/roles.guard.ts`
- `backend/src/common/crypto.util.ts`
- `backend/src/common/http-exception.filter.ts`
- `backend/src/main.ts`
- `backend/src/applicants/**`
- `backend/src/criteria/**`
- `backend/src/rounds/**`
- `backend/src/evaluation/**`
- `backend/src/scholarship-types/**`
- `backend/prisma/schema.prisma`
- `backend/test/evaluation-privacy.e2e-spec.ts`
- `frontend/src/lib/mock-evaluator.ts`
- `frontend/src/lib/api-client.ts`
- `frontend/src/services/**`
- `frontend/src/app/(admin)/**`
- `frontend/src/app/(evaluator)/**`
- `docker-compose.yml`, `docker-compose.prod.yml`, `backend/Dockerfile`, `frontend/Dockerfile`
- `.github/workflows/ci.yml`
