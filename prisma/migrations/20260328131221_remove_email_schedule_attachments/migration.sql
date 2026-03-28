/*
  Warnings:

  - You are about to drop the `EmailScheduleAttachment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EmailScheduleAttachment" DROP CONSTRAINT "EmailScheduleAttachment_emailScheduleId_fkey";

-- DropTable
DROP TABLE "EmailScheduleAttachment";
