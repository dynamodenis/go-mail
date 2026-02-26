import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TemplateNameInputProps {
	value: string;
	onChange: (value: string) => void;
}

export function TemplateNameInput({ value, onChange }: TemplateNameInputProps) {
	return (
		<div className="space-y-1.5">
			<Label htmlFor="template-name">Template Name</Label>
			<Input
				id="template-name"
				placeholder="e.g. Welcome Email"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				maxLength={255}
			/>
		</div>
	);
}
