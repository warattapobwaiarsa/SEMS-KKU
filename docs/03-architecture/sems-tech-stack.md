# SEMS Tech Stack

> **Project:** Scholarship Evaluation Management System (SEMS)  
> **Purpose:** Technology reference for developers and AI assistants working on the SEMS project.

---

## 1. Tech Stack Overview

SEMS is designed as a **web application** with a separate Frontend and Backend architecture.

```text
User
 │
 ▼
Frontend
Next.js + TypeScript + Tailwind CSS
 │
 │ REST API
 ▼
Backend
NestJS + TypeScript
 │
 ├── Authentication / Authorization
 ├── RBAC
 ├── Business Logic
 ├── Data Validation
 └── Score Calculation
 │
 ▼
ORM
Prisma
 │
 ▼
Database
PostgreSQL
```

Document/file access is handled through the Backend and a file-storage layer.

---

## 2. Core Technology Stack

These technologies are the project's primary stack and should be treated as the default choices when implementing SEMS.

| Area | Technology | Role |
|---|---|---|
| Frontend Framework | **Next.js** | Develop the web application's frontend and routing |
| Programming Language | **TypeScript** | Used across Frontend and Backend |
| UI / Styling | **Tailwind CSS** | Build layouts and user interfaces |
| Backend Framework | **NestJS** | REST API, business logic, authorization, and system services |
| Database | **PostgreSQL** | Relational database |
| ORM | **Prisma** | Database access and ORM layer |
| Version Control | **Git** | Source-code version control |
| Repository | **GitHub** | Source-code and project collaboration |
| API Testing | **Postman** | Test and verify REST APIs |
| Containerization | **Docker** | Standardize development/runtime environments |
| File Storage | **File Storage** | Store applicant/supporting documents outside the relational database |

---

## 3. Frontend

### 3.1 Next.js

Next.js is the main frontend framework.

Use it for:

- Page and route development
- Application navigation
- Rendering UI
- Calling Backend REST APIs
- Implementing screens for ADMIN and EVALUATOR

Main SEMS UI areas include:

- Login / authentication flow
- Dashboard
- Scholarship round management
- Applicant list and applicant details
- Evaluation screens
- Evaluation results
- Reporting / export-related screens

### 3.2 TypeScript

TypeScript is used for the frontend and backend.

Use TypeScript consistently for:

- Types and interfaces
- API request/response types
- Form data
- Business-related data structures
- Database-related application logic

Prefer strict typing and avoid unnecessary `any`.

### 3.3 Tailwind CSS

Tailwind CSS is the primary styling solution.

Use it for:

- Layout
- Responsive design
- Forms
- Tables
- Buttons
- Dialogs
- Status indicators
- Dashboard UI

---

## 4. Backend

### 4.1 NestJS

NestJS is the main backend framework.

Responsibilities include:

- REST API
- Business Logic
- Authentication flow
- Authorization
- Role-Based Access Control (RBAC)
- Request validation
- Applicant/evaluation permissions
- Score calculation
- Scholarship-round rules
- Data import/export processing

Important principle:

> **Business rules must be enforced by the Backend, not only by the Frontend.**

The Frontend can provide validation and usability improvements, but the Backend is the authoritative layer for security and business rules.

### 4.2 REST API

Frontend and Backend communicate through REST APIs.

Typical flow:

```text
Next.js
   │
   │ HTTP Request
   ▼
NestJS Controller
   │
   ▼
Service / Business Logic
   │
   ▼
Prisma
   │
   ▼
PostgreSQL
```

---

## 5. Database

### 5.1 PostgreSQL

PostgreSQL is the primary relational database.

It stores data such as:

- Users
- Roles / permissions
- Scholarship rounds
- Scholarship types
- Applicants
- Supporting-document metadata
- Scholarship/application history
- Evaluation criteria
- Evaluators
- Evaluation assignments
- Evaluations
- Scores
- Remarks
- Summary/result data

The database should enforce important integrity constraints where appropriate.

### 5.2 Prisma

Prisma is the ORM used to communicate with PostgreSQL.

Use Prisma for:

- Schema definition
- Database queries
- Relations
- Transactions
- Migrations
- Type-safe database access

Important SEMS rule:

> Operations involving evaluation submission and score/result calculation should use appropriate database transactions so that related changes remain consistent.

---

## 6. Authentication and Authorization

### Authentication

The project documentation/report currently specifies an institutional authentication direction using **KKU SSO / KKU Account**.

Before implementation, the exact SSO integration method must be confirmed and kept consistent across:

- Project documentation
- Backend implementation
- Frontend implementation
- Deployment configuration

### Authorization

SEMS uses role-based access control.

Primary roles:

- `ADMIN`
- `EVALUATOR`

Authorization should be enforced in the Backend.

Examples:

