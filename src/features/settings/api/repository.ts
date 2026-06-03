import { prisma } from "@/lib/prisma";

/** Pure data-access layer for user settings. No auth or business logic. */

// Nylas is the user's personal inbox/calendar grant — independent of the bulk
// `sendingProvider` (Resend/SES/etc.), so connecting/disconnecting never touches
// that column.
const NYLAS_SELECT = {
	nylasGrantId: true,
	nylasEmail: true,
} as const;

/** Returns the Nylas-relevant settings fields, or null if the user has no
 *  settings row yet (never connected anything). */
export async function findNylasSettings(userId: string) {
	return prisma.userSettings.findUnique({
		where: { userId },
		select: NYLAS_SELECT,
	});
}

/** Stores a connected grant. Upserts so the first connection creates the
 *  settings row (other columns fall back to their schema defaults) and a
 *  reconnect overwrites the previous grant. */
export async function upsertNylasGrant(
	userId: string,
	grant: { grantId: string; email: string },
) {
	return prisma.userSettings.upsert({
		where: { userId },
		create: {
			userId,
			nylasGrantId: grant.grantId,
			nylasEmail: grant.email,
		},
		update: {
			nylasGrantId: grant.grantId,
			nylasEmail: grant.email,
		},
		select: NYLAS_SELECT,
	});
}

/** Clears the grant on disconnect. `updateMany` so it's a clean no-op when the
 *  user has no settings row yet. */
export async function clearNylasGrant(userId: string) {
	return prisma.userSettings.updateMany({
		where: { userId },
		data: { nylasGrantId: null, nylasEmail: null },
	});
}
