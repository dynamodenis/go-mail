-- AlterTable
ALTER TABLE "User" ADD COLUMN     "subscriptionStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "EmailSendLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailSendLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailSendLedger_userId_createdAt_idx" ON "EmailSendLedger"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailSendLedger_batchId_idx" ON "EmailSendLedger"("batchId");

-- AddForeignKey
ALTER TABLE "EmailSendLedger" ADD CONSTRAINT "EmailSendLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
