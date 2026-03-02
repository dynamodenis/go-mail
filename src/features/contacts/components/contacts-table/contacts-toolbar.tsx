import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { ContactStatus } from "../../schemas/types";

const DEBOUNCE_MS = 300;
const ALL_STATUSES = "ALL";

interface ContactsToolbarProps {
	search: string;
	status: ContactStatus | undefined;
	onFilterChange: (filters: {
		search?: string;
		status?: ContactStatus | undefined;
	}) => void;
}

export function ContactsToolbar({
	search,
	status,
	onFilterChange,
}: ContactsToolbarProps) {
	const [localSearch, setLocalSearch] = useState(search);

	useEffect(() => {
		setLocalSearch(search);
	}, [search]);

	useEffect(() => {
		const timer = setTimeout(() => {
			if (localSearch !== search) {
				onFilterChange({ search: localSearch });
			}
		}, DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [localSearch, search, onFilterChange]);

	return (
		<div className="flex items-center gap-3">
			<div className="relative flex-1 max-w-sm">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Search contacts..."
					value={localSearch}
					onChange={(e) => setLocalSearch(e.target.value)}
					className="pl-9"
				/>
			</div>
			<Select
				value={status ?? ALL_STATUSES}
				onValueChange={(value) =>
					onFilterChange({
						status:
							value === ALL_STATUSES ? undefined : (value as ContactStatus),
					})
				}
			>
				<SelectTrigger className="w-[160px]">
					<SelectValue placeholder="All statuses" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
					<SelectItem value="ACTIVE">Active</SelectItem>
					<SelectItem value="UNSUBSCRIBED">Unsubscribed</SelectItem>
					<SelectItem value="BOUNCED">Bounced</SelectItem>
					<SelectItem value="CLEANED">Cleaned</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
