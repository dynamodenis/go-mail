import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/lib/errors";

// Mock the repository (no DB) and the Nylas lib (no network).
vi.mock("../api/repository", () => ({
	findNylasSettings: vi.fn(),
	upsertNylasGrant: vi.fn(),
	clearNylasGrant: vi.fn(),
}));

vi.mock("@/lib/nylas", () => ({
	isNylasConfigured: vi.fn(),
	exchangeCodeForGrant: vi.fn(),
}));

import * as service from "../api/service";
import * as repo from "../api/repository";
import { isNylasConfigured, exchangeCodeForGrant } from "@/lib/nylas";

const mockRepo = repo as unknown as {
	findNylasSettings: ReturnType<typeof vi.fn>;
	upsertNylasGrant: ReturnType<typeof vi.fn>;
	clearNylasGrant: ReturnType<typeof vi.fn>;
};
const mockConfigured = isNylasConfigured as unknown as ReturnType<typeof vi.fn>;
const mockExchange = exchangeCodeForGrant as unknown as ReturnType<
	typeof vi.fn
>;

const USER_ID = "user-123";

beforeEach(() => {
	vi.clearAllMocks();
	mockConfigured.mockReturnValue(true);
});

describe("service.getNylasConnection", () => {
	it("reports connected with email when a grant exists", async () => {
		mockRepo.findNylasSettings.mockResolvedValue({
			nylasGrantId: "grant-1",
			nylasEmail: "a@b.com",
		});

		const result = await service.getNylasConnection(USER_ID);

		expect(result).toEqual({
			configured: true,
			connected: true,
			email: "a@b.com",
		});
	});

	it("reports not connected when there is no settings row", async () => {
		mockRepo.findNylasSettings.mockResolvedValue(null);

		const result = await service.getNylasConnection(USER_ID);

		expect(result).toEqual({
			configured: true,
			connected: false,
			email: null,
		});
	});

	it("reflects configured=false when env is missing", async () => {
		mockConfigured.mockReturnValue(false);
		mockRepo.findNylasSettings.mockResolvedValue(null);

		const result = await service.getNylasConnection(USER_ID);

		expect(result.configured).toBe(false);
	});
});

describe("service.connectNylas", () => {
	it("exchanges the code and persists the grant", async () => {
		mockExchange.mockResolvedValue({ grantId: "grant-9", email: "x@y.com" });

		const result = await service.connectNylas(USER_ID, "auth-code");

		expect(mockExchange).toHaveBeenCalledWith("auth-code");
		expect(mockRepo.upsertNylasGrant).toHaveBeenCalledWith(USER_ID, {
			grantId: "grant-9",
			email: "x@y.com",
		});
		expect(result).toEqual({
			configured: true,
			connected: true,
			email: "x@y.com",
		});
	});

	it("throws NYLAS_NOT_CONFIGURED and never exchanges when env is missing", async () => {
		mockConfigured.mockReturnValue(false);

		await expect(service.connectNylas(USER_ID, "code")).rejects.toMatchObject({
			code: "NYLAS_NOT_CONFIGURED",
		});
		expect(mockExchange).not.toHaveBeenCalled();
		expect(mockRepo.upsertNylasGrant).not.toHaveBeenCalled();
	});

	it("maps an exchange failure to NYLAS_CONNECT_FAILED and stores nothing", async () => {
		mockExchange.mockRejectedValue(new Error("NYLAS_EXCHANGE_FAILED"));

		const err = await service
			.connectNylas(USER_ID, "code")
			.catch((e) => e);

		expect(err).toBeInstanceOf(AppError);
		expect(err.code).toBe("NYLAS_CONNECT_FAILED");
		expect(mockRepo.upsertNylasGrant).not.toHaveBeenCalled();
	});
});

describe("service.disconnectNylas", () => {
	it("clears the grant and returns a disconnected status", async () => {
		const result = await service.disconnectNylas(USER_ID);

		expect(mockRepo.clearNylasGrant).toHaveBeenCalledWith(USER_ID);
		expect(result).toEqual({
			configured: true,
			connected: false,
			email: null,
		});
	});
});
