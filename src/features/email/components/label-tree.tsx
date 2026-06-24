import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Folder } from "lucide-react";
import { Fragment } from "react";
import type { LabelNode } from "../utils/label-tree";
import { nodeContainsFolder } from "../utils/label-tree";
import { ROLE_ICON, isFolderActive, rowClass } from "./folder-link";

// Indent per nesting depth — clamped so very deep label trees stay readable.
const INDENT = ["pl-0", "pl-3", "pl-6", "pl-9"];
const indentClass = (depth: number) =>
	INDENT[Math.min(depth, INDENT.length - 1)];

interface LabelTreeProps {
	nodes: LabelNode[];
	depth: number;
	pathname: string;
	activeFolderId: string;
	expandedKeys: Set<string>;
	onToggle: (key: string) => void;
}

/** Recursively renders the user-labels tree: a chevron toggles a node with
 *  children, the name navigates to the label (when a real folder backs it). The
 *  path to the active label stays expanded regardless of manual toggles. */
export function LabelTree({
	nodes,
	depth,
	pathname,
	activeFolderId,
	expandedKeys,
	onToggle,
}: LabelTreeProps) {
	return (
		<>
			{nodes.map((node) => {
				const hasChildren = node.children.length > 0;
				const open =
					expandedKeys.has(node.key) ||
					(!!activeFolderId && nodeContainsFolder(node, activeFolderId));
				const Icon = node.folder ? ROLE_ICON[node.folder.role] : Folder;
				const active =
					!!node.folder && isFolderActive(pathname, node.folder.id);

				return (
					<Fragment key={node.key}>
						<div className={cn("flex items-center", indentClass(depth))}>
							{hasChildren ? (
								<button
									type="button"
									onClick={() => onToggle(node.key)}
									aria-expanded={open}
									aria-label={
										open ? `Collapse ${node.label}` : `Expand ${node.label}`
									}
									className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
								>
									<ChevronRight
										className={cn(
											"h-3.5 w-3.5 transition-transform",
											open && "rotate-90",
										)}
									/>
								</button>
							) : (
								<span className="size-5 shrink-0" aria-hidden="true" />
							)}

							{node.folder ? (
								<Link
									to="/email/$folderId"
									params={{ folderId: node.folder.id }}
									className={rowClass(active, "min-w-0 flex-1")}
								>
									<Icon className="h-4 w-4 shrink-0" />
									<span className="min-w-0 flex-1 truncate">{node.label}</span>
									{node.folder.unreadCount > 0 && (
										<span className="shrink-0 rounded-full bg-primary/10 px-1.5 text-xs font-semibold text-primary">
											{node.folder.unreadCount > 99
												? "99+"
												: node.folder.unreadCount}
										</span>
									)}
								</Link>
							) : (
								<button
									type="button"
									onClick={() => onToggle(node.key)}
									className={rowClass(false, "min-w-0 flex-1 text-left")}
								>
									<Icon className="h-4 w-4 shrink-0" />
									<span className="min-w-0 flex-1 truncate">{node.label}</span>
								</button>
							)}
						</div>

						{hasChildren && open && (
							<LabelTree
								nodes={node.children}
								depth={depth + 1}
								pathname={pathname}
								activeFolderId={activeFolderId}
								expandedKeys={expandedKeys}
								onToggle={onToggle}
							/>
						)}
					</Fragment>
				);
			})}
		</>
	);
}
