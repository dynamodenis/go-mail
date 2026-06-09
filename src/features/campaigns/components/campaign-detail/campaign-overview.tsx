import { Card, CardContent } from "@/components/ui/card";
import type { CampaignDetail } from "@/features/campaigns/types";
import type { ReactNode } from "react";
import { CampaignStatusBadge } from "../campaigns-table/campaign-status-badge";

function formatDateTime(value: string | null): string {
	if (!value) return "—";
	return new Date(value).toLocaleString();
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex items-start justify-between gap-4 py-3">
			<dt className="text-sm text-muted-foreground">{label}</dt>
			<dd className="text-right text-sm font-medium">{children}</dd>
		</div>
	);
}

interface CampaignOverviewProps {
	campaign: CampaignDetail;
}

export function CampaignOverview({ campaign }: CampaignOverviewProps) {
	return (
		<Card>
			<CardContent className="divide-y py-1">
				<DetailRow label="Status">
					<CampaignStatusBadge status={campaign.status} />
				</DetailRow>
				<DetailRow label="Subject">{campaign.subject}</DetailRow>
				<DetailRow label="Template">{campaign.templateName}</DetailRow>
				<DetailRow label="Recipients">
					{campaign.collectionName ?? "—"}
				</DetailRow>
				<DetailRow label="Scheduled">
					{campaign.scheduledAt
						? formatDateTime(campaign.scheduledAt)
						: "Not scheduled"}
				</DetailRow>
				<DetailRow label="Sent">{formatDateTime(campaign.sentAt)}</DetailRow>
				<DetailRow label="Created">
					{formatDateTime(campaign.createdAt)}
				</DetailRow>
			</CardContent>
		</Card>
	);
}
