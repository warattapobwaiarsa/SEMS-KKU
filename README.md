# SEMS-KKU (Scholarship Evaluation Management System)

> **Web-based scholarship evaluation and allocation management system for Khon Kaen University.**  
> Developed under software engineering standards (ISO/IEC 29110, ISO/IEC 25010) and the Personal Data Protection Act (PDPA).

---

## 📌 Overview

**SEMS-KKU** streamlines the end-to-end scholarship assessment and fund allocation process for university administration. It replaces fragmented spreadsheet and paper-based procedures with a unified, role-based, and auditable web platform.

### Key Roles
* **Administrator (Admin):** Manages users and evaluator accounts, configures evaluation criteria sets (strict 100-point total), imports applicant data via Excel (.xlsx), manages round lifecycles (Draft → Open → Closed), reviews evaluator submissions, manages budget allocation, and exports password-protected reports.
* **Evaluator:** Reviews assigned applicant profiles and supporting materials, inputs rubric-based scores and comments with auto-save drafts, verifies evaluation summaries, and submits final assessments.
* **System Automation:** Enforces Single Sign-On (KKU SSO), single active session enforcement (60-minute idle timeout), automatic evaluator account deactivation upon expiration, tie-breaker ranking algorithms, and immutable 6-year PDPA audit logging.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | [Next.js](https://nextjs.org/) (App Router), TypeScript, Tailwind CSS, shadcn/ui | Responsive web interface (Desktop & Mobile) |
| **Backend** | [NestJS](https://nestjs.org/), TypeScript, REST API | Business logic, authentication, RBAC authorization, score calculation |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/), [Prisma ORM](https://www.prisma.io/) | Relational database storage, schema management, migrations |
| **Authentication** | KKU Single Sign-On (OAuth2/OIDC) | Institutional user authentication (`@kku.ac.th`, `@kkumail.com`) |
| **Data Processing** | ExcelJS / SheetJS | Batch Excel applicant import validation and export generation |
| **Security & Privacy** | AES-256-GCM, Masking, Audit Logging | PDPA compliance, sensitive citizen ID encryption |
| **DevOps & Containers**| Docker, Docker Compose, GitHub Actions | Standardized runtime environments and CI/CD automation |

---

## 📁 Repository Structure

The project follows a **Monorepo** structure designed for cross-team collaboration:

```text
SEMS-KKU/
├── apps/
│   ├── backend/             # NestJS REST API Server
│   │   ├── prisma/          # Prisma schema and database migrations
│   │   ├── src/             # Application modules, controllers, services, guards
│   │   ├── test/            # Jest unit and integration tests
│   │   └── package.json
│   │
│   └── frontend/            # Next.js Web Application
│       ├── src/
│       │   ├── app/         # Next.js App Router pages (admin, evaluator, auth)
│       │   ├── components/  # Reusable UI components & layouts
│       │   └── lib/         # API clients and utilities
│       └── package.json
│
├── docs/                    # Complete software engineering specifications
│   ├── 00-project/          # Project scope (Scope 1.3)
│   ├── 01-planning/         # ISO/IEC 29110 Traceability Matrix
│   ├── 02-requirements/     # Functional (127 FRS), Non-Functional (50 NFR), Business Rules (127 BR)
│   ├── 03-architecture/     # System architecture, ERD, Schema dictionary, Tech stack
│   └── 04-development/      # Prisma schema reference
│
├── .github/                 # GitHub CI/CD workflows and collaboration templates
├── docker-compose.yml       # Local development services (PostgreSQL)
├── .editorconfig            # Code styling rules across editors
└── .gitignore               # Ignored files, dependencies, and environment secrets
```

---

## 📚 Documentation Index

All official project specifications and architecture designs are preserved under [`docs/`](docs/README.md):

* **[Scope & Overview](docs/00-project/sems-scope.md):** System scope, user roles, and detailed features.
* **[Traceability Matrix](docs/01-planning/sems-traceability-matrix.md):** Cross-reference mapping between BR, FR, NFR, and UC.
* **[Business Rules](docs/02-requirements/sems-business-rules.md):** 127 business rules across 14 operational domains.
* **[Functional Requirements](docs/02-requirements/sems-functional-requirements.md):** FRS specification (ISO/IEC 29110).
* **[Non-Functional Requirements](docs/02-requirements/sems-non-functional-requirements.md):** Quality and security characteristics (ISO/IEC 25010).
* **[Database ERD & Schema](docs/03-architecture/sems-schema-description.md):** Data dictionary covering all 14 entities and relations.
* **[Prisma Schema](docs/04-development/sems-schema.prisma):** Production-ready Prisma database model.

---

## 🚀 Getting Started (Local Development)

### Prerequisites
* [Node.js](https://nodejs.org/) (v20 LTS or higher)
* [Docker Desktop](https://www.docker.com/) & Docker Compose
* [Git](https://git-scm.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/warattapobwaiarsa/SEMS-KKU.git
cd SEMS-KKU
```

### 2. Start PostgreSQL Database
```bash
docker compose up -d
```

### 3. Backend Setup
```bash
cd apps/backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run start:dev
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env
npm run dev
```

The frontend application will be running at `http://localhost:3000` and the backend API at `http://localhost:4000`.

---

## 🌿 Team Collaboration & Git Workflow

To maintain code stability and traceability across team members:

### Branching Strategy
* **`main`**: Production-ready branch. Direct push is prohibited.
* **`develop`**: Integration branch for team collaboration.
* **`feature/<FR-ID>-<feature-name>`**: Feature branches branched off `develop`.
  * Example: `feature/FR-RND-01-round-management`
  * Example: `feature/FR-EVL-04-evaluation-form`
* **`bugfix/<issue-id>-<fix-name>`**: Bug fixes branched off `develop`.

### Commit Message Conventions
Follow [Conventional Commits](https://www.conventionalcommits.org/) format referencing the Requirement ID:
* `feat(round): implement round status transition [FR-RND-04]`
* `fix(criteria): enforce 100-point total validation [BR-CRT-04]`
* `test(evaluation): add test for peer-blind score calculation [BR-SCR-01]`
* `docs(readme): update local setup instructions`

### Pull Request (PR) Policy
* All changes must go through a Pull Request targeting `develop`.
* Require at least **1 peer review approval** before merging.
* Automated CI checks (Lint, Typecheck, Unit Tests, Prisma Validate) must pass.

---

## 🔒 Security & PDPA Compliance

1. **No Sensitive Data in Git:** Never commit `.env` files, API keys, credentials, or actual student personal data.
2. **Citizen ID Protection:** Identification numbers must be encrypted using AES-256-GCM at rest and masked in UI displays (`1-2345-XXXXX-XX-3`). Full viewing is restricted and logged.
3. **Audit Trail:** All critical administrative actions, exports, and round transitions are logged to an append-only audit table retained for 6 years.
4. **Mock Test Data Only:** Use synthetic/mock data for Excel import testing.
