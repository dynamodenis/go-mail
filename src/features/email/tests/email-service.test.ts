import { AppError } from "@/lib/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the repository so the service is tested without the Nylas client.
vi.mock("../api/repository", () => ({
	listFolders: vi.fn(),
	listThreads: vi.fn(),
	findThread: vi.fn(),
	listThreadMessages: vi.fn(),
	updateThreadFolders: vi.fn(),
}));

import * as repo from "../api/repository";
import * as service from "../api/service";

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

function folder(overrides = {}) {
	return {
		id: "f1",
		name: "INBOX",
		object: "folder",
		grantId: GRANT,
		attributes: ["\\Inbox"],
		unreadCount: 3,
		...overrides,
	};
}

describe("service.getFolders", () => {
	it("classifies and sorts every folder Gmail-style (system first, then labels)", async () => {
		mockRepo.listFolders.mockResolvedValue([
			// A user label (not a system folder) — goes to the labels group.
			folder({ id: "work", name: "Work", attributes: [], systemFolder: false }),
			folder({ id: "sent", name: "[Gmail]/Sent Mail", attributes: ["\\Sent"] }),
			folder({ id: "inbox", name: "INBOX", attributes: ["\\Inbox"] }),
			// A Gmail category label — system, with a prettified name.
			folder({ id: "promos", name: "CATEGORY_PROMOTIONS", attributes: [] }),
			folder({ id: "imp", name: "IMPORTANT", attributes: ["\\Important"] }),
			folder({ id: "apex", name: "Apex", attributes: [], systemFolder: false }),
		]);

		const result = await service.getFolders(GRANT);

		// System folders first in deliberate order (inbox, sent, important, then
		// the category), then user labels alphabetically.
		expect(result.map((f) => f.id)).toEqual([
			"inbox",
			"sent",
			"imp",
			"promos",
			"apex",
			"work",
		]);
		expect(result[0]).toEqual({
			id: "inbox",
			name: "Inbox",
			role: "inbox",
			system: true,
			unreadCount: 3,
		});
		// \Important resolves to the important role with a friendly name.
		expect(result.find((f) => f.id === "imp")).toMatchObject({
			name: "Important",
			role: "important",
			system: true,
		});
		// Gmail's shouty category label is prettified but stays a system folder.
		expect(result.find((f) => f.id === "promos")).toMatchObject({
			name: "Promotions",
			system: true,
		});
		// User labels keep their own name and are flagged as non-system.
		expect(result.find((f) => f.id === "work")).toMatchObject({
			name: "Work",
			role: "custom",
			system: false,
		});
	});

	it("maps a provider error to EMAIL_FETCH_FAILED", async () => {
		mockRepo.listFolders.mockRejectedValue(new Error("429"));

		const err = await service.getFolders(GRANT).catch((e) => e);

		expect(err).toBeInstanceOf(AppError);
		expect(err.code).toBe("EMAIL_FETCH_FAILED");
	});
});

describe("service.getThreads", () => {
	it("maps Nylas threads onto the UI shape", async () => {
		mockRepo.listThreads.mockResolvedValue([thread()]);

		const result = await service.getThreads(GRANT, "FOLDER_INBOX", "inbox");

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

	it("uses the recipient as the preview for the sent role", async () => {
		mockRepo.listThreads.mockResolvedValue([thread()]);

		const [mapped] = await service.getThreads(GRANT, "FOLDER_SENT", "sent");

		expect(mapped.preview).toEqual({ name: "Me", email: "me@gomail.app" });
	});

	it("maps a provider error to EMAIL_FETCH_FAILED", async () => {
		mockRepo.listThreads.mockRejectedValue(new Error("429"));

		const err = await service
			.getThreads(GRANT, "FOLDER_INBOX", "inbox")
			.catch((e) => e);

		expect(err).toBeInstanceOf(AppError);
		expect(err.code).toBe("EMAIL_FETCH_FAILED");
	});
});

describe("service.archiveThread", () => {
	it("drops only the inbox label when the thread has other labels (Gmail)", async () => {
		mockRepo.listFolders.mockResolvedValue([
			folder({ id: "inbox", name: "INBOX", attributes: ["\\Inbox"] }),
			folder({ id: "all", name: "[Gmail]/All Mail", attributes: ["\\All"] }),
		]);
		mockRepo.findThread.mockResolvedValue(
			thread({ folders: ["inbox", "promos"] }),
		);
		mockRepo.updateThreadFolders.mockResolvedValue(thread());

		await service.archiveThread(GRANT, "t1");

		expect(mockRepo.updateThreadFolders).toHaveBeenCalledWith(GRANT, "t1", [
			"promos",
		]);
	});

	it("clears all labels on Gmail when inbox was the only one (All Mail is not assignable)", async () => {
		mockRepo.listFolders.mockResolvedValue([
			folder({ id: "inbox", name: "INBOX", attributes: ["\\Inbox"] }),
			folder({ id: "all", name: "[Gmail]/All Mail", attributes: ["\\All"] }),
		]);
		mockRepo.findThread.mockResolvedValue(thread({ folders: ["inbox"] }));
		mockRepo.updateThreadFolders.mockResolvedValue(thread());

		await service.archiveThread(GRANT, "t1");

		expect(mockRepo.updateThreadFolders).toHaveBeenCalledWith(GRANT, "t1", []);
	});

	it("moves the thread into the archive folder on single-folder providers", async () => {
		mockRepo.listFolders.mockResolvedValue([
			folder({ id: "inbox", name: "Inbox", attributes: ["\\Inbox"] }),
			folder({ id: "arch", name: "Archive", attributes: ["\\Archive"] }),
		]);
		mockRepo.findThread.mockResolvedValue(thread({ folders: ["inbox"] }));
		mockRepo.updateThreadFolders.mockResolvedValue(thread());

		await service.archiveThread(GRANT, "t1");

		expect(mockRepo.updateThreadFolders).toHaveBeenCalledWith(GRANT, "t1", [
			"arch",
		]);
	});

	it("maps a provider error to EMAIL_UPDATE_FAILED", async () => {
		mockRepo.listFolders.mockResolvedValue([]);
		mockRepo.findThread.mockRejectedValue(new Error("500"));

		const err = await service.archiveThread(GRANT, "t1").catch((e) => e);

		expect(err).toBeInstanceOf(AppError);
		expect(err.code).toBe("EMAIL_UPDATE_FAILED");
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
