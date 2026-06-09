import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Campaign } from "@/features/campaigns/types";
import { useNavigate } from "@tanstack/react-router";
import { Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { useCampaignsUIStore } from "../../api/store";

interface CampaignRowActionsProps {
	campaign: Campaign;
}

export function CampaignRowActions({ campaign }: CampaignRowActionsProps) {
	const navigate = useNavigate();
	const openDeleteDialog = useCampaignsUIStore((s) => s.openDeleteDialog);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="h-8 w-8 text-sm">
					<MoreHorizontal className="size-4" />
					<span className="sr-only">Open actions</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem
					onClick={() =>
						navigate({
							to: "/campaigns/$campaignId",
							params: { campaignId: campaign.id },
						})
					}
					className="text-sm"
				>
					<Eye className="size-4" />
					View
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					variant="destructive"
					onClick={() => openDeleteDialog(campaign.id)}
					className="text-sm"
				>
					<Trash2 className="size-4" />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
