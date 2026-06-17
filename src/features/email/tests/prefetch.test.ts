import { describe, it, expect, vi, beforeEach } from "vitest";
import type { QueryClient } from "@tanstack/react-query";

// Stub the query-options factories with identifiable keys so we can assert which
// queries get warmed without standing up a real QueryClient.
vi.mock("../api/queries", () => ({
	emailThreadsQueryOptions: (folder: string) => ({
		queryKey: ["email", "threads", folder],
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

let prefetchQuery: ReturnType<typeof vi.fn>;
let getQueryData: ReturnType<typeof vi.fn>;
let qc: QueryClient;

beforeEach(() => {
	prefetchQuery = vi.fn().mockResolvedValue(undefined);
	// 12 inbox + 12 sent threads → only the first 10 of each should be warmed.
	getQueryData = vi.fn((key: unknown[]) => {
		const folder = key[2];
		if (folder === "inbox") return makeThreads("inbox", 12);
		if (folder === "sent") return makeThreads("sent", 12);
		return makeThreads("drafts", 5);
	});
	qc = { prefetchQuery, getQueryData } as unknown as QueryClient;
});

describe("prefetchEmailData", () => {
	it("warms thread lists for inbox, sent, and drafts", async () => {
		await prefetchEmailData(qc);

		const listKeys = prefetchQuery.mock.calls
			.map((c) => c[0].queryKey)
			.filter((k) => k[1] === "threads")
			.map((k) => k[2]);
		expect(listKeys).toEqual(
			expect.arrayContaining(["inbox", "sent", "drafts"]),
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
		expect(detailIds.filter((id) => id.startsWith("inbox"))).toHaveLength(10);
		expect(detailIds.filter((id) => id.startsWith("sent"))).toHaveLength(10);
		expect(detailIds.some((id) => id.startsWith("drafts"))).toBe(false);
		// Capped at 10 — the 11th/12th inbox threads are not warmed.
		expect(detailIds).not.toContain("inbox-10");
	});

	it("skips detail warming for a folder with no cached list", async () => {
		getQueryData = vi.fn(() => undefined);
		qc = { prefetchQuery, getQueryData } as unknown as QueryClient;

		await prefetchEmailData(qc);

		const detailCount = prefetchQuery.mock.calls
			.map((c) => c[0].queryKey)
			.filter((k) => k[1] === "detail").length;
		expect(detailCount).toBe(0);
	});
});
