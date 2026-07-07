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
