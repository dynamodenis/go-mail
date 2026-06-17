import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/lib/errors";

// Mock the repository (no DB) and the Nylas lib (no network).
vi.mock("../api/repository", () => ({
	listNylasAccounts: vi.fn(),
	findNylasAccount: vi.fn(),
	findNylasAccountByEmail: vi.fn(),
	countNylasAccounts: vi.fn(),
	createNylasAccount: vi.fn(),
	updateNylasAccountGrant: vi.fn(),
	deleteNylasAccount: vi.fn(),
	findOldestNylasAccount: vi.fn(),
	setPrimaryNylasAccount: vi.fn(),
}));

vi.mock("@/lib/nylas", () => ({
	isNylasConfigured: vi.fn(),
	exchangeCodeForGrant: vi.fn(),
}));

import * as service from "../api/service";
import * as repo from "../api/repository";
import { isNylasConfigured, exchangeCodeForGrant } from "@/lib/nylas";

const mockRepo = repo as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockConfigured = isNylasConfigured as unknown as ReturnType<typeof vi.fn>;
const mockExchange = exchangeCodeForGrant as unknown as ReturnType<typeof vi.fn>;

const USER_ID = "user-123";
const CREATED = new Date("2026-06-01T00:00:00.000Z");

beforeEach(() => {
	vi.clearAllMocks();
	mockConfigured.mockReturnValue(true);
	// Default: getNylasConnection (called at the end of mutations) sees one account.
	mockRepo.listNylasAccounts.mockResolvedValue([
		{ id: "acc-1", email: "a@b.com", isPrimary: true, createdAt: CREATED },
	]);
});

describe("service.getNylasConnection", () => {
	it("returns the user's accounts with serialized dates", async () => {
		const result = await service.getNylasConnection(USER_ID);

		expect(result).toEqual({
			configured: true,
			accounts: [
				{
					id: "acc-1",
					email: "a@b.com",
					isPrimary: true,
					createdAt: "2026-06-01T00:00:00.000Z",
				},
			],
		});
	});

	it("reports an empty list when nothing is connected", async () => {
		mockRepo.listNylasAccounts.mockResolvedValue([]);

		const result = await service.getNylasConnection(USER_ID);

		expect(result).toEqual({ configured: true, accounts: [] });
	});

	it("reflects configured=false when env is missing", async () => {
		mockConfigured.mockReturnValue(false);
		mockRepo.listNylasAccounts.mockResolvedValue([]);

		const result = await service.getNylasConnection(USER_ID);

		expect(result.configured).toBe(false);
	});
});

describe("service.connectNylas", () => {
	it("creates a primary account for the first mailbox connected", async () => {
		mockExchange.mockResolvedValue({ grantId: "grant-9", email: "x@y.com" });
		mockRepo.findNylasAccountByEmail.mockResolvedValue(null);
		mockRepo.countNylasAccounts.mockResolvedValue(0);

		await service.connectNylas(USER_ID, "auth-code");

		expect(mockExchange).toHaveBeenCalledWith("auth-code");
		expect(mockRepo.createNylasAccount).toHaveBeenCalledWith(USER_ID, {
			grantId: "grant-9",
			email: "x@y.com",
			isPrimary: true,
		});
	});

	it("creates a non-primary account when others already exist", async () => {
		mockExchange.mockResolvedValue({ grantId: "grant-9", email: "x@y.com" });
		mockRepo.findNylasAccountByEmail.mockResolvedValue(null);
		mockRepo.countNylasAccounts.mockResolvedValue(2);

		await service.connectNylas(USER_ID, "auth-code");

		expect(mockRepo.createNylasAccount).toHaveBeenCalledWith(
			USER_ID,
			expect.objectContaining({ isPrimary: false }),
		);
	});

	it("refreshes the grant when reconnecting an existing mailbox", async () => {
		mockExchange.mockResolvedValue({ grantId: "grant-new", email: "x@y.com" });
		mockRepo.findNylasAccountByEmail.mockResolvedValue({
			id: "acc-existing",
			isPrimary: true,
		});

		await service.connectNylas(USER_ID, "auth-code");

		expect(mockRepo.updateNylasAccountGrant).toHaveBeenCalledWith(
			"acc-existing",
			"grant-new",
		);
		expect(mockRepo.createNylasAccount).not.toHaveBeenCalled();
	});

	it("throws NYLAS_NOT_CONFIGURED and never exchanges when env is missing", async () => {
		mockConfigured.mockReturnValue(false);

		await expect(service.connectNylas(USER_ID, "code")).rejects.toMatchObject({
			code: "NYLAS_NOT_CONFIGURED",
		});
		expect(mockExchange).not.toHaveBeenCalled();
		expect(mockRepo.createNylasAccount).not.toHaveBeenCalled();
	});

	it("maps an exchange failure to NYLAS_CONNECT_FAILED and stores nothing", async () => {
		mockExchange.mockRejectedValue(new Error("NYLAS_EXCHANGE_FAILED"));

		const err = await service.connectNylas(USER_ID, "code").catch((e) => e);

		expect(err).toBeInstanceOf(AppError);
		expect(err.code).toBe("NYLAS_CONNECT_FAILED");
		expect(mockRepo.createNylasAccount).not.toHaveBeenCalled();
	});
});