- ADMIN can manage scholarship rounds, criteria, applicants, permissions, and reports.
- EVALUATOR can access applicants assigned/available to them according to system rules and submit evaluations.
- An evaluator must not be able to modify another evaluator's submitted evaluation.
- Peer-blind evaluation rules must be enforced by the Backend.

---

## 7. UI Libraries and Supporting Libraries

These libraries are recommended as supporting technologies. They are **not replacements for the core stack**.

### 7.1 shadcn/ui — Recommended

Use **shadcn/ui** for reusable UI components built on top of Tailwind CSS.

Useful for:

- Button
- Input
- Select
- Dialog
- Dropdown
- Tabs
- Table-related UI
- Form components
- Alert
- Badge
- Card

Recommended UI combination:

```text
Tailwind CSS
      +
shadcn/ui
      +
Lucide React
```

Avoid introducing multiple competing UI frameworks unless there is a specific requirement.

For example, do not use MUI + Ant Design + Chakra + shadcn/ui together without a clear reason.

### 7.2 Lucide React — Recommended

Use **Lucide React** for icons.

It provides consistent icons for:

- Navigation
- Actions
- Status
- Search
- Edit
- Delete
- Download
- Upload
- Evaluation-related actions

### 7.3 React Hook Form — Recommended

Use **React Hook Form** for complex forms.

Useful for:

- Applicant forms
- Scholarship-round forms
- Criteria forms
- Evaluation forms
- Admin configuration forms

### 7.4 Zod — Recommended

Use **Zod** for schema-based validation on the frontend when appropriate.

It can help validate:

- Form input
- API-related data
- Import preview data
- User-entered values

Backend validation remains authoritative.

### 7.5 TanStack Table — Recommended

Use **TanStack Table** if SEMS requires advanced data-table behavior.

Potential use cases:

- Applicant lists
- Evaluation lists
- User/evaluator management
- Scholarship-round management
- Result tables

Do not introduce it if a simple table is sufficient.

---

## 8. Excel Import / Export

Excel is an important part of SEMS because applicant data is imported from Excel and reports are exported as Excel.

Possible implementation libraries:

- **ExcelJS**
- **SheetJS (`xlsx`)**

Choose **one primary library** rather than adding both without a requirement.

Recommended import workflow:

```text
Excel File
   ↓
Parse
   ↓
Validate
   ↓
Preview
   ↓
Show Errors
   ↓
User Confirmation
   ↓
Import
   ↓
Database
```

Do not directly import an Excel file into the database without validation.

Important validation areas:

- Required fields
- Data types
- Duplicate records
- Invalid values
- Scholarship-round consistency
- Field mapping
- Referential constraints

---

## 9. File Storage

Applicant supporting documents should be handled through a file-storage layer.

Recommended architecture:

```text
PostgreSQL
 └── File metadata
      ├── filename
      ├── file type
      ├── file size
      ├── storage path / identifier
      └── related applicant

File Storage
 └── Actual document
```

The database should not be used as a general-purpose location for storing large document binaries unless there is a specific requirement.

Access to protected documents should go through the Backend so that authorization can be checked before returning a file.

---

## 10. Security / Backend Supporting Libraries

These are supporting recommendations rather than core project technologies.

### Recommended

- `class-validator`
- `class-transformer`
- Helmet
- `@nestjs/throttler`

Potential purposes:

| Library / Tool | Purpose |
|---|---|
| `class-validator` | Validate incoming DTO data |
| `class-transformer` | Transform/prepare request data |
| Helmet | Add common HTTP security headers |
| `@nestjs/throttler` | Rate limiting / request throttling |

Security controls should also include:

- HTTPS in deployed environments
- Secure cookie/session handling where applicable
- CORS configuration
- RBAC
- Server-side authorization checks
- Safe logging
- Protection against unauthorized document access
- Protection against duplicate/over-quota evaluations

---

## 11. Testing

### Unit / Backend Testing

**Jest** is recommended for backend/unit testing.

Test important business rules such as:

- Evaluation assignment
- Duplicate evaluator prevention
- Minimum/maximum evaluator limits
- Submitted evaluation rules
- Score calculation
- Round status transitions
- Authorization

### End-to-End Testing

**Playwright** is recommended for E2E testing.

Important scenarios:

1. Login
2. Role-based access
3. Applicant import
4. Applicant data viewing
5. Document access
6. Evaluation form
7. Save draft
8. Submit evaluation
9. Score calculation
10. Result/report generation

---

## 12. Code Quality

Recommended development tools:

- **ESLint**
- **Prettier**
- **Husky** — optional
- **lint-staged** — optional

Recommended workflow:

```text
Write Code
   ↓
TypeScript Check
   ↓
ESLint
   ↓
Format with Prettier
   ↓
Run Tests
   ↓
Commit
```

Do not add Git hooks unless the team agrees to use them consistently.

---

