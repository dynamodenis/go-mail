import { beforeEach, describe, expect, it } from "vitest";
import { useSidebarStore } from "./sidebar-store";

const STORAGE_KEY = "gomail-sidebar";

const reset = () =>
	useSidebarStore.setState({ isPinned: false, expandedGroup: null });

describe("useSidebarStore", () => {
	beforeEach(() => {
		localStorage.clear();
		reset();
	});

	it("starts unpinned with no group explicitly selected", () => {
		const s = useSidebarStore.getState();
		expect(s.isPinned).toBe(false);
		expect(s.expandedGroup).toBeNull();
	});

	it("togglePinned flips the pin state", () => {
		useSidebarStore.getState().togglePinned();
		expect(useSidebarStore.getState().isPinned).toBe(true);
		useSidebarStore.getState().togglePinned();
		expect(useSidebarStore.getState().isPinned).toBe(false);
	});

	it("toggleGroup opens a group", () => {
		useSidebarStore.getState().toggleGroup("Email");
		expect(useSidebarStore.getState().expandedGroup).toBe("Email");
	});

	it("toggleGroup on the open group closes it (back to following active route)", () => {
		const { toggleGroup } = useSidebarStore.getState();
		toggleGroup("Email");
		toggleGroup("Email");
		expect(useSidebarStore.getState().expandedGroup).toBeNull();
	});

	it("toggleGroup switches directly between groups (single-open)", () => {
		const { toggleGroup } = useSidebarStore.getState();
		toggleGroup("Email");
		toggleGroup("Reports");
		expect(useSidebarStore.getState().expandedGroup).toBe("Reports");
	});

	it("persists sidebar choices to localStorage", () => {
		const { toggleGroup, togglePinned } = useSidebarStore.getState();
		togglePinned();
		toggleGroup("Email");

		const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
		expect(persisted.state).toMatchObject({
			isPinned: true,
			expandedGroup: "Email",
		});
	});
});
