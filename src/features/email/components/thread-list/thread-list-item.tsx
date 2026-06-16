import { cn } from "@/lib/utils";
import { Paperclip, Star } from "lucide-react";
import type { EmailThread } from "../../types";
import { formatThreadDate, participantLabel } from "../../utils/email-format";

interface ThreadListItemProps {
	thread: EmailThread;
	isActive: boolean;
	onSelect: () => void;
	onPreview: () => void;
}

export function ThreadListItem({
	thread,
	isActive,
	onSelect,
	onPreview,
}: ThreadListItemProps) {
	return (
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

			{/* Attachment + date */}
			<span className="flex w-[64px] shrink-0 items-center justify-end gap-1.5 text-muted-foreground text-xs">
				{thread.hasAttachments && <Paperclip className="size-3.5" />}
				<span className="tabular-nums">{formatThreadDate(thread.date)}</span>
			</span>
		</button>
	);
}
