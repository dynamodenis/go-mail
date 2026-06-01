-- CreateTable
CREATE TABLE "UserUsage" (
    "userId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "settled" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserUsage_pkey" PRIMARY KEY ("userId","periodStart")
);

-- AddForeignKey
ALTER TABLE "UserUsage" ADD CONSTRAINT "UserUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: seed one row per user for their CURRENT billing period so the new
-- reservation gate starts from the usage already recorded in the ledger. Both
-- `reserved` and `settled` are seeded to the ledger SUM since the period start
-- (at backfill time every recorded send is also a confirmed/settled send, so
-- reserved == settled). The period-start expression mirrors lib/quota.ts
-- `currentPeriodStart` (anchor + elapsed months, stepped back one month if that
-- lands in the future). Note: Postgres clamps end-of-month (Jan 31 + 1mo =
-- Feb 28) whereas JS overflows to early March — a sub-week boundary quirk that
-- only matters for anchors after the 28th and self-corrects next period.
WITH periods AS (
    SELECT
        u."id" AS "userId",
        (
            u."subscriptionStartedAt"
            + make_interval(months =>
                (EXTRACT(YEAR FROM now())::int - EXTRACT(YEAR FROM u."subscriptionStartedAt")::int) * 12
              + (EXTRACT(MONTH FROM now())::int - EXTRACT(MONTH FROM u."subscriptionStartedAt")::int)
              - CASE
                    WHEN u."subscriptionStartedAt"
                         + make_interval(months =>
                             (EXTRACT(YEAR FROM now())::int - EXTRACT(YEAR FROM u."subscriptionStartedAt")::int) * 12
                           + (EXTRACT(MONTH FROM now())::int - EXTRACT(MONTH FROM u."subscriptionStartedAt")::int)
                           ) > now()
                    THEN 1 ELSE 0
                END
            )
        ) AS "periodStart"
    FROM "User" u
)
INSERT INTO "UserUsage" ("userId", "periodStart", "reserved", "settled", "updatedAt")
SELECT
    p."userId",
    p."periodStart",
    COALESCE(SUM(l."count"), 0),
    COALESCE(SUM(l."count"), 0),
    now()
FROM periods p
LEFT JOIN "EmailSendLedger" l
    ON l."userId" = p."userId"
   AND l."createdAt" >= p."periodStart"
GROUP BY p."userId", p."periodStart"
ON CONFLICT ("userId", "periodStart") DO NOTHING;
