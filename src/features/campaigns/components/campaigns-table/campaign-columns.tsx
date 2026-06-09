import type { Campaign } from "@/features/campaigns/types";
import type { ColumnDef } from "@tanstack/react-table";
import { CampaignRowActions } from "./campaign-row-actions";
import { CampaignStatusBadge } from "./campaign-status-badge";

// Rates are shown as percentages of delivered emails. Guard against divide-by-
// zero for drafts/scheduled campaigns that have no delivered sends yet.
function formatRate(numerator: number, denominator: number): string {
	if (denominator <= 0) return "—";
	return `${Math.round((numerator / denominator) * 100)}%`;
}

function formatDate(value: string | null): string {
	if (!value) return "—";
	return new Date(value).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export const campaignColumns: ColumnDef<Campaign>[] = [
	{
		id: "name",
		header: "Campaign",
		cell: ({ row }) => (
			<div className="flex flex-col">
				<span className="text-sm font-medium">{row.original.name}</span>
				<span className="text-xs text-muted-foreground line-clamp-1">
					{row.original.subject}
				</span>
			</div>
		),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => <CampaignStatusBadge status={row.original.status} />,
	},
	{
		accessorKey: "totalRecipients",
		header: "Recipients",
		cell: ({ row }) => (
			<span className="text-muted-foreground">
				{row.original.totalRecipients.toLocaleString()}
			</span>
		),
	},
	{
		id: "openRate",
		header: "Open rate",
		cell: ({ row }) => (
			<span className="text-muted-foreground">
				{formatRate(row.original.opened, row.original.delivered)}
			</span>
		),
	},
	{
		id: "clickRate",
		header: "Click rate",
		cell: ({ row }) => (
			<span className="text-muted-foreground">
				{formatRate(row.original.clicked, row.original.delivered)}
			</span>
		),
	},
	{
		id: "date",
		header: "Sent / Scheduled",
		cell: ({ row }) => (
			<span className="text-muted-foreground">
				{formatDate(row.original.sentAt ?? row.original.scheduledAt)}
			</span>
		),
	},
	{
		id: "actions",
		header: "",
		cell: ({ row }) => <CampaignRowActions campaign={row.original} />,
		size: 40,
	},
];
