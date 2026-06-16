import { useQuery } from "@tanstack/react-query";
import { getMockThreadDetail, getMockThreads } from "../data/mock-threads";
import type { EmailFolder } from "../types";

const STALE_TIME = 30_000; // 30s — inbox data changes frequently

export const emailKeys = {
	all: ["email"] as const,
	threads: (folder: EmailFolder, search?: string) =>
		[...emailKeys.all, "threads", folder, search ?? ""] as const,
	detail: (threadId: string) => [...emailKeys.all, "detail", threadId] as const,
};

// NOTE (skeleton): these resolve mock data so the UI is usable before Nylas is
// connected. To wire the integration, replace each queryFn with a call to a
// Nylas-backed server function (createServerFn in api/server.ts) that returns
// the same EmailThread / EmailThreadDetail shapes — no component changes needed.

/** Threads for a folder, optionally filtered by a search query. */
export function useEmailThreads(folder: EmailFolder, search?: string) {
	return useQuery({
		queryKey: emailKeys.threads(folder, search),
		queryFn: async () => getMockThreads(folder, search),
		staleTime: STALE_TIME,
	});
}

/** The expanded thread (messages) for the reading pane. */
export function useEmailThreadDetail(threadId: string | null) {
	return useQuery({
		queryKey: emailKeys.detail(threadId ?? ""),
		queryFn: async () => getMockThreadDetail(threadId as string),
		enabled: !!threadId,
		staleTime: STALE_TIME,
	});
}
