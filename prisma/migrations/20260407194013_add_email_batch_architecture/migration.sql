/*
  Warnings:

  - You are about to drop the column `bccRecipients` on the `EmailSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `bodyHtml` on the `EmailSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `bodyJson` on the `EmailSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `ccRecipients` on the `EmailSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `recipientCount` on the `EmailSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledAt` on the `EmailSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `EmailSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `templateId` on the `EmailSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `tiptapReference` on the `EmailSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `toRecipients` on the `EmailSchedule` table. All the data in the column will be lost.
  - The `status` column on the `EmailSchedule` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `batchId` to the `EmailSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientEmail` to the `EmailSchedule` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EmailBatchStatus" AS ENUM ('PENDING', 'EXPANDING', 'SENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EmailBatchSourceType" AS ENUM ('COLLECTION', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "EmailRecipientStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- DropForeignKey
ALTER TABLE "EmailSchedule" DROP CONSTRAINT "EmailSchedule_templateId_fkey";

-- DropIndex
DROP INDEX "EmailSchedule_scheduledAt_idx";

-- AlterTable
ALTER TABLE "EmailSchedule" DROP COLUMN "bccRecipients",
DROP COLUMN "bodyHtml",
DROP COLUMN "bodyJson",
DROP COLUMN "ccRecipients",
DROP COLUMN "recipientCount",
DROP COLUMN "scheduledAt",
DROP COLUMN "subject",
DROP COLUMN "templateId",
DROP COLUMN "tiptapReference",
DROP COLUMN "toRecipients",
ADD COLUMN     "batchId" TEXT NOT NULL,
ADD COLUMN     "recipientEmail" TEXT NOT NULL,
ADD COLUMN     "recipientName" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "EmailRecipientStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "EmailScheduleStatus";

-- CreateTable
CREATE TABLE "EmailBatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyJson" JSONB NOT NULL DEFAULT '{}',
    "tiptapReference" TEXT,
    "ccRecipients" JSONB NOT NULL DEFAULT '[]',
    "bccRecipients" JSONB NOT NULL DEFAULT '[]',
    "scheduledAt" TIMESTAMP(3),
    "status" "EmailBatchStatus" NOT NULL DEFAULT 'PENDING',
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailBatchSource" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "type" "EmailBatchSourceType" NOT NULL,
    "collectionId" TEXT,
    "email" TEXT,
    "name" TEXT,

    CONSTRAINT "EmailBatchSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailBatch_userId_idx" ON "EmailBatch"("userId");

-- CreateIndex
CREATE INDEX "EmailBatch_status_idx" ON "EmailBatch"("status");

-- CreateIndex
CREATE INDEX "EmailBatch_scheduledAt_idx" ON "EmailBatch"("scheduledAt");

-- CreateIndex
CREATE INDEX "EmailBatch_createdAt_idx" ON "EmailBatch"("createdAt");

-- CreateIndex
CREATE INDEX "EmailBatchSource_batchId_idx" ON "EmailBatchSource"("batchId");

-- CreateIndex
CREATE INDEX "EmailSchedule_batchId_idx" ON "EmailSchedule"("batchId");

-- CreateIndex
CREATE INDEX "EmailSchedule_status_idx" ON "EmailSchedule"("status");

-- CreateIndex
CREATE INDEX "EmailSchedule_recipientEmail_idx" ON "EmailSchedule"("recipientEmail");

-- AddForeignKey
ALTER TABLE "EmailBatch" ADD CONSTRAINT "EmailBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailBatch" ADD CONSTRAINT "EmailBatch_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailBatchSource" ADD CONSTRAINT "EmailBatchSource_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "EmailBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailBatchSource" ADD CONSTRAINT "EmailBatchSource_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSchedule" ADD CONSTRAINT "EmailSchedule_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "EmailBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
