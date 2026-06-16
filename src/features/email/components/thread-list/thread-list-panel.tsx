import { cn } from "@/lib/utils";
import type { EmailFolder } from "../../types";
import { ThreadList } from "./thread-list";
import { ThreadListSearch } from "./thread-list-search";

interface ThreadListPanelProps {
	folder: EmailFolder;
	className?: string;
}

export function ThreadListPanel({ folder, className }: ThreadListPanelProps) {
	return (
		<div
			className={cn(
				"flex flex-col overflow-hidden rounded-md border bg-card",
				className,
			)}
		>
			<div className="flex shrink-0 items-center border-b p-2">
				<ThreadListSearch />
			</div>
			<div className="min-h-0 flex-1">
				<ThreadList folder={folder} />
			</div>
		</div>
	);
}
