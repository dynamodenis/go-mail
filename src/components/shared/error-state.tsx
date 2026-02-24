import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
	message?: string;
	onRetry?: () => void;
	className?: string;
}

export function ErrorState({
	message = "Something went wrong. Please try again.",
	onRetry,
	className,
}: ErrorStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-4 py-12",
				className,
			)}
			role="alert"
		>
			<AlertCircle className="h-10 w-10 text-destructive" />
			<p className="max-w-md text-center text-sm text-muted-foreground">
				{message}
			</p>
			{onRetry && (
				<Button variant="outline" size="sm" onClick={onRetry}>
					Try Again
				</Button>
			)}
		</div>
	);
}
