import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useEmailUIStore } from "../../api/store";

export function ThreadListSearch() {
	const query = useEmailUIStore((s) => s.searchQuery);
	const setQuery = useEmailUIStore((s) => s.setSearchQuery);

	return (
		<div className="relative flex-1">
			<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
			<Input
				placeholder="Search emails..."
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				className="h-8 border-none bg-muted pl-9 shadow-none focus-visible:ring-0"
			/>
		</div>
	);
}
