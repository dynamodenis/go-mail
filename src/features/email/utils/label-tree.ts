import { type EmailFolderItem, LABEL_PATH_SEPARATOR } from "../types";

/** A node in the user-labels tree. Gmail-style nested labels ("Work/Clients")
 *  become parent→child nodes; a label whose parent path has no folder of its own
 *  gets an implicit, non-navigable parent node. */
export interface LabelNode {
	/** Full path, unique within the tree (e.g. "Work/Clients"). */
	key: string;
	/** Leaf segment shown to the user (e.g. "Clients"). */
	label: string;
	/** The folder at this path, if one exists; absent for implicit parents. */
	folder?: EmailFolderItem;
	children: LabelNode[];
}

/** Builds a nested tree from label folders by splitting each label's full path
 *  on the provider separator. Parents and children are sorted alphabetically. */
export function buildLabelTree(labels: EmailFolderItem[]): LabelNode[] {
	const roots: LabelNode[] = [];
	const byKey = new Map<string, LabelNode>();

	const ensure = (segments: string[]): LabelNode => {
		const key = segments.join(LABEL_PATH_SEPARATOR);
		const existing = byKey.get(key);
		if (existing) return existing;

		const node: LabelNode = {
			key,
			label: segments[segments.length - 1],
			children: [],
		};
		byKey.set(key, node);

		if (segments.length === 1) {
			roots.push(node);
		} else {
			ensure(segments.slice(0, -1)).children.push(node);
		}
		return node;
	};

	for (const label of labels) {
		const segments = label.name
			.split(LABEL_PATH_SEPARATOR)
			.map((s) => s.trim())
			.filter(Boolean);
		if (segments.length) ensure(segments).folder = label;
	}

	const sortRec = (nodes: LabelNode[]) => {
		nodes.sort((a, b) => a.label.localeCompare(b.label));
		for (const n of nodes) sortRec(n.children);
	};
	sortRec(roots);
	return roots;
}

/** True if this node or any descendant maps to the given folder id — used to
 *  keep the path to the active label expanded. */
export function nodeContainsFolder(node: LabelNode, folderId: string): boolean {
	if (node.folder?.id === folderId) return true;
	return node.children.some((c) => nodeContainsFolder(c, folderId));
}
