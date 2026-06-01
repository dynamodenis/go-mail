-- Rename UserUsage -> EmailUserUsage (table + constraints) to tie the quota
-- counter to the email feature. Done as in-place RENAMEs so the existing
-- backfilled rows are preserved (Prisma's auto-diff would DROP + CREATE and
-- lose them).
ALTER TABLE "UserUsage" RENAME TO "EmailUserUsage";
ALTER TABLE "EmailUserUsage" RENAME CONSTRAINT "UserUsage_pkey" TO "EmailUserUsage_pkey";
ALTER TABLE "EmailUserUsage" RENAME CONSTRAINT "UserUsage_userId_fkey" TO "EmailUserUsage_userId_fkey";
