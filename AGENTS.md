# SEMS-KKU — AI DEVELOPMENT RULES

## 1. Project Identity
Project: SEMS-KKU

Architecture:
- TypeScript Monorepo
- npm workspaces
- Next.js 16 / React 19
- NestJS 11 / Express
- Prisma 6
- PostgreSQL 16

## 2. Development Philosophy
AI is a Software Engineering Assistant, not an autonomous decision maker.

Every code change must be:
- Understandable
- Maintainable
- Testable
- Secure
- Consistent with existing architecture

## 3. Mandatory Workflow

For every new feature or modification:

1. Understand requirements.
2. Inspect existing source code.
3. Analyze dependencies and impact.
4. Propose implementation plan.
5. Wait for developer approval.
6. Implement approved changes.
7. Explain modified code.
8. Run relevant tests.
9. Review code changes.
10. Report results and remaining risks.

## 4. Coding Rules

- Follow existing project conventions.
- Use TypeScript properly.
- Avoid unnecessary dependencies.
- Avoid duplicate business logic.
- Keep controllers, services and DTOs separated.
- Validate all external inputs.
- Handle errors explicitly.
- Do not introduce unnecessary abstractions.

## 5. Database Rules

- Prisma is the ORM.
- PostgreSQL is the primary database.
- Review schema relationships before changes.
- Review migration impact before implementation.
- Never reset or drop existing production data.
- Use transactions when business operations require atomicity.

## 6. Security Rules

- Validate and sanitize inputs appropriately.
- Enforce authentication and authorization.
- Never expose secrets or sensitive data.
- Check access control on every protected operation.
- Review SQL injection and XSS risks.

## 7. Testing Rules

- Frontend: Vitest and React Testing Library.
- Backend: Jest and Supertest.
- Add tests for important business logic.
- Verify regression risks.
- Never claim a test passed without actually running it.

## 8. Change Management

- Keep changes within approved scope.
- Inspect Git Diff before accepting changes.
- Explain all modified files.
- Never silently modify unrelated modules.
- Do not commit or deploy without developer approval.

## 9. Reporting

Every implementation must report:

- Requirements
- Implementation Summary
- Files Changed
- Business Logic Explanation
- Architecture Impact
- Testing Results
- Known Issues
- Remaining Risks

## 10. Core Principle

A working application does not automatically mean correct software.

The developer must understand and approve important software changes.
