-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EVALUATOR');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "SubCriteriaType" AS ENUM ('SCORED', 'TEXT');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('EDITING', 'FINALIZED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('VIEW_CITIZEN_ID', 'EXPORT_EVALUATION_REPORT', 'EXPORT_ALLOCATION_REPORT', 'IMPORT_APPLICANTS', 'ROUND_STATUS_CHANGE', 'ALLOCATION_STATUS_CHANGE', 'USER_CREATE', 'USER_UPDATE', 'USER_ACTIVATE', 'USER_DEACTIVATE', 'USER_AUTO_DEACTIVATE', 'USER_EXTEND_EXPIRY', 'CRITERIA_CREATE', 'CRITERIA_UPDATE', 'EVALUATION_SUBMIT', 'BUDGET_SET', 'BUDGET_UPDATE', 'ALLOCATION_UPDATE');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "criteria" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_criteria" (
    "id" SERIAL NOT NULL,
    "criteriaId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" "SubCriteriaType" NOT NULL,
    "maxScore" INTEGER,
    "allowComment" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "sub_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarship_rounds" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "academicYear" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "criteriaId" INTEGER,
    "status" "RoundStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scholarship_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" SERIAL NOT NULL,
    "roundId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "validRows" INTEGER NOT NULL,
    "invalidRows" INTEGER NOT NULL,
    "errorDetails" JSONB,
    "importedById" INTEGER NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicants" (
    "id" SERIAL NOT NULL,
    "roundId" INTEGER NOT NULL,
    "importBatchId" INTEGER NOT NULL,
    "legacySeq" INTEGER,
    "studentCode" TEXT NOT NULL,
    "titlePrefix" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "faculty" TEXT NOT NULL,
    "major" TEXT NOT NULL,
    "studyYear" INTEGER NOT NULL,
    "gpa" DECIMAL(3,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anonymizedAt" TIMESTAMP(3),

    CONSTRAINT "applicants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicant_contacts" (
    "applicantId" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "citizenIdEncrypted" TEXT NOT NULL,
    "citizenIdMasked" TEXT NOT NULL,

    CONSTRAINT "applicant_contacts_pkey" PRIMARY KEY ("applicantId")
);

-- CreateTable
CREATE TABLE "applicant_supporting_info" (
    "applicantId" INTEGER NOT NULL,
    "applicationDate" TEXT,
    "accommodation" TEXT,
    "rent" TEXT,
    "personalExpense" TEXT,
    "studyEquipmentCost" TEXT,
    "electronicDevices" TEXT,
    "sideIncome" TEXT,
    "fatherAge" TEXT,
    "fatherOccupation" TEXT,
    "fatherIncome" TEXT,
    "fatherStatus" TEXT,
    "motherAge" TEXT,
    "motherOccupation" TEXT,
    "motherIncome" TEXT,
    "motherStatus" TEXT,
    "parentsStatus" TEXT,
    "tuitionPayer" TEXT,
    "guardianRelation" TEXT,
    "guardianOccupation" TEXT,
    "guardianIncome" TEXT,
    "siblingsWorking" TEXT,
    "siblingsNotWorking" TEXT,
    "siblingsStudying" TEXT,
    "studentLoan" TEXT,
    "previousScholarships" TEXT,
    "accommodationMapUrl" TEXT,

    CONSTRAINT "applicant_supporting_info_pkey" PRIMARY KEY ("applicantId")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" SERIAL NOT NULL,
    "applicantId" INTEGER NOT NULL,
    "evaluatorId" INTEGER NOT NULL,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'DRAFT',
    "totalScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_items" (
    "id" SERIAL NOT NULL,
    "evaluationId" INTEGER NOT NULL,
    "subCriteriaId" INTEGER NOT NULL,
    "score" INTEGER,
    "comment" TEXT,
    "textValue" TEXT,

    CONSTRAINT "evaluation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocation_summaries" (
    "id" SERIAL NOT NULL,
    "roundId" INTEGER NOT NULL,
    "totalBudget" DECIMAL(14,2) NOT NULL,
    "status" "AllocationStatus" NOT NULL DEFAULT 'EDITING',
    "statusChangedById" INTEGER,
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allocation_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocations" (
    "id" SERIAL NOT NULL,
    "summaryId" INTEGER NOT NULL,
    "applicantId" INTEGER NOT NULL,
    "isAwarded" BOOLEAN NOT NULL DEFAULT false,
    "amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "actorId" INTEGER,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "roundId" INTEGER,
    "oldValue" JSONB,
    "newValue" JSONB,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_isActive_idx" ON "users"("role", "isActive");

-- CreateIndex
CREATE INDEX "users_expiresAt_idx" ON "users"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_userId_key" ON "user_sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_sessionId_key" ON "user_sessions"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "criteria_name_key" ON "criteria"("name");

-- CreateIndex
CREATE INDEX "sub_criteria_criteriaId_sortOrder_idx" ON "sub_criteria"("criteriaId", "sortOrder");

-- CreateIndex
CREATE INDEX "scholarship_rounds_status_idx" ON "scholarship_rounds"("status");

-- CreateIndex
CREATE INDEX "scholarship_rounds_academicYear_semester_idx" ON "scholarship_rounds"("academicYear", "semester");

-- CreateIndex
CREATE INDEX "scholarship_rounds_name_idx" ON "scholarship_rounds"("name");

-- CreateIndex
CREATE INDEX "scholarship_rounds_criteriaId_idx" ON "scholarship_rounds"("criteriaId");

-- CreateIndex
CREATE INDEX "import_batches_roundId_importedAt_idx" ON "import_batches"("roundId", "importedAt");

-- CreateIndex
CREATE INDEX "applicants_roundId_faculty_idx" ON "applicants"("roundId", "faculty");

-- CreateIndex
CREATE INDEX "applicants_roundId_lastName_firstName_idx" ON "applicants"("roundId", "lastName", "firstName");

-- CreateIndex
CREATE INDEX "applicants_importBatchId_idx" ON "applicants"("importBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "applicants_roundId_studentCode_key" ON "applicants"("roundId", "studentCode");

-- CreateIndex
CREATE INDEX "evaluations_applicantId_status_idx" ON "evaluations"("applicantId", "status");

-- CreateIndex
CREATE INDEX "evaluations_evaluatorId_status_idx" ON "evaluations"("evaluatorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "evaluations_evaluatorId_applicantId_key" ON "evaluations"("evaluatorId", "applicantId");

-- CreateIndex
CREATE INDEX "evaluation_items_subCriteriaId_idx" ON "evaluation_items"("subCriteriaId");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_items_evaluationId_subCriteriaId_key" ON "evaluation_items"("evaluationId", "subCriteriaId");

-- CreateIndex
CREATE UNIQUE INDEX "allocation_summaries_roundId_key" ON "allocation_summaries"("roundId");

-- CreateIndex
CREATE UNIQUE INDEX "allocations_applicantId_key" ON "allocations"("applicantId");

-- CreateIndex
CREATE INDEX "allocations_summaryId_isAwarded_idx" ON "allocations"("summaryId", "isAwarded");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_roundId_idx" ON "audit_logs"("roundId");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_criteria" ADD CONSTRAINT "sub_criteria_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarship_rounds" ADD CONSTRAINT "scholarship_rounds_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "criteria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "scholarship_rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "scholarship_rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "import_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_contacts" ADD CONSTRAINT "applicant_contacts_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_supporting_info" ADD CONSTRAINT "applicant_supporting_info_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_items" ADD CONSTRAINT "evaluation_items_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_items" ADD CONSTRAINT "evaluation_items_subCriteriaId_fkey" FOREIGN KEY ("subCriteriaId") REFERENCES "sub_criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocation_summaries" ADD CONSTRAINT "allocation_summaries_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "scholarship_rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocation_summaries" ADD CONSTRAINT "allocation_summaries_statusChangedById_fkey" FOREIGN KEY ("statusChangedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_summaryId_fkey" FOREIGN KEY ("summaryId") REFERENCES "allocation_summaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
