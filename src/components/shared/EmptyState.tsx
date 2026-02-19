import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface EmptyStateProps {
	icon?: LucideIcon;
	title: string;
	description?: string;
	actionLabel?: string;
	onAction?: () => void;
	className?: string;
}

export function EmptyState({
	icon: Icon = Inbox,
	title,
	description,
	actionLabel,
	onAction,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-3 py-12",
				className,
			)}
		>
			<Icon className="h-12 w-12 text-muted-foreground/50" />
			<div className="text-center">
				<h3 className="text-sm font-medium">{title}</h3>
				{description && (
					<p className="mt-1 text-sm text-muted-foreground">{description}</p>
				)}
			</div>
			{actionLabel && onAction && (
				<Button size="sm" onClick={onAction}>
					{actionLabel}
				</Button>
			)}
		</div>
	);
}
