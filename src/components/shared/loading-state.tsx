import Loader from "@/components/global/loader";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
	message?: string;
	className?: string;
}

export function LoadingState({
	message = "Loading...",
	className,
}: LoadingStateProps) {
	return (
		<output
			className={cn(
				"flex flex-col items-center justify-center gap-3 py-12",
				className,
			)}
			aria-live="polite"
		>
			<Loader size={102} />
			<p className="text-sm text-muted-foreground">{message}</p>
		</output>
	);
}
