import { Card } from "@/components/ui/card";
import type { CampaignDetail } from "@/features/campaigns/types";

// Rates are a percentage of their base; drafts with no sends show a dash rather
// than "0%" so an unsent campaign reads as "no data" instead of "0 performance".
function formatRate(numerator: number, denominator: number): string {
	if (denominator <= 0) return "—";
	return `${Math.round((numerator / denominator) * 100)}%`;
}

interface CampaignMetricsProps {
	campaign: CampaignDetail;
}

export function CampaignMetrics({ campaign }: CampaignMetricsProps) {
	const items = [
		{ label: "Recipients", value: campaign.totalRecipients.toLocaleString() },
		{ label: "Delivered", value: campaign.delivered.toLocaleString() },
		{
			label: "Open rate",
			value: formatRate(campaign.opened, campaign.delivered),
		},
		{
			label: "Click rate",
			value: formatRate(campaign.clicked, campaign.delivered),
		},
		{
			label: "Bounce rate",
			value: formatRate(campaign.bounced, campaign.totalRecipients),
		},
		{ label: "Unsubscribed", value: campaign.unsubscribed.toLocaleString() },
	];

	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
			{items.map((item) => (
				<Card key={item.label} className="p-3">
					<p className="text-sm text-muted-foreground">{item.label}</p>
					<p className="mt-1 text-xl font-semibold">{item.value}</p>
				</Card>
			))}
		</div>
	);
}
