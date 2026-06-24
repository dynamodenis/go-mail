import type { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Stub the query-options factories with identifiable keys so we can assert which
// queries get warmed without standing up a real QueryClient.
vi.mock("../api/queries", () => ({
	emailFoldersQueryOptions: () => ({
		queryKey: ["email", "folders"],
		queryFn: vi.fn(),
	}),
	emailThreadsQueryOptions: (folderId: string, role: string) => ({
		queryKey: ["email", "threads", folderId, role],
		queryFn: vi.fn(),
	}),
	emailThreadDetailQueryOptions: (threadId: string) => ({
		queryKey: ["email", "detail", threadId],
		queryFn: vi.fn(),
	}),
}));

import { prefetchEmailData } from "../api/prefetch";

function makeThreads(prefix: string, n: number) {
	return Array.from({ length: n }, (_, i) => ({ id: `${prefix}-${i}` }));
}

const FOLDERS = [
	{ id: "inbox-f", name: "Inbox", role: "inbox", unreadCount: 0 },
	{ id: "sent-f", name: "Sent", role: "sent", unreadCount: 0 },
	{ id: "drafts-f", name: "Drafts", role: "drafts", unreadCount: 0 },
];

// folder id → the prefix used for its threads, so detail keys are traceable.
const THREADS_BY_FOLDER: Record<string, number> = {
	"inbox-f": 12,
	"sent-f": 12,
	"drafts-f": 5,
};

let prefetchQuery: ReturnType<typeof vi.fn>;
let getQueryData: ReturnType<typeof vi.fn>;
let qc: QueryClient;

function makeQueryData(folders: unknown) {
	return vi.fn((key: unknown[]) => {
		if (key[1] === "folders") return folders;
		if (key[1] === "threads") {
			const folderId = key[2] as string;
			return makeThreads(folderId, THREADS_BY_FOLDER[folderId] ?? 0);
		}
		return undefined;
	});
}

beforeEach(() => {
	prefetchQuery = vi.fn().mockResolvedValue(undefined);
	getQueryData = makeQueryData(FOLDERS);
	qc = { prefetchQuery, getQueryData } as unknown as QueryClient;
});

describe("prefetchEmailData", () => {
	it("warms the folder list first", async () => {
		await prefetchEmailData(qc);
		expect(prefetchQuery.mock.calls[0][0].queryKey).toEqual([
			"email",
			"folders",
		]);
	});

	it("warms thread lists for the inbox, sent, and drafts folders", async () => {
		await prefetchEmailData(qc);

		const listFolderIds = prefetchQuery.mock.calls
			.map((c) => c[0].queryKey)
			.filter((k) => k[1] === "threads")
			.map((k) => k[2]);
		expect(listFolderIds).toEqual(
			expect.arrayContaining(["inbox-f", "sent-f", "drafts-f"]),
		);
	});

	it("warms message bodies for the top 10 threads of inbox and sent only", async () => {
		await prefetchEmailData(qc);

		const detailIds = prefetchQuery.mock.calls
			.map((c) => c[0].queryKey)
			.filter((k) => k[1] === "detail")
			.map((k) => k[2] as string);

		// 10 inbox + 10 sent = 20 details, none from drafts.
		expect(detailIds).toHaveLength(20);
		expect(detailIds.filter((id) => id.startsWith("inbox-f"))).toHaveLength(10);
		expect(detailIds.filter((id) => id.startsWith("sent-f"))).toHaveLength(10);
		expect(detailIds.some((id) => id.startsWith("drafts-f"))).toBe(false);
		// Capped at 10 — the 11th/12th inbox threads are not warmed.
		expect(detailIds).not.toContain("inbox-f-10");
	});

	it("does nothing when no folders are cached (mailbox not connected)", async () => {
		getQueryData = makeQueryData(undefined);
		qc = { prefetchQuery, getQueryData } as unknown as QueryClient;

		await prefetchEmailData(qc);

		// Only the folder-list prefetch ran; no thread/detail warming.
		const nonFolderCalls = prefetchQuery.mock.calls
			.map((c) => c[0].queryKey)
			.filter((k) => k[1] !== "folders");
		expect(nonFolderCalls).toHaveLength(0);
	});
});
