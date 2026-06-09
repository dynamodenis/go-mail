import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useCreateCampaignStore } from "@/features/campaigns/api/create-campaign-store";
import { useCollections } from "@/features/collections/api/queries";
import { Users } from "lucide-react";

const COLLECTION_PAGE_SIZE = 100;

// `datetime-local` inputs expect "YYYY-MM-DDTHH:mm" in local time, but we store
// the schedule as an ISO string (what the API validates). Convert at the edge.
function isoToLocalInput(iso: string | null): string {
	if (!iso) return "";
	const d = new Date(iso);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
		d.getHours(),
	)}:${pad(d.getMinutes())}`;
}

export function CampaignRecipientsStep() {
	const collectionId = useCreateCampaignStore((s) => s.collectionId);
	const scheduledAt = useCreateCampaignStore((s) => s.scheduledAt);
	const setField = useCreateCampaignStore((s) => s.setField);

	const { data, isLoading, isError, refetch } = useCollections({
		search: "",
		page: 1,
		pageSize: COLLECTION_PAGE_SIZE,
	});
	const collections = data?.data ?? [];

	return (
		<div className="space-y-4">
			<FormField label="Recipient collection" required>
				{isLoading ? (
					<LoadingState message="Loading collections..." />
				) : isError ? (
					<ErrorState
						message="Failed to load collections."
						onRetry={() => refetch()}
					/>
				) : collections.length === 0 ? (
					<EmptyState
						icon={Users}
						title="No collections yet"
						description="Group some contacts into a collection first, then target them here."
					/>
				) : (
					<Select
						value={collectionId ?? undefined}
						onValueChange={(value) => setField("collectionId", value)}
					>
						<SelectTrigger>
							<SelectValue placeholder="Choose who receives this campaign" />
						</SelectTrigger>
						<SelectContent>
							{collections.map((collection) => (
								<SelectItem key={collection.id} value={collection.id}>
									{collection.name}
									<span className="ml-2 text-muted-foreground">
										{collection.contactCount} contacts
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			</FormField>

			<FormField label="Schedule send (optional)">
				<Input
					type="datetime-local"
					value={isoToLocalInput(scheduledAt)}
					onChange={(e) => {
						const value = e.target.value;
						setField(
							"scheduledAt",
							value ? new Date(value).toISOString() : null,
						);
					}}
				/>
				<p className="text-sm text-muted-foreground">
					Leave empty to save as a draft you can send later.
				</p>
			</FormField>
		</div>
	);
}