## 13. Optional Libraries

These should only be introduced when the system has a concrete need.

### Sonner

For toast/notification messages.

Examples:

- Save successful
- Import completed
- Validation error
- Evaluation submitted

### Recharts

For dashboard charts if visual statistics are required.

Possible charts:

- Applicants by scholarship round
- Evaluation completion status
- Number of applicants by evaluation progress

Do not add a chart library if the dashboard only requires counters/tables.

### Zustand

Use only if SEMS develops a real need for client-side global state.

Do not add Zustand by default. Prefer local/component state and server/API data where sufficient.

---

## 14. Recommended Final Stack

### Core

```text
Frontend
- Next.js
- TypeScript
- Tailwind CSS

UI
- shadcn/ui
- Lucide React

Forms / Validation
- React Hook Form
- Zod

Tables
- TanStack Table (when needed)

Backend
- NestJS
- TypeScript
- REST API
- class-validator
- class-transformer

Database
- PostgreSQL
- Prisma

Authentication
- KKU SSO / KKU Account
- Backend-enforced Authorization / RBAC

Excel
- ExcelJS OR SheetJS

File Storage
- File Storage + PostgreSQL metadata

Testing
- Jest
- Playwright
- Postman

Development / Operations
- Docker
- Git
- GitHub
- ESLint
- Prettier
```

### Optional

```text
- Sonner
- Recharts
- Zustand
- Helmet
- @nestjs/throttler
- Husky
- lint-staged
```

---

## 15. Architecture Principles

When adding new libraries or technologies, follow these principles:

### 15.1 Prefer the existing stack

Do not introduce a new framework when the existing stack already solves the problem.

### 15.2 One solution per problem

Avoid unnecessary duplication.

Examples:

- One primary UI component approach
- One primary form library
- One primary Excel library
- One primary ORM
- One primary styling system

### 15.3 Backend is authoritative

Security and business rules must not depend only on frontend validation.

### 15.4 Keep dependencies justified

Before adding a library, ask:

1. What problem does it solve?
2. Can the existing stack solve the problem?
3. Does it add unnecessary complexity?
4. Does it affect the architecture?
5. Does the team actually need it?

### 15.5 Keep documentation and implementation consistent

If the implementation changes, update the relevant project documentation.

---

## 16. Important Note for AI Assistants

When working on SEMS, AI assistants should use this file as the project's **technology baseline**.

Unless explicitly requested otherwise:

- Use the technologies listed under **Core Technology Stack**.
- Prefer the recommended supporting libraries when they fit the task.
- Do not introduce a new framework/library unnecessarily.
- Do not replace Next.js, NestJS, PostgreSQL, or Prisma with alternative technologies.
- Keep Frontend and Backend separated according to the documented architecture.
- Keep business rules in the Backend.
- Follow the existing RBAC and scholarship-evaluation rules.
- Ask for clarification when a requested change would conflict with the established architecture.
- If suggesting a new dependency, explain why it is needed before treating it as part of the official stack.

---

## 17. Stack Status

| Technology | Status |
|---|---|
| Next.js | **Core / Confirmed** |
| TypeScript | **Core / Confirmed** |
| Tailwind CSS | **Core / Confirmed** |
| NestJS | **Core / Confirmed** |
| PostgreSQL | **Core / Confirmed** |
| Prisma | **Core / Confirmed** |
| Git | **Core / Confirmed** |
| GitHub | **Core / Confirmed** |
| Postman | **Core / Confirmed** |
| Docker | **Core / Confirmed** |
| File Storage | **Core / Planned** |
| KKU SSO | **Authentication Direction / Must Confirm Integration Details** |
| shadcn/ui | **Recommended** |
| Lucide React | **Recommended** |
| React Hook Form | **Recommended** |
| Zod | **Recommended** |
| TanStack Table | **Recommended when needed** |
| ExcelJS / SheetJS | **Choose one when implementing Excel features** |
| Jest | **Recommended** |
| Playwright | **Recommended** |
| ESLint | **Recommended** |
| Prettier | **Recommended** |
| Sonner | **Optional** |
| Recharts | **Optional** |
| Zustand | **Optional** |
| Helmet | **Security Recommendation** |
| `@nestjs/throttler` | **Security Recommendation** |
| Husky | **Optional** |
| lint-staged | **Optional** |

---

## 18. Known Documentation Point to Resolve

There is an authentication detail that must remain consistent before implementation.

The current project direction/report uses **KKU SSO / KKU Account**, while an earlier system-requirements document may describe Google OAuth / Google Workspace / KKU Mail.

These should **not be treated as two simultaneous authentication implementations**.

The team should decide and document the actual authentication mechanism, then update all related documentation and implementation plans accordingly.

Until that is resolved, AI assistants should not assume a specific OAuth provider implementation beyond the project's stated KKU SSO direction.
