import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

interface FormFieldProps {
	label: string;
	required?: boolean;
	error?: string;
	children: ReactNode;
}

export function FormField({ label, required, error, children }: FormFieldProps) {
	return (
		<div className="space-y-1.5">
			<Label>
				{label}
				{required && <span className="ml-1 text-destructive">*</span>}
			</Label>
			{children}
			{error && <p className="text-sm text-destructive">{error}</p>}
		</div>
	);
}
