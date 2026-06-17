import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import { ServerError, unwrap } from "@/lib/server-result";
import { getEmailThreadDetail, getEmailThreads } from "./server";
import { EMAIL_CONNECT_CODES, type EmailFolder } from "../types";

const STALE_TIME = 30_000; // 30s — inbox data changes frequently

export const emailKeys = {
	all: ["email"] as const,
	threads: (folder: EmailFolder, search?: string) =>
		[...emailKeys.all, "threads", folder, search ?? ""] as const,
	detail: (threadId: string) => [...emailKeys.all, "detail", threadId] as const,
};

// "Not connected / not configured" are expected states, not failures to retry —
// they resolve to a connect CTA. Everything else retries a couple of times.
function retryUnlessConnectState(failureCount: number, error: unknown): boolean {
	if (error instanceof ServerError && EMAIL_CONNECT_CODES.has(error.code)) {
		return false;
	}
	return failureCount < 2;
}

/** Shared query config for a folder's threads. Used by both the component hook
 *  and the prefetcher so they populate/read the exact same cache entry — a
 *  prefetch with different options would silently miss the hook's cache key. */
export const emailThreadsQueryOptions = (folder: EmailFolder, search?: string) =>
	queryOptions({
		queryKey: emailKeys.threads(folder, search),
		queryFn: async () =>
			unwrap(await getEmailThreads({ data: { folder, search } })),
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

/** Threads for a folder, optionally filtered by a search query. Backed by the
 *  user's primary Nylas mailbox via the email server functions. */
export function useEmailThreads(folder: EmailFolder, search?: string) {
	return useQuery(emailThreadsQueryOptions(folder, search));
}

/** The expanded thread (messages) for the reading pane. */
export function useEmailThreadDetail(threadId: string | null) {
	return useQuery({
		...emailThreadDetailQueryOptions(threadId ?? ""),
		enabled: !!threadId,
	});
}
