import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TemplateSubjectInputProps {
	value: string;
	onChange: (value: string) => void;
}

export function TemplateSubjectInput({
	value,
	onChange,
}: TemplateSubjectInputProps) {
	return (
		<div className="space-y-1.5">
			<Label htmlFor="template-subject">Subject Line</Label>
			<Input
				id="template-subject"
				placeholder="e.g. Welcome to our platform!"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				maxLength={255}
			/>
			<p className="text-xs text-muted-foreground">
				Use merge tags like {"{first_name}"} to personalize the subject.
			</p>
		</div>
	);
}
