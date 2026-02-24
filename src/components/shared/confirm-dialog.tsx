import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: "default" | "destructive";
	onConfirm: () => void;
	children?: ReactNode;
}

export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	variant = "default",
	onConfirm,
}: ConfirmDialogProps) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<button
				type="button"
				className="fixed inset-0 bg-black/50"
				onClick={() => onOpenChange(false)}
				aria-label="Close dialog"
			/>
			<div
				className="relative z-50 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
				role="alertdialog"
				aria-labelledby="confirm-dialog-title"
				aria-describedby={description ? "confirm-dialog-desc" : undefined}
			>
				<h2 id="confirm-dialog-title" className="text-lg font-semibold">
					{title}
				</h2>
				{description && (
					<p
						id="confirm-dialog-desc"
						className="mt-2 text-sm text-muted-foreground"
					>
						{description}
					</p>
				)}
				<div className="mt-6 flex justify-end gap-3">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{cancelLabel}
					</Button>
					<Button
						variant={variant === "destructive" ? "destructive" : "default"}
						onClick={() => {
							onConfirm();
							onOpenChange(false);
						}}
					>
						{confirmLabel}
					</Button>
				</div>
			</div>
		</div>
	);
}
