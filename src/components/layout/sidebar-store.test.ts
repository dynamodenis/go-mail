import { beforeEach, describe, expect, it } from "vitest";
import { useSidebarStore } from "./sidebar-store";

const STORAGE_KEY = "gomail-sidebar";

const reset = () => useSidebarStore.setState({ isPinned: false });

describe("useSidebarStore", () => {
	beforeEach(() => {
		localStorage.clear();
		reset();
	});

	it("starts unpinned", () => {
		expect(useSidebarStore.getState().isPinned).toBe(false);
	});

	it("togglePinned flips the pin state", () => {
		useSidebarStore.getState().togglePinned();
		expect(useSidebarStore.getState().isPinned).toBe(true);
		useSidebarStore.getState().togglePinned();
		expect(useSidebarStore.getState().isPinned).toBe(false);
	});

	it("persists the pin choice to localStorage", () => {
		useSidebarStore.getState().togglePinned();

		const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
		expect(persisted.state).toMatchObject({ isPinned: true });
	});
});
