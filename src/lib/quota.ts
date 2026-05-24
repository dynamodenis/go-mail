import type { Plan } from "@prisma/client";

/** Per-cycle send quotas keyed by plan. Adjust as pricing changes — these are
 *  the upsell pressure: hit the cap and the user must upgrade or wait for the
 *  next anniversary. */
export const MONTHLY_SEND_QUOTA: Record<Plan, number> = {
	FREE: 100,
	STARTER: 5_000,
	GROWTH: 25_000,
	PRO: 100_000,
};

/** Returns the start of the user's current monthly billing cycle, anchored to
 *  their `subscriptionStartedAt`. Pure function — no I/O, no state, safe to
 *  call inline. Resets are implicit: as `now` crosses the next anniversary,
 *  this function returns a new value and the ledger SUM zeroes out naturally.
 *
 *  Edge case: signing up on the 31st means months without a 31st (Feb, Apr,
 *  Jun, Sep, Nov) advance to the 1st of the following month — a quirk of
 *  JavaScript's Date.setMonth overflow. Acceptable for a billing cycle. */
export function currentPeriodStart(subscriptionStartedAt: Date): Date {
	const anchor = new Date(subscriptionStartedAt);
	const now = new Date();
	const monthsElapsed =
		(now.getFullYear() - anchor.getFullYear()) * 12 +
		(now.getMonth() - anchor.getMonth());
	const start = new Date(anchor);
	start.setMonth(anchor.getMonth() + monthsElapsed);
	if (start > now) start.setMonth(start.getMonth() - 1);
	return start;
}

export function quotaFor(plan: Plan): number {
	return MONTHLY_SEND_QUOTA[plan];
}
