import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { CampaignStatus } from "@/features/campaigns/types";
import { Search } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";

const ALL_STATUSES = "ALL";

interface CampaignsToolbarProps {
	search: string;
	status: CampaignStatus | undefined;
	onFilterChange: (filters: {
		search?: string;
		status?: CampaignStatus | undefined;
	}) => void;
}

export function CampaignsToolbar({
	search,
	status,
	onFilterChange,
}: CampaignsToolbarProps) {
	const [localSearch, setLocalSearch] = useState(search);
	const deferredSearch = useDeferredValue(localSearch);

	useEffect(() => {
		if (deferredSearch !== search) {
			onFilterChange({ search: deferredSearch });
		}
	}, [deferredSearch, search, onFilterChange]);

	return (
		<div className="flex items-center gap-3">
			<div className="relative flex-1 max-w-sm">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Search campaigns..."
					value={localSearch}
					onChange={(e) => setLocalSearch(e.target.value)}
					className="pl-9 text-sm placeholder:text-sm"
				/>
			</div>
			<Select
				value={status ?? ALL_STATUSES}
				onValueChange={(value) =>
					onFilterChange({
						status:
							value === ALL_STATUSES ? undefined : (value as CampaignStatus),
					})
				}
			>
				<SelectTrigger className="w-[160px] text-sm">
					<SelectValue placeholder="All statuses" />
				</SelectTrigger>
				<SelectContent className="text-sm">
					<SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
					<SelectItem value="DRAFT">Draft</SelectItem>
					<SelectItem value="SCHEDULED">Scheduled</SelectItem>
					<SelectItem value="SENDING">Sending</SelectItem>
					<SelectItem value="SENT">Sent</SelectItem>
					<SelectItem value="PAUSED">Paused</SelectItem>
					<SelectItem value="CANCELLED">Cancelled</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
