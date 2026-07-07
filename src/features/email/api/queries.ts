import { ServerError, unwrap } from "@/lib/server-result";
import {
	type QueryClient,
	keepPreviousData,
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	EMAIL_CONNECT_CODES,
	type EmailThread,
	type FolderRole,
} from "../types";
import {
	archiveEmailThread,
	getEmailFolders,
	getEmailThreadDetail,
	getEmailThreads,
} from "./server";

const STALE_TIME = 30_000; // 30s — inbox data changes frequently
const FOLDERS_STALE_TIME = 300_000; // 5m — the folder list rarely changes

export const emailKeys = {
	all: ["email"] as const,
	folders: () => [...emailKeys.all, "folders"] as const,
	// Prefix for every thread list — lets mutations invalidate all folders at once.
	threadLists: () => [...emailKeys.all, "threads"] as const,
	// Role is part of the key because it changes the preview the server returns,
	// so the inbox and the same folder viewed as "custom" don't share a cache.
	threads: (folderId: string, role: FolderRole, search?: string) =>
		[...emailKeys.threadLists(), folderId, role, search ?? ""] as const,
	detail: (threadId: string) => [...emailKeys.all, "detail", threadId] as const,
};

// "Not connected / not configured" are expected states, not failures to retry —
// they resolve to a connect CTA. Everything else retries a couple of times.
function retryUnlessConnectState(
	failureCount: number,
	error: unknown,
): boolean {
	if (error instanceof ServerError && EMAIL_CONNECT_CODES.has(error.code)) {
		return false;
	}
	return failureCount < 2;
}

/** The curated folder list backing the email sidebar. Semi-static, so it's
 *  cached longer than thread lists. */
export const emailFoldersQueryOptions = () =>
	queryOptions({
		queryKey: emailKeys.folders(),
		queryFn: async () => unwrap(await getEmailFolders()),
		staleTime: FOLDERS_STALE_TIME,
		retry: retryUnlessConnectState,
	});

/** Shared query config for a folder's threads. Used by both the component hook
 *  and the prefetcher so they populate/read the exact same cache entry — a
 *  prefetch with different options would silently miss the hook's cache key. */
export const emailThreadsQueryOptions = (
	folderId: string,
	role: FolderRole,
	search?: string,
) =>
	queryOptions({
		queryKey: emailKeys.threads(folderId, role, search),
		queryFn: async () =>
			unwrap(await getEmailThreads({ data: { folderId, role, search } })),
		staleTime: STALE_TIME,
		retry: retryUnlessConnectState,
		// Keep the current list visible while a new folder/search fetches, so
		// switching folders or typing a search doesn't flash the skeleton.
		placeholderData: keepPreviousData,
	});

/** Shared query config for a single thread's messages (reading pane). */
export const emailThreadDetailQueryOptions = (threadId: string) =>
	queryOptions({
		queryKey: emailKeys.detail(threadId),
		queryFn: async () =>
			unwrap(await getEmailThreadDetail({ data: { threadId } })),
		staleTime: STALE_TIME,
		retry: retryUnlessConnectState,
	});

/** The curated folder list for the sidebar. */
export function useEmailFolders() {
	return useQuery(emailFoldersQueryOptions());
}

/** Threads for a folder, optionally filtered by a search query. Backed by the
 *  user's primary Nylas mailbox via the email server functions. */
export function useEmailThreads(
	folderId: string,
	role: FolderRole,
	search?: string,
) {
	return useQuery(emailThreadsQueryOptions(folderId, role, search));
}

/** The expanded thread (messages) for the reading pane. */
export function useEmailThreadDetail(threadId: string | null) {
	return useQuery({
		...emailThreadDetailQueryOptions(threadId ?? ""),
		enabled: !!threadId,
	});
}

/** Marks a thread "Done" (archives it). Scoped to the list the user is looking
 *  at so the row can be removed optimistically; on failure the list is restored
 *  and the global mutation-cache toast reports it. Accepts an optional
 *  queryClient for test injection. */
export function useArchiveThread(
	folderId: string,
	role: FolderRole,
	search?: string,
	queryClient?: QueryClient,
) {
	const defaultClient = useQueryClient();
	const client = queryClient ?? defaultClient;
	const listKey = emailKeys.threads(folderId, role, search);

	return useMutation({
		mutationFn: async (threadId: string) =>
			unwrap(await archiveEmailThread({ data: { threadId } })),
		onMutate: async (threadId) => {
			// Optimistically drop the row so Done feels instant, Superhuman-style.
			await client.cancelQueries({ queryKey: listKey });
			const previous = client.getQueryData<EmailThread[]>(listKey);
			client.setQueryData<EmailThread[]>(listKey, (old) =>
				old?.filter((t) => t.id !== threadId),
			);
			return { previous };
		},
		onError: (_error, _threadId, context) => {
			if (context?.previous) client.setQueryData(listKey, context.previous);
		},
		onSettled: () => {
			// The thread moved folders, so every list (inbox, Done, labels) and the
			// sidebar unread counts may be stale.
			client.invalidateQueries({ queryKey: emailKeys.threadLists() });
			client.invalidateQueries({ queryKey: emailKeys.folders() });
		},
		meta: { errorMessage: "Couldn't mark the thread as done." },
	});
}
