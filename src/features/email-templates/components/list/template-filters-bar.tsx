import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	templateCategorySchema,
	TEMPLATE_CATEGORY_LABELS,
	type TemplateCategory,
} from "../../types";
import { useTemplatesUIStore } from "../../api/store";

const DEBOUNCE_MS = 300;

export function TemplateFiltersBar() {
	const { searchQuery, selectedCategory, setSearchQuery, setSelectedCategory } =
		useTemplatesUIStore();
	const [localSearch, setLocalSearch] = useState(searchQuery);
	const categories = templateCategorySchema.options;

	useEffect(() => {
		const timer = setTimeout(() => {
			setSearchQuery(localSearch);
		}, DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [localSearch, setSearchQuery]);

	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
			<div className="relative flex-1">
				<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Search templates..."
					value={localSearch}
					onChange={(e) => setLocalSearch(e.target.value)}
					className="pl-9"
				/>
			</div>
			<Select
				value={selectedCategory ?? "ALL"}
				onValueChange={(val) =>
					setSelectedCategory(
						val === "ALL" ? null : (val as TemplateCategory),
					)
				}
			>
				<SelectTrigger className="w-full sm:w-[180px]">
					<SelectValue placeholder="All Categories" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="ALL">All Categories</SelectItem>
					{categories.map((cat) => (
						<SelectItem key={cat} value={cat}>
							{TEMPLATE_CATEGORY_LABELS[cat]}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
