import type { Template } from "../types";
import { TemplateCard } from "./template-card";

interface TemplateGridProps {
	templates: Template[];
	onDelete: (id: string) => void;
}

export function TemplateGrid({ templates, onDelete }: TemplateGridProps) {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{templates.map((template) => (
				<TemplateCard
					key={template.id}
					template={template}
					onDelete={onDelete}
				/>
			))}
		</div>
	);
}
