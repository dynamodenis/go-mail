import { Badge } from "@/components/ui/badge";
import { useCreateCampaignStore } from "@/features/campaigns/api/create-campaign-store";
import { useCollections } from "@/features/collections/api/queries";
import { useTemplates } from "@/features/email-templates/api/queries";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { ReactNode } from "react";

type HealthStatus = "good" | "warning" | "critical";

interface HealthCheck {
	label: string;
	message: string;
	status: HealthStatus;
}

const SPAMMY_WORDS = [
	"free",
	"guaranteed",
	"urgent",
	"act now",
	"limited time",
	"winner",
];

function stripHtml(value: string): string {
	return value
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function hasMergeTag(value: string): boolean {
	return /\{[a-zA-Z0-9_]+\}/.test(value);
}

function buildHealthChecks({
	subject,
	templateBody,
	contactCount,
	scheduledAt,
}: {
	subject: string;
	templateBody: string;
	contactCount: number | null;
	scheduledAt: string | null;
}): HealthCheck[] {
	const cleanSubject = subject.trim();
	const lowerSubject = cleanSubject.toLowerCase();
	const cleanBody = stripHtml(templateBody);
	const hasLink = /href\s*=/.test(templateBody);
	const spammyMatches = SPAMMY_WORDS.filter((word) =>
		lowerSubject.includes(word),
	);

	return [
		cleanSubject.length >= 30 && cleanSubject.length <= 70
			? {
					label: "Subject length",
					message: `${cleanSubject.length} characters`,
					status: "good",
				}
			: {
					label: "Subject length",
					message:
						cleanSubject.length < 30
							? "Could use more context"
							: "May be truncated in inboxes",
					status: "warning",
				},
		hasMergeTag(cleanSubject)
			? {
					label: "Personalization",
					message: "Subject includes a merge tag",
					status: "good",
				}
			: {
					label: "Personalization",
					message: "Consider adding a merge tag",
					status: "warning",
				},
		contactCount && contactCount > 0
			? {
					label: "Audience",
					message: `${contactCount.toLocaleString()} recipients selected`,
					status: "good",
				}
			: {
					label: "Audience",
					message: "No recipients found",
					status: "critical",
				},
		cleanBody.length >= 80
			? {
					label: "Template content",
					message: "Template has enough body copy",
					status: "good",
				}
			: {
					label: "Template content",
					message: "Template looks light",
					status: "warning",
				},
		hasLink
			? {
					label: "Call to action",
					message: "Template includes at least one link",
					status: "good",
				}
			: {
					label: "Call to action",
					message: "No link detected",
					status: "warning",
				},
		spammyMatches.length === 0
			? {
					label: "Deliverability",
					message: "No risky subject terms detected",
					status: "good",
				}
			: {
					label: "Deliverability",
					message: `Review: ${spammyMatches.join(", ")}`,
					status: "warning",
				},
		scheduledAt
			? {
					label: "Send timing",
					message: new Date(scheduledAt).toLocaleString(),
					status: "good",
				}
			: {
					label: "Send timing",
					message: "Saved as draft",
					status: "good",
				},
	];
}

function ReviewRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-start justify-between gap-4 py-2">
			<dt className="text-sm text-muted-foreground">{label}</dt>
			<dd className="text-right text-sm font-medium">{value}</dd>
		</div>
	);
}

function CampaignHealthCheck({ checks }: { checks: HealthCheck[] }) {
	const critical = checks.filter((check) => check.status === "critical").length;
	const warnings = checks.filter((check) => check.status === "warning").length;
	const passed = checks.length - critical - warnings;
	const score = Math.round((passed / checks.length) * 100);

	const badgeClass =
		critical > 0
			? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
			: warnings > 0
				? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
				: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";

	const statusIcon = {
		good: <CheckCircle2 className="size-4 text-emerald-600" />,
		warning: <AlertTriangle className="size-4 text-amber-600" />,
		critical: <XCircle className="size-4 text-red-600" />,
	} satisfies Record<HealthStatus, ReactNode>;

	return (
		<section className="rounded-md border">
			<div className="flex items-center justify-between gap-3 border-b px-4 py-3">
				<div>
					<h3 className="text-sm font-semibold">Campaign health</h3>
					<p className="text-xs text-muted-foreground">
						{passed} of {checks.length} checks passed
					</p>
				</div>
				<Badge variant="outline" className={badgeClass}>
					{score}%
				</Badge>
			</div>
			<div className="divide-y">
				{checks.map((check) => (
					<div
						key={check.label}
						className="flex items-start gap-3 px-4 py-3 text-sm"
					>
						{statusIcon[check.status]}
						<div className="min-w-0">
							<p className="font-medium">{check.label}</p>
							<p className="text-muted-foreground">{check.message}</p>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

export function CampaignReviewStep() {
	// Individual selectors (not one object selector) — under zustand v5 a selector
	// returning a fresh object every call triggers an infinite render loop.
	const name = useCreateCampaignStore((s) => s.name);
	const subject = useCreateCampaignStore((s) => s.subject);
	const templateId = useCreateCampaignStore((s) => s.templateId);
	const collectionId = useCreateCampaignStore((s) => s.collectionId);
	const scheduledAt = useCreateCampaignStore((s) => s.scheduledAt);

	// Both lists are already cached from the earlier steps, so this resolves the
	// selected ids to human-readable names without an extra round trip.
	const { data: templateData } = useTemplates({ page: 1, pageSize: 100 });
	const { data: collectionData } = useCollections({
		search: "",
		page: 1,
		pageSize: 100,
	});

	const templateName =
		templateData?.data.find((t) => t.id === templateId)?.name ?? "—";
	const template = templateData?.data.find((t) => t.id === templateId);
	const collection = collectionData?.data.find((c) => c.id === collectionId);
	const healthChecks = buildHealthChecks({
		subject,
		templateBody: template?.bodyHtml ?? "",
		contactCount: collection?.contactCount ?? null,
		scheduledAt,
	});

	return (
		<div className="space-y-4">
			<CampaignHealthCheck checks={healthChecks} />

			<dl className="divide-y rounded-md border px-4">
				<ReviewRow label="Campaign name" value={name || "—"} />
				<ReviewRow label="Subject line" value={subject || "—"} />
				<ReviewRow label="Template" value={templateName} />
				<ReviewRow
					label="Recipients"
					value={
						collection
							? `${collection.name} (${collection.contactCount} contacts)`
							: "—"
					}
				/>
				<ReviewRow
					label="Send"
					value={
						scheduledAt
							? new Date(scheduledAt).toLocaleString()
							: "Save as draft"
					}
				/>
			</dl>
		</div>
	);
}
