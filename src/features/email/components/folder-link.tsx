import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
	AlertCircle,
	Archive,
	CalendarClock,
	Clock,
	FileText,
	Inbox,
	type LucideIcon,
	Mail,
	MessageSquare,
	Send,
	ShieldAlert,
	Star,
	Tag,
	Trash2,
} from "lucide-react";
import type { FolderRole } from "../types";

/** Icon per folder role; user labels (custom) use a tag. */
export const ROLE_ICON: Record<FolderRole, LucideIcon> = {
	inbox: Inbox,
	starred: Star,
	snoozed: Clock,
	sent: Send,
	drafts: FileText,
	important: AlertCircle,
	unread: Mail,
	scheduled: CalendarClock,
	chats: MessageSquare,
	archive: Archive,
	spam: ShieldAlert,
	trash: Trash2,
	custom: Tag,
};

export function isFolderActive(pathname: string, folderId: string): boolean {
	const href = `/email/${folderId}`;
	return pathname === href || pathname.startsWith(`${href}/`);
}

/** Shared "active vs idle" row styling for both folder links and label toggles. */
export function rowClass(active: boolean, extra?: string): string {
	return cn(
		"flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
		active
			? "bg-primary/10 text-primary"
			: "text-muted-foreground hover:bg-muted hover:text-foreground",
		extra,
	);
}

interface FolderLinkProps {
	folderId: string;
	role: FolderRole;
	/** Display label (the leaf name for nested labels). */
	label: string;
	unreadCount: number;
	active: boolean;
	className?: string;
}

/** A single navigable folder row: role icon, name, and an unread badge. */
export function FolderLink({
	folderId,
	role,
	label,
	unreadCount,
	active,
	className,
}: FolderLinkProps) {
	const Icon = ROLE_ICON[role];
	return (
		<Link
			to="/email/$folderId"
			params={{ folderId }}
			className={rowClass(active, className)}
		>
			<Icon className="h-4 w-4 shrink-0" />
			<span className="min-w-0 flex-1 truncate">{label}</span>
			{unreadCount > 0 && (
				<span className="shrink-0 rounded-full bg-primary/10 px-1.5 text-xs font-semibold text-primary">
					{unreadCount > 99 ? "99+" : unreadCount}
				</span>
			)}
		</Link>
	);
}
