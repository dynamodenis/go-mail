import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Small icon button used in the compose header and footer. */
export function ComposeIconButton({
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
			onClick={onClick}
			className={cn(
				"flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
				className,
			)}
		>
			{children}
		</button>
	);
}
