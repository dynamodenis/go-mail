import { describe, expect, it, vi } from "vitest";

// Mock the server module to prevent Prisma/DB initialization on import.
vi.mock("../api/server", () => ({
	getNylasConnection: vi.fn(),
	startNylasConnect: vi.fn(),
	disconnectNylas: vi.fn(),
	setPrimaryNylasAccount: vi.fn(),
}));

import { settingsKeys } from "../api/queries";

describe("settingsKeys", () => {
	it("produces the base key", () => {
		expect(settingsKeys.all).toEqual(["settings"]);
	});

	it("produces the nylas connection key", () => {
		expect(settingsKeys.nylasConnection()).toEqual([
			"settings",
			"nylas-connection",
		]);
	});
});
