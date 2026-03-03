import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";

interface CollectionsToolbarProps {
	search: string;
	onSearchChange: (search: string) => void;
}

export function CollectionsToolbar({
	search,
	onSearchChange,
}: CollectionsToolbarProps) {
	const [localSearch, setLocalSearch] = useState(search);
	const deferredSearch = useDeferredValue(localSearch);

	useEffect(() => {
		if (deferredSearch !== search) {
			onSearchChange(deferredSearch);
		}
	}, [deferredSearch, search, onSearchChange]);

	return (
		<div className="relative flex-1 max-w-sm">
			<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				placeholder="Search collections..."
				value={localSearch}
				onChange={(e) => setLocalSearch(e.target.value)}
				className="pl-9"
			/>
		</div>
	);
}
