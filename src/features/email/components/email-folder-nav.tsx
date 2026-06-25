import { cn } from "@/lib/utils";
import { useRouterState } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useEmailFolders } from "../api/queries";
import { type EmailFolderItem, PRIMARY_FOLDER_ROLES } from "../types";
import { buildLabelTree } from "../utils/label-tree";
import { FolderLink, isFolderActive, rowClass } from "./folder-link";
import { LabelTree } from "./label-tree";

function FolderNavSkeleton() {
	return (
		<div aria-hidden="true" className="space-y-1">
			{Array.from({ length: 6 }).map((_, i) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
					key={i}
					className="h-9 animate-pulse rounded-md bg-muted/60"
				/>
			))}
		</div>
	);
}

function SystemFolderLink({
	folder,
	pathname,
}: {
	folder: EmailFolderItem;
	pathname: string;
}) {
	return (
		<FolderLink
			folderId={folder.id}
			role={folder.role}
			label={folder.name}
			unreadCount={folder.unreadCount}
			active={isFolderActive(pathname, folder.id)}
		/>
	);
}

/** The email sidebar, laid out Gmail-style:
 *  - the everyday system folders (Inbox, Starred, Snoozed, Sent, Drafts) pinned;
 *  - the rest of the system folders under a collapsible "More";
 *  - the user's own labels in their own section, as a nested, expandable tree.
 *  Renders nothing when the mailbox is disconnected — the connect CTA lives in
 *  the reading pane (EmailNotConnected). */
export function EmailFolderNav() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { data: folders, isLoading, isError } = useEmailFolders();
	// null = "auto" (open when the active folder lives under More); a click pins
	// it to an explicit true/false so the toggle always wins thereafter.
	const [moreOpen, setMoreOpen] = useState<boolean | null>(null);
	const [expandedLabels, setExpandedLabels] = useState<Set<string>>(new Set());

	if (isLoading) return <FolderNavSkeleton />;
	if (isError || !folders?.length) return null;

	const system = folders.filter((f) => f.system);
	const labels = folders.filter((f) => !f.system);
	const primary = system.filter((f) => PRIMARY_FOLDER_ROLES.has(f.role));
	const secondary = system.filter((f) => !PRIMARY_FOLDER_ROLES.has(f.role));
	const labelTree = buildLabelTree(labels);

	const activeFolderId = pathname.match(/^\/email\/([^/]+)$/)?.[1] ?? "";
	// Auto-open while the active folder lives inside "More", unless the user has
	// explicitly toggled it (moreOpen pinned to a boolean).
	const activeInMore = secondary.some((f) => isFolderActive(pathname, f.id));
	const showMore = moreOpen ?? activeInMore;

	const toggleLabel = (key: string) =>
		setExpandedLabels((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});

	return (
		<div className="space-y-1">
			{primary.map((folder) => (
				<SystemFolderLink key={folder.id} folder={folder} pathname={pathname} />
			))}

			{secondary.length > 0 && (
				<>
					<button
						type="button"
						onClick={() => setMoreOpen(!showMore)}
						aria-expanded={showMore}
						className={rowClass(false, "w-full")}
					>
						<ChevronDown
							className={cn(
								"h-4 w-4 shrink-0 transition-transform",
								showMore && "rotate-180",
							)}
						/>
						<span className="flex-1 text-left">
							{showMore ? "Less" : "More"}
						</span>
					</button>

					{showMore &&
						secondary.map((folder) => (
							<SystemFolderLink
								key={folder.id}
								folder={folder}
								pathname={pathname}
							/>
						))}
				</>
			)}

			{labelTree.length > 0 && (
				<div className="pt-3">
					<p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
						Labels
					</p>
					<LabelTree
						nodes={labelTree}
						depth={0}
						pathname={pathname}
						activeFolderId={activeFolderId}
						expandedKeys={expandedLabels}
						onToggle={toggleLabel}
					/>
				</div>
			)}
		</div>
	);
}
