-- CreateEnum
CREATE TYPE "EmailScheduleStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'PARTIALLY_SENT', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "EmailSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyJson" JSONB NOT NULL DEFAULT '{}',
    "tiptapReference" TEXT,
    "toRecipients" JSONB NOT NULL,
    "ccRecipients" JSONB NOT NULL DEFAULT '[]',
    "bccRecipients" JSONB NOT NULL DEFAULT '[]',
    "recipientCount" INTEGER NOT NULL,
    "status" "EmailScheduleStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailScheduleAttachment" (
    "id" TEXT NOT NULL,
    "emailScheduleId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailScheduleAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailSchedule_userId_idx" ON "EmailSchedule"("userId");

-- CreateIndex
CREATE INDEX "EmailSchedule_status_idx" ON "EmailSchedule"("status");

-- CreateIndex
CREATE INDEX "EmailSchedule_scheduledAt_idx" ON "EmailSchedule"("scheduledAt");

-- CreateIndex
CREATE INDEX "EmailSchedule_createdAt_idx" ON "EmailSchedule"("createdAt");

-- CreateIndex
CREATE INDEX "EmailScheduleAttachment_emailScheduleId_idx" ON "EmailScheduleAttachment"("emailScheduleId");

-- AddForeignKey
ALTER TABLE "EmailSchedule" ADD CONSTRAINT "EmailSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSchedule" ADD CONSTRAINT "EmailSchedule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailScheduleAttachment" ADD CONSTRAINT "EmailScheduleAttachment_emailScheduleId_fkey" FOREIGN KEY ("emailScheduleId") REFERENCES "EmailSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
