-- CreateTable
CREATE TABLE "NylasAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NylasAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NylasAccount_userId_idx" ON "NylasAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NylasAccount_userId_email_key" ON "NylasAccount"("userId", "email");

-- AddForeignKey
ALTER TABLE "NylasAccount" ADD CONSTRAINT "NylasAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data migration: preserve any grant already stored on UserSettings as the
-- user's primary NylasAccount before dropping the legacy columns.
INSERT INTO "NylasAccount" ("id", "userId", "grantId", "email", "isPrimary", "createdAt", "updatedAt")
SELECT gen_random_uuid(), "userId", "nylasGrantId", COALESCE("nylasEmail", ''), true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "UserSettings"
WHERE "nylasGrantId" IS NOT NULL;

-- AlterTable
ALTER TABLE "UserSettings" DROP COLUMN "nylasEmail",
DROP COLUMN "nylasGrantId";