describe("service.disconnectNylas", () => {
	it("deletes the account and promotes the oldest survivor when the primary is removed", async () => {
		mockRepo.findNylasAccount.mockResolvedValue({
			id: "acc-1",
			isPrimary: true,
		});
		mockRepo.findOldestNylasAccount.mockResolvedValue({ id: "acc-2" });

		await service.disconnectNylas(USER_ID, "acc-1");

		expect(mockRepo.deleteNylasAccount).toHaveBeenCalledWith(USER_ID, "acc-1");
		expect(mockRepo.setPrimaryNylasAccount).toHaveBeenCalledWith(
			USER_ID,
			"acc-2",
		);
	});

	it("does not promote anyone when a non-primary account is removed", async () => {
		mockRepo.findNylasAccount.mockResolvedValue({
			id: "acc-2",
			isPrimary: false,
		});

		await service.disconnectNylas(USER_ID, "acc-2");

		expect(mockRepo.deleteNylasAccount).toHaveBeenCalledWith(USER_ID, "acc-2");
		expect(mockRepo.findOldestNylasAccount).not.toHaveBeenCalled();
		expect(mockRepo.setPrimaryNylasAccount).not.toHaveBeenCalled();
	});

	it("does not promote when the removed primary was the last account", async () => {
		mockRepo.findNylasAccount.mockResolvedValue({
			id: "acc-1",
			isPrimary: true,
		});
		mockRepo.findOldestNylasAccount.mockResolvedValue(null);

		await service.disconnectNylas(USER_ID, "acc-1");

		expect(mockRepo.setPrimaryNylasAccount).not.toHaveBeenCalled();
	});

	it("throws NYLAS_ACCOUNT_NOT_FOUND for an unknown account", async () => {
		mockRepo.findNylasAccount.mockResolvedValue(null);

		await expect(
			service.disconnectNylas(USER_ID, "missing"),
		).rejects.toMatchObject({ code: "NYLAS_ACCOUNT_NOT_FOUND" });
		expect(mockRepo.deleteNylasAccount).not.toHaveBeenCalled();
	});
});

describe("service.setPrimaryNylasAccount", () => {
	it("promotes the chosen account", async () => {
		mockRepo.findNylasAccount.mockResolvedValue({
			id: "acc-2",
			isPrimary: false,
		});

		await service.setPrimaryNylasAccount(USER_ID, "acc-2");

		expect(mockRepo.setPrimaryNylasAccount).toHaveBeenCalledWith(
			USER_ID,
			"acc-2",
		);
	});

	it("throws NYLAS_ACCOUNT_NOT_FOUND for an unknown account", async () => {
		mockRepo.findNylasAccount.mockResolvedValue(null);

		await expect(
			service.setPrimaryNylasAccount(USER_ID, "missing"),
		).rejects.toMatchObject({ code: "NYLAS_ACCOUNT_NOT_FOUND" });
		expect(mockRepo.setPrimaryNylasAccount).not.toHaveBeenCalled();
	});
});
