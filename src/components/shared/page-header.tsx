import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
	title: string;
	description?: string;
	actions?: ReactNode;
	className?: string;
}

export function PageHeader({
	title,
	description,
	actions,
	className,
}: PageHeaderProps) {
	return (
		<div
			className={cn(
				"flex items-start justify-between gap-2 pb-2",
				className,
			)}
		>
			<div>
				<h1 className="text-xl font-bold tracking-tight">{title}</h1>
				{description && (
					<p className="mt-1 text-xs text-muted-foreground">{description}</p>
				)}
			</div>
			{actions && <div className="flex shrink-0 gap-2">{actions}</div>}
		</div>
	);
}
