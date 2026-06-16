import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MailOpen } from "lucide-react";
import { useEmailThreadDetail } from "../../api/queries";
import { useEmailUIStore } from "../../api/store";
import { ThreadDetailHeader } from "./thread-detail-header";
import { ThreadMessages } from "./thread-messages";

function EmptyReadingPane() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
			<div className="flex size-10 items-center justify-center rounded-xl border bg-muted/40 text-muted-foreground">
				<MailOpen className="size-4" />
			</div>
			<div className="flex flex-col gap-1">
				<p className="font-medium text-foreground text-sm">
					No thread selected
				</p>
				<p className="text-muted-foreground text-xs">
					Pick a message from the list to read it here.
				</p>
			</div>
		</div>
	);
}

function MessagesSkeleton() {
	return (
		<div className="flex flex-col gap-3 p-4" aria-hidden="true">
			{Array.from({ length: 2 }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
				<Skeleton key={i} className="h-16 w-full" />
			))}
		</div>
	);
}

interface ThreadDetailPanelProps {
	className?: string;
}

export function ThreadDetailPanel({ className }: ThreadDetailPanelProps) {
	const activeThread = useEmailUIStore(
		(s) => s.previewThread ?? s.selectedThread,
	);
	const { data: detail, isLoading } = useEmailThreadDetail(
		activeThread?.id ?? null,
	);

	return (
		<div
			className={cn(
				"flex flex-col overflow-hidden rounded-md border bg-card",
				className,
			)}
		>
			{!activeThread ? (
				<EmptyReadingPane />
			) : (
				<div className="min-h-0 flex-1 overflow-y-auto">
					<ThreadDetailHeader participants={activeThread.participants} />

					<div className="p-4">
						<h2 className="font-semibold text-base">{activeThread.subject}</h2>
					</div>

					{isLoading || !detail ? (
						<MessagesSkeleton />
					) : (
						<ThreadMessages messages={detail.messages} />
					)}
				</div>
			)}
		</div>
	);
}
