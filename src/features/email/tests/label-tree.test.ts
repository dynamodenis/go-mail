import { describe, expect, it } from "vitest";
import type { EmailFolderItem } from "../types";
import { buildLabelTree, nodeContainsFolder } from "../utils/label-tree";

function label(id: string, name: string): EmailFolderItem {
	return { id, name, role: "custom", system: false, unreadCount: 0 };
}

describe("buildLabelTree", () => {
	it("nests labels by their path separator and shows leaf names", () => {
		const tree = buildLabelTree([
			label("orbiter", "[Orbiter.io]"),
			label("done", "[Orbiter.io]/Done"),
			label("snoozed", "[Orbiter.io]/Snoozed"),
			label("info", "info@prismmedia.co.ke"),
		]);

		// Roots sorted alphabetically: "[Orbiter.io]" before "info@…".
		expect(tree.map((n) => n.label)).toEqual([
			"[Orbiter.io]",
			"info@prismmedia.co.ke",
		]);

		const orbiter = tree[0];
		expect(orbiter.folder?.id).toBe("orbiter");
		expect(orbiter.children.map((c) => c.label)).toEqual(["Done", "Snoozed"]);
		expect(orbiter.children[0].folder?.id).toBe("done");
	});

	it("creates an implicit, non-navigable parent when no folder backs the path", () => {
		const tree = buildLabelTree([label("done", "Clients/Acme")]);

		expect(tree).toHaveLength(1);
		expect(tree[0].label).toBe("Clients");
		expect(tree[0].folder).toBeUndefined(); // implicit parent
		expect(tree[0].children[0]).toMatchObject({ label: "Acme" });
		expect(tree[0].children[0].folder?.id).toBe("done");
	});

	it("nodeContainsFolder finds a descendant by id", () => {
		const [root] = buildLabelTree([label("done", "Clients/Acme")]);
		expect(nodeContainsFolder(root, "done")).toBe(true);
		expect(nodeContainsFolder(root, "missing")).toBe(false);
	});
});
