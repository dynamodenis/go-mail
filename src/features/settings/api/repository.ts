import { prisma } from "@/lib/prisma";

/** Pure data-access layer for user settings. No auth or business logic. */

// Columns safe to return to callers — never includes `grantId`, which is a
// bearer-equivalent secret and must not leak past the service layer.
const NYLAS_ACCOUNT_SELECT = {
	id: true,
	email: true,
	isPrimary: true,
	createdAt: true,
} as const;

/** Lists a user's connected mailboxes, primary first then oldest. */
export async function listNylasAccounts(userId: string) {
	return prisma.nylasAccount.findMany({
		where: { userId },
		select: NYLAS_ACCOUNT_SELECT,
		orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
	});
}

/** Returns a single account scoped to the user, or null. Includes `isPrimary`
 *  so the service can decide whether to promote a replacement on delete. */
export async function findNylasAccount(userId: string, accountId: string) {
	return prisma.nylasAccount.findFirst({
		where: { id: accountId, userId },
		select: { id: true, isPrimary: true },
	});
}

/** Looks up an account by mailbox address so a reconnect can refresh its grant
 *  instead of inserting a duplicate. */
export async function findNylasAccountByEmail(userId: string, email: string) {
	return prisma.nylasAccount.findUnique({
		where: { userId_email: { userId, email } },
		select: { id: true, isPrimary: true },
	});
}

/** Count of a user's connected mailboxes — used to decide the first-connected
 *  account becomes primary. */
export async function countNylasAccounts(userId: string) {
	return prisma.nylasAccount.count({ where: { userId } });
}

/** Creates a new connected mailbox. */
export async function createNylasAccount(
	userId: string,
	data: { grantId: string; email: string; isPrimary: boolean },
) {
	return prisma.nylasAccount.create({
		data: { userId, ...data },
		select: NYLAS_ACCOUNT_SELECT,
	});
}

/** Refreshes the grant on an existing mailbox (reconnect). */
export async function updateNylasAccountGrant(
	accountId: string,
	grantId: string,
) {
	return prisma.nylasAccount.update({
		where: { id: accountId },
		data: { grantId },
		select: NYLAS_ACCOUNT_SELECT,
	});
}

/** Deletes a mailbox scoped to the user. `deleteMany` so a stale/foreign id is
 *  a clean no-op rather than a throw. */
export async function deleteNylasAccount(userId: string, accountId: string) {
	return prisma.nylasAccount.deleteMany({
		where: { id: accountId, userId },
	});
}

/** Returns the grant id of the user's primary mailbox, or null when nothing is
 *  connected. `grantId` is a bearer-equivalent secret — this is the only place
 *  it leaves the table, and only ever to server-side callers (never serialized
 *  to the client). Falls back to the most recent account if, defensively, no
 *  row is flagged primary. */
export async function findPrimaryGrantId(
	userId: string,
): Promise<string | null> {
	const account =
		(await prisma.nylasAccount.findFirst({
			where: { userId, isPrimary: true },
			select: { grantId: true },
		})) ??
		(await prisma.nylasAccount.findFirst({
			where: { userId },
			select: { grantId: true },
			orderBy: { createdAt: "desc" },
		}));
	return account?.grantId ?? null;
}

/** Returns the oldest remaining mailbox, used to promote a new primary after
 *  the current primary is disconnected. */
export async function findOldestNylasAccount(userId: string) {
	return prisma.nylasAccount.findFirst({
		where: { userId },
		select: { id: true },
		orderBy: { createdAt: "asc" },
	});
}

/** Atomically makes one mailbox primary and clears the flag on the rest. The
 *  transaction keeps the "exactly one primary" invariant intact. Scoped by
 *  userId so a foreign account id can never be promoted. */
export async function setPrimaryNylasAccount(
	userId: string,
	accountId: string,
) {
	return prisma.$transaction([
		prisma.nylasAccount.updateMany({
			where: { userId, isPrimary: true },
			data: { isPrimary: false },
		}),
		prisma.nylasAccount.updateMany({
			where: { id: accountId, userId },
			data: { isPrimary: true },
		}),
	]);
}

/** Grant id for one specific account, scoped to its owner — returns null when
 *  the account doesn't exist or belongs to someone else. */
export async function findGrantIdByAccountId(
	userId: string,
	accountId: string,
) {
	const account = await prisma.nylasAccount.findFirst({
		where: { id: accountId, userId },
		select: { grantId: true },
	});
	return account?.grantId ?? null;
}
