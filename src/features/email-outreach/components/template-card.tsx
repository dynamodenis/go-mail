import { Link } from "@tanstack/react-router";
import { Paperclip, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { TEMPLATE_CATEGORY_LABELS, type Template } from "../types";

interface TemplateCardProps {
	template: Template;
	onDelete: (id: string) => void;
}

export function TemplateCard({ template, onDelete }: TemplateCardProps) {
	const categoryLabel =
		TEMPLATE_CATEGORY_LABELS[template.category] ?? template.category;
	const updatedDate = new Date(template.updatedAt).toLocaleDateString();

	return (
		<Card className="flex flex-col">
			<CardHeader className="pb-2">
				<div className="flex items-start justify-between gap-2">
					<span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
						{categoryLabel}
					</span>
					<Button
						variant="ghost"
						size="sm"
						className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
						onClick={() => onDelete(template.id)}
						aria-label={`Delete ${template.name}`}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
				<h3 className="line-clamp-1 text-sm font-semibold">
					{template.name}
				</h3>
			</CardHeader>
			<CardContent className="flex-1 pb-2">
				<p className="line-clamp-2 text-xs text-muted-foreground">
					{template.subject}
				</p>
			</CardContent>
			<CardFooter className="flex items-center justify-between pt-0 text-xs text-muted-foreground">
				<div className="flex items-center gap-2">
					<span>Updated {updatedDate}</span>
					{(template.attachmentCount ?? 0) > 0 && (
						<span className="inline-flex items-center gap-0.5">
							<Paperclip className="h-3 w-3" />
							{template.attachmentCount}
						</span>
					)}
				</div>
				<Link
					to="/outreach-composer/$templateId/edit"
					params={{ templateId: template.id }}
					className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
				>
					<Pencil className="h-3 w-3" />
					Edit
				</Link>
			</CardFooter>
		</Card>
	);
}
