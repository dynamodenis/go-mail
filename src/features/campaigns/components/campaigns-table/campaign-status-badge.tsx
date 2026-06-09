import { Badge } from "@/components/ui/badge";
import type { CampaignStatus } from "@/features/campaigns/types";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
	CampaignStatus,
	{ label: string; className: string }
> = {
	DRAFT: {
		label: "Draft",
		className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
	},
	SCHEDULED: {
		label: "Scheduled",
		className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
	},
	SENDING: {
		label: "Sending",
		className:
			"bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
	},
	SENT: {
		label: "Sent",
		className:
			"bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
	},
	PAUSED: {
		label: "Paused",
		className:
			"bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
	},
	CANCELLED: {
		label: "Cancelled",
		className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
	},
};

interface CampaignStatusBadgeProps {
	status: CampaignStatus;
}

export function CampaignStatusBadge({ status }: CampaignStatusBadgeProps) {
	const config = STATUS_CONFIG[status];
	return (
		<Badge variant="outline" className={cn("border-0", config.className)}>
			{config.label}
		</Badge>
	);
}
