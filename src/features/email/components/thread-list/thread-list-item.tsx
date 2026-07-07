import { cn } from "@/lib/utils";
import { Check, Mail, MailOpen, Paperclip, Star, Trash2 } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import type { EmailThread } from "../../types";
import { formatThreadDate, participantLabel } from "../../utils/email-format";
import { ThreadListItemReminder } from "./thread-list-item-reminder";

interface ThreadListItemProps {
	thread: EmailThread;
	isActive: boolean;
	onSelect: () => void;
	onPreview: () => void;
	/** Row hover-action callbacks. Optional + stubbed for now — the buttons
	 *  render and stay keyboard-accessible regardless of whether the email
	 *  mutations are wired up yet. */
	onToggleRead?: () => void;
	onToggleStar?: () => void;
	/** Superhuman-style "Done" — archives the thread (removes it from the inbox). */
	onDone?: () => void;
	onDelete?: () => void;
	/** Called with the time the thread should resurface in the inbox. */
	onSchedule?: (date: Date) => void;
}

/** A single hover-revealed action on a thread row. Stops click propagation so
 *  triggering the action never also opens the thread behind it. */
function RowAction({
	label,
	onClick,
	children,
	className,
}: {
	label: string;
	onClick?: () => void;
	children: ReactNode;
	className?: string;
}) {
	return (
		<button
			type="button"
			aria-label={label}
			title={label}
			onClick={(e: MouseEvent) => {
				e.stopPropagation();
				onClick?.();
			}}
			className={cn(
				"flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted-foreground/15 hover:text-foreground",
				className,
			)}
		>
			{children}
		</button>
	);
}

export function ThreadListItem({
	thread,
	isActive,
	onSelect,
	onPreview,
	onToggleRead,
	onToggleStar,
	onDone,
	onDelete,
	onSchedule,
}: ThreadListItemProps) {
	// The action toolbar is a sibling of the row button (not a child) so we never
	// nest buttons; it's positioned over the trailing date slot and revealed on
	// hover / keyboard focus within the row.
	return (
		<div className="group relative">
			<button
				type="button"
				onClick={onSelect}
				onFocus={onPreview}
				onMouseEnter={onPreview}
				className={cn(
					"flex w-full items-center gap-3 border-l-2 border-transparent px-4 py-2.5 text-left transition-colors hover:bg-muted/60",
					isActive && "border-l-primary bg-muted",
				)}
			>
				{/* Star / unread indicator */}
				<span className="flex w-3 shrink-0 justify-center">
					{thread.starred ? (
						<Star className="size-3 fill-yellow-400 text-yellow-400" />
					) : thread.unread ? (
						<span className="size-1.5 rounded-full bg-primary" />
					) : null}
				</span>

				{/* Sender / recipient — fixed width */}
				<span
					className={cn(
						"w-[140px] shrink-0 truncate text-sm",
						thread.unread ? "font-semibold text-foreground" : "text-foreground",
					)}
				>
					{participantLabel(thread.preview)}
				</span>

				{/* Subject + snippet */}
				<span className="flex min-w-0 flex-1 items-baseline gap-2">
					<span
						className={cn(
							"max-w-[50%] shrink-0 truncate text-sm",
							thread.unread ? "font-medium text-foreground" : "text-foreground",
						)}
					>
						{thread.subject}
					</span>
					<span className="min-w-0 truncate text-muted-foreground text-sm">
						{thread.snippet}
					</span>
				</span>

				{/* Attachment + date — hidden on hover to make room for the toolbar. */}
				<span className="flex w-[64px] shrink-0 items-center justify-end gap-1.5 text-muted-foreground text-xs group-focus-within:invisible group-hover:invisible">
					{thread.hasAttachments && <Paperclip className="size-3.5" />}
					<span className="tabular-nums">{formatThreadDate(thread.date)}</span>
				</span>
			</button>

			{/* Hover/focus action toolbar, overlaid on the date slot. */}
			<span className="-translate-y-1/2 absolute top-1/2 right-3 hidden items-center gap-0.5 group-focus-within:flex group-hover:flex">
				<RowAction
					label="Done"
					onClick={onDone}
					className="hover:bg-green-500/15 hover:text-green-500"
				>
					<Check className="size-3.5" />
				</RowAction>
				<RowAction
					label={thread.unread ? "Mark as read" : "Mark as unread"}
					onClick={onToggleRead}
				>
					{thread.unread ? (
						<MailOpen className="size-3.5" />
					) : (
						<Mail className="size-3.5" />
					)}
				</RowAction>
				<RowAction
					label={thread.starred ? "Remove star" : "Star"}
					onClick={onToggleStar}
					className={cn(thread.starred && "text-yellow-400")}
				>
					<Star
						className={cn(
							"size-3.5",
							thread.starred && "fill-yellow-400 text-yellow-400",
						)}
					/>
				</RowAction>
				<ThreadListItemReminder onSetReminder={(date) => onSchedule?.(date)} />
				<RowAction
					label="Delete"
					onClick={onDelete}
					className="hover:bg-destructive/15 hover:text-destructive"
				>
					<Trash2 className="size-3.5" />
				</RowAction>
			</span>
		</div>
	);
}
