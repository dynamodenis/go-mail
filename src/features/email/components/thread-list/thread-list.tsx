import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ServerError } from "@/lib/server-result";
import { Inbox, Search } from "lucide-react";
import { useDeferredValue } from "react";
import { useEmailThreads } from "../../api/queries";
import { useEmailUIStore } from "../../api/store";
import { EMAIL_CONNECT_CODES, type EmailFolder } from "../../types";
import { EmailNotConnected } from "../email-not-connected";
import { ThreadListItem } from "./thread-list-item";

function ThreadListSkeleton({ count = 8 }: { count?: number }) {
	return (
		<div aria-hidden="true" className="flex flex-col">
			{Array.from({ length: count }).map((_, i) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
					key={i}
					className="flex items-center gap-3 px-4 py-3"
				>
					<Skeleton className="size-1.5 rounded-full" />
					<Skeleton className="h-3 w-[120px]" />
					<Skeleton className="h-3 flex-1" />
					<Skeleton className="h-2.5 w-10" />
				</div>
			))}
		</div>
	);
}

function EmptyState({ searching }: { searching: boolean }) {
	const Icon = searching ? Search : Inbox;
	return (
		<div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
			<div className="flex size-10 items-center justify-center rounded-xl border bg-muted/40 text-muted-foreground">
				<Icon className="size-4" />
			</div>
			<div className="flex flex-col gap-1">
				<p className="font-medium text-foreground text-sm">
					{searching ? "No emails found" : "Inbox zero"}
				</p>
				<p className="text-muted-foreground text-xs">
					{searching
						? "Try a different search."
						: "You're all caught up. New messages will land here."}
				</p>
			</div>
		</div>
	);
}

interface ThreadListProps {
	folder: EmailFolder;
}

export function ThreadList({ folder }: ThreadListProps) {
	const search = useEmailUIStore((s) => s.searchQuery);
	const selectedThread = useEmailUIStore((s) => s.selectedThread);
	const setSelectedThread = useEmailUIStore((s) => s.setSelectedThread);
	const setPreviewThread = useEmailUIStore((s) => s.setPreviewThread);

	const deferredSearch = useDeferredValue(search);
	const { data, isLoading, isError, error, refetch } = useEmailThreads(
		folder,
		deferredSearch || undefined,
	);
	const threads = data ?? [];
	console.log("Email threads ", threads)

	if (isLoading) return <ThreadListSkeleton />;
	if (isError) {
		// "No mailbox connected" is an expected state, not a failure — show a CTA.
		if (error instanceof ServerError && EMAIL_CONNECT_CODES.has(error.code)) {
			return <EmailNotConnected />;
		}
		return (
			<ErrorState
				message="Failed to load emails. Please try again."
				onRetry={() => refetch()}
			/>
		);
	}
	if (threads.length === 0) return <EmptyState searching={!!deferredSearch} />;

	return (
		<div className="flex h-full flex-col divide-y divide-border/60 overflow-y-auto">
			{threads.map((thread) => (
				<ThreadListItem
					key={thread.id}
					thread={thread}
					isActive={selectedThread?.id === thread.id}
					onSelect={() => setSelectedThread(thread)}
					onPreview={() => setPreviewThread(thread)}
				/>
			))}
		</div>
	);
}
