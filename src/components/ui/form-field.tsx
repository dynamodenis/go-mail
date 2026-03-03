import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
	label: string;
	required?: boolean;
	error?: string;
	children: ReactNode;
	className?: string;
}

export function FormField({ label, required, error, children, className }: FormFieldProps) {
	return (
		<div className={cn("space-y-1.5", className)}>
			<Label className="text-xs">
				{label}
				{required && <span className="ml-1 text-destructive">*</span>}
			</Label>
			{children}
			{error && <p className="text-xs text-destructive">{error}</p>}
		</div>
	);
}
