import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRecentCampaigns } from "../api/queries";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Megaphone } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
	DRAFT: "bg-muted text-muted-foreground",
	SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
	SENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
	PAUSED: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
	COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
	CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

function StatusBadge({ status }: { status: string }) {
	const style = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT;
	return (
		<span
			className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${style}`}
		>
			{status.charAt(0) + status.slice(1).toLowerCase()}
		</span>
	);
}

export function RecentCampaignsTable() {
	const { data, isLoading, isError, refetch } = useRecentCampaigns();

	const campaigns = data?.data ?? [];

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-base">Recent Campaigns</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading && <LoadingState message="Loading campaigns..." />}
				{isError && (
					<ErrorState
						message="Failed to load recent campaigns."
						onRetry={() => refetch()}
					/>
				)}
				{!isLoading && !isError && campaigns.length === 0 && (
					<EmptyState
						icon={Megaphone}
						title="No campaigns yet"
						description="Create your first campaign to get started."
					/>
				)}
				{!isLoading && !isError && campaigns.length > 0 && (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b text-left text-muted-foreground">
									<th className="pb-2 font-medium">Campaign</th>
									<th className="pb-2 font-medium">Status</th>
									<th className="pb-2 font-medium text-right">Sends</th>
									<th className="pb-2 font-medium text-right">Open %</th>
									<th className="pb-2 font-medium text-right">Click %</th>
								</tr>
							</thead>
							<tbody>
								{campaigns.map((c) => (
									<tr key={c.id} className="border-b last:border-0">
										<td className="py-2.5 font-medium">{c.name}</td>
										<td className="py-2.5">
											<StatusBadge status={c.status} />
										</td>
										<td className="py-2.5 text-right tabular-nums">
											{c.totalSends.toLocaleString()}
										</td>
										<td className="py-2.5 text-right tabular-nums">
											{c.openRate}%
										</td>
										<td className="py-2.5 text-right tabular-nums">
											{c.clickRate}%
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
