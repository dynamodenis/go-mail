import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/lib/errors";

// Mock the repository so the service is tested without the Nylas client.
vi.mock("../api/repository", () => ({
	resolveFolderId: vi.fn(),
	listThreads: vi.fn(),
	findThread: vi.fn(),
	listThreadMessages: vi.fn(),
}));

import * as service from "../api/service";
import * as repo from "../api/repository";

const mockRepo = repo as unknown as Record<string, ReturnType<typeof vi.fn>>;
const GRANT = "grant-1";

// 2023-11-14T22:13:20.000Z
const RECEIVED = 1700000000;

function thread(overrides = {}) {
	return {
		id: "t1",
		grantId: GRANT,
		subject: "Q3 roadmap",
		snippet: "see deck",
		unread: true,
		starred: false,
		hasAttachments: true,
		participants: [
			{ email: "alice@acme.com", name: "Alice" },
			{ email: "me@gomail.app" },
		],
		messageIds: ["m1", "m2"],
		latestMessageReceivedDate: RECEIVED,
		latestDraftOrMessage: {
			from: [{ email: "alice@acme.com", name: "Alice" }],
			to: [{ email: "me@gomail.app", name: "Me" }],
		},
		...overrides,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("service.getThreads", () => {
	it("resolves the folder and maps Nylas threads onto the UI shape", async () => {
		mockRepo.resolveFolderId.mockResolvedValue("FOLDER_INBOX");
		mockRepo.listThreads.mockResolvedValue([thread()]);

		const result = await service.getThreads(GRANT, "inbox");

		expect(mockRepo.resolveFolderId).toHaveBeenCalledWith(GRANT, "inbox");
		expect(mockRepo.listThreads).toHaveBeenCalledWith(
			GRANT,
			"FOLDER_INBOX",
			undefined,
		);
		expect(result).toEqual([
			{
				id: "t1",
				subject: "Q3 roadmap",
				snippet: "see deck",
				unread: true,
				starred: false,
				hasAttachments: true,
				participants: [
					{ name: "Alice", email: "alice@acme.com" },
					{ name: null, email: "me@gomail.app" },
				],
				preview: { name: "Alice", email: "alice@acme.com" },
				date: "2023-11-14T22:13:20.000Z",
				messageCount: 2,
			},
		]);
	});

	it("uses the recipient as the preview for the sent folder", async () => {
		mockRepo.resolveFolderId.mockResolvedValue("FOLDER_SENT");
		mockRepo.listThreads.mockResolvedValue([thread()]);

		const [mapped] = await service.getThreads(GRANT, "sent");

		expect(mapped.preview).toEqual({ name: "Me", email: "me@gomail.app" });
	});

	it("returns an empty list when the mailbox has no such folder", async () => {
		mockRepo.resolveFolderId.mockResolvedValue(null);

		const result = await service.getThreads(GRANT, "drafts");

		expect(result).toEqual([]);
		expect(mockRepo.listThreads).not.toHaveBeenCalled();
	});

	it("maps a provider error to EMAIL_FETCH_FAILED", async () => {
		mockRepo.resolveFolderId.mockRejectedValue(new Error("429"));

		const err = await service.getThreads(GRANT, "inbox").catch((e) => e);

		expect(err).toBeInstanceOf(AppError);
		expect(err.code).toBe("EMAIL_FETCH_FAILED");
	});
});

describe("service.getThreadDetail", () => {
	it("orders messages oldest-first and sanitizes the HTML body", async () => {
		mockRepo.findThread.mockResolvedValue(thread());
		mockRepo.listThreadMessages.mockResolvedValue([
			{
				id: "m2",
				date: 200,
				from: [{ email: "alice@acme.com", name: "Alice" }],
				to: [{ email: "me@gomail.app" }],
				subject: "Re: Q3",
				body: "<p>second</p><script>alert('xss')</script>",
				snippet: "second",
				unread: false,
			},
			{
				id: "m1",
				date: 100,
				from: [{ email: "me@gomail.app" }],
				to: [{ email: "alice@acme.com" }],
				subject: "Q3",
				body: "<p>first</p>",
				snippet: "first",
				unread: true,
			},
		]);

		const detail = await service.getThreadDetail(GRANT, "t1");

		expect(detail.messages.map((m) => m.id)).toEqual(["m1", "m2"]);
		const second = detail.messages[1];
		expect(second.body).toContain("second");
		expect(second.body).not.toContain("<script>");
		expect(second.body).not.toContain("alert");
	});

	it("maps a provider error to EMAIL_FETCH_FAILED", async () => {
		mockRepo.findThread.mockRejectedValue(new Error("boom"));
		mockRepo.listThreadMessages.mockResolvedValue([]);

		const err = await service.getThreadDetail(GRANT, "t1").catch((e) => e);

		expect(err).toBeInstanceOf(AppError);
		expect(err.code).toBe("EMAIL_FETCH_FAILED");
	});
});
