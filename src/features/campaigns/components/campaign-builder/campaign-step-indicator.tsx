import { CAMPAIGN_BUILDER_STEPS } from "@/features/campaigns/api/create-campaign-store";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEP_LABELS: Record<(typeof CAMPAIGN_BUILDER_STEPS)[number], string> = {
	template: "Template & details",
	recipients: "Recipients",
	review: "Review & create",
};

interface CampaignStepIndicatorProps {
	stepIndex: number;
	/** Allows jumping back to an already-visited (completed) step. */
	onStepClick?: (index: number) => void;
}

export function CampaignStepIndicator({
	stepIndex,
	onStepClick,
}: CampaignStepIndicatorProps) {
	return (
		<ol
			className="flex items-center gap-2"
			aria-label="Campaign creation steps"
		>
			{CAMPAIGN_BUILDER_STEPS.map((step, index) => {
				const isComplete = index < stepIndex;
				const isCurrent = index === stepIndex;
				const isReachable = index <= stepIndex;

				return (
					<li key={step} className="flex flex-1 items-center gap-2">
						<button
							type="button"
							disabled={!isReachable}
							onClick={() => onStepClick?.(index)}
							aria-current={isCurrent ? "step" : undefined}
							className={cn(
								"flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium transition-colors",
								isCurrent ? "text-foreground" : "text-muted-foreground",
								isReachable
									? "hover:bg-muted"
									: "cursor-not-allowed opacity-60",
							)}
						>
							<span
								className={cn(
									"flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
									isComplete && "border-primary bg-primary text-primary-foreground",
									isCurrent && "border-primary text-primary",
									!isReachable && "border-muted-foreground/40",
								)}
							>
								{isComplete ? <Check className="h-3 w-3" /> : index + 1}
							</span>
							{STEP_LABELS[step]}
						</button>
						{index < CAMPAIGN_BUILDER_STEPS.length - 1 && (
							<span className="h-px flex-1 bg-border" aria-hidden="true" />
						)}
					</li>
				);
			})}
		</ol>
	);
}
