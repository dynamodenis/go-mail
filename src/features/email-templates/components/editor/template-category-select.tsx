import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	templateCategorySchema,
	TEMPLATE_CATEGORY_LABELS,
	type TemplateCategory,
} from "../../types";

interface TemplateCategorySelectProps {
	value: TemplateCategory;
	onChange: (value: TemplateCategory) => void;
}

export function TemplateCategorySelect({
	value,
	onChange,
}: TemplateCategorySelectProps) {
	const categories = templateCategorySchema.options;

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-sm">Category</CardTitle>
			</CardHeader>
			<CardContent>
				<Label htmlFor="template-category" className="sr-only">
					Category
				</Label>
				<Select value={value} onValueChange={onChange}>
					<SelectTrigger id="template-category">
						<SelectValue placeholder="Select category" />
					</SelectTrigger>
					<SelectContent>
						{categories.map((cat) => (
							<SelectItem key={cat} value={cat}>
								{TEMPLATE_CATEGORY_LABELS[cat]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</CardContent>
		</Card>
	);
}
