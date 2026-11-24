-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'SCHOLARSHIP_TYPE_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'SCHOLARSHIP_TYPE_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'SCHOLARSHIP_TYPE_ACTIVATE';
ALTER TYPE "AuditAction" ADD VALUE 'SCHOLARSHIP_TYPE_DEACTIVATE';
ALTER TYPE "AuditAction" ADD VALUE 'VIEW_APPLICANT_HISTORY';

-- AlterTable
ALTER TABLE "scholarship_rounds" ADD COLUMN     "scholarshipTypeId" INTEGER;

-- CreateTable
CREATE TABLE "scholarship_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultCriteriaId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scholarship_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scholarship_types_name_key" ON "scholarship_types"("name");

-- CreateIndex
CREATE INDEX "scholarship_rounds_scholarshipTypeId_idx" ON "scholarship_rounds"("scholarshipTypeId");

-- AddForeignKey
ALTER TABLE "scholarship_types" ADD CONSTRAINT "scholarship_types_defaultCriteriaId_fkey" FOREIGN KEY ("defaultCriteriaId") REFERENCES "criteria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarship_rounds" ADD CONSTRAINT "scholarship_rounds_scholarshipTypeId_fkey" FOREIGN KEY ("scholarshipTypeId") REFERENCES "scholarship_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
