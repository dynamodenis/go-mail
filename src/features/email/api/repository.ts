import { nylas } from "@/lib/nylas";
import type { Folder, Message, Thread } from "nylas";

/** Pure data-access layer for email — every call goes through the central Nylas
 *  client scoped to a grant id. No auth, no business rules, no mapping; returns
 *  raw Nylas models for the service to shape. */

// Threads call many provider APIs per request, so always bound with a limit
// (Nylas best-practices). 25 matches the app-wide default page size.
const THREAD_PAGE_SIZE = 25;

/** Lists every folder/label on the mailbox. The service classifies, names, and
 *  filters them for the sidebar. */
export async function listFolders(grantId: string): Promise<Folder[]> {
	const { data } = await nylas.folders.list({ identifier: grantId });
	return data;
}

/** Lists threads in a folder, optionally filtered by a provider-native search
 *  query. Bounded by THREAD_PAGE_SIZE. */
export async function listThreads(
	grantId: string,
	folderId: string,
	search?: string,
): Promise<Thread[]> {
	const { data } = await nylas.threads.list({
		identifier: grantId,
		queryParams: {
			in: [folderId],
			limit: THREAD_PAGE_SIZE,
			...(search ? { searchQueryNative: search } : {}),
		},
	});
	return data;
}

// An archived Gmail thread is simply one carrying no system label, so the Done
// view is a native search excluding every other system context. Gmail syntax is
// safe here: this query only runs for grants with no real archive folder, which
// in practice means Gmail (Outlook/IMAP expose a \Archive folder instead).
// Trade-off: -in:sent also hides archived threads the user replied to.
const ARCHIVED_NATIVE_QUERY =
	"-in:inbox -in:sent -in:draft -in:chats -in:snoozed -in:spam -in:trash";

/** Lists archived ("Done") threads for providers without an archive folder,
 *  optionally narrowed by extra user search terms. Bounded by THREAD_PAGE_SIZE. */
export async function listArchivedThreads(
	grantId: string,
	search?: string,
): Promise<Thread[]> {
	const { data } = await nylas.threads.list({
		identifier: grantId,
		queryParams: {
			limit: THREAD_PAGE_SIZE,
			searchQueryNative: search
				? `${ARCHIVED_NATIVE_QUERY} ${search}`
				: ARCHIVED_NATIVE_QUERY,
		},
	});
	return data;
}

// The sidebar badge renders anything over 99 as "99+", so counting past 100
// threads would be wasted Nylas quota (the threads endpoint is costly).
const BADGE_COUNT_LIMIT = 100;

/** Counts archived threads (read or not) for the virtual Done folder's sidebar
 *  badge — Done is a triage tally, so unlike the other folders' unread badges it
 *  counts everything, and grows as threads are marked done. Nylas has no count
 *  endpoint, so this lists id-only threads (cheap via `select`) capped at
 *  BADGE_COUNT_LIMIT. */
export async function countArchivedThreads(grantId: string): Promise<number> {
	const { data } = await nylas.threads.list({
		identifier: grantId,
		queryParams: {
			limit: BADGE_COUNT_LIMIT,
			select: "id",
			searchQueryNative: ARCHIVED_NATIVE_QUERY,
		},
	});
	return data.length;
}

/** Fetches a single thread's metadata. */
export async function findThread(
	grantId: string,
	threadId: string,
): Promise<Thread> {
	const { data } = await nylas.threads.find({ identifier: grantId, threadId });
	return data;
}

/** Replaces the folders/labels on every message in a thread. This is how a
 *  thread moves between folders — e.g. archiving = the current set minus the
 *  inbox folder. */
export async function updateThreadFolders(
	grantId: string,
	threadId: string,
	folderIds: string[],
): Promise<Thread> {
	const { data } = await nylas.threads.update({
		identifier: grantId,
		threadId,
		requestBody: { folders: folderIds },
	});
	return data;
}

/** Fetches every message in a thread for the reading pane. */
export async function listThreadMessages(
	grantId: string,
	threadId: string,
): Promise<Message[]> {
	const { data } = await nylas.messages.list({
		identifier: grantId,
		queryParams: { threadId },
	});
	return data;
}
