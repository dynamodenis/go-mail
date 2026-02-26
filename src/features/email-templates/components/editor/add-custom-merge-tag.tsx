import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MergeTagDefinition } from "../../types";

interface AddCustomMergeTagProps {
	existingValues: string[];
	onAdd: (tag: MergeTagDefinition) => void;
	onCancel: () => void;
}

function toSnakeCase(str: string): string {
	return str
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_|_$/g, "");
}

export function AddCustomMergeTag({
	existingValues,
	onAdd,
	onCancel,
}: AddCustomMergeTagProps) {
	const [label, setLabel] = useState("");
	const [error, setError] = useState("");

	const tagValue = label.trim() ? `{${toSnakeCase(label)}}` : "";
	const isDuplicate = existingValues.includes(tagValue);

	const handleSubmit = () => {
		if (!label.trim()) {
			setError("Label is required");
			return;
		}
		if (isDuplicate) {
			setError("This tag already exists");
			return;
		}
		onAdd({ label: label.trim(), value: tagValue });
		setLabel("");
		setError("");
	};

	return (
		<div className="flex flex-col gap-2 rounded-md border p-3">
			<div className="space-y-1">
				<Label className="text-xs">Tag Label</Label>
				<Input
					placeholder="e.g. Company Name"
					value={label}
					onChange={(e) => {
						setLabel(e.target.value);
						setError("");
					}}
					className="h-8 text-xs"
				/>
			</div>
			{tagValue && (
				<p className="font-mono text-xs text-muted-foreground">
					Tag: {tagValue}
				</p>
			)}
			{error && <p className="text-xs text-destructive">{error}</p>}
			<div className="flex gap-2">
				<Button size="sm" variant="outline" onClick={onCancel} className="h-7 text-xs">
					Cancel
				</Button>
				<Button size="sm" onClick={handleSubmit} className="h-7 text-xs">
					Add Tag
				</Button>
			</div>
		</div>
	);
}
