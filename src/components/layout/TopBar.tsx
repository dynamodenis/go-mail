import { useRouteContext, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const ROUTE_TITLES: Record<string, string> = {
	"/dashboard": "Dashboard",
	"/email/inbox": "Inbox",
	"/email/sent": "Sent",
	"/email/drafts": "Drafts",
	"/calendar": "Calendar",
	"/campaigns": "Campaigns",
	"/campaigns/new": "Create Campaign",
	"/templates": "Templates",
	"/templates/new": "Create Template",
	"/contacts": "Contacts",
	"/contacts/collections": "Collections",
	"/reports": "Reports",
	"/reports/deliverability": "Deliverability",
	"/reports/engagement": "Engagement",
	"/reports/growth": "Growth",
	"/settings/account": "Account",
	"/settings/team": "Team",
	"/settings/integrations": "Integrations",
	"/settings/compliance": "Compliance",
	"/settings/logs": "Logs",
};

function getPageTitle(pathname: string): string {
	return ROUTE_TITLES[pathname] ?? "Page";
}

function getBreadcrumbs(pathname: string): string[] {
	const segments = pathname.split("/").filter(Boolean);
	return segments.map(
		(seg) => seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
	);
}

interface TopBarProps {
	className?: string;
}

export function TopBar({ className }: TopBarProps) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { user } = useRouteContext({ from: "/_authenticated" });
	const title = getPageTitle(pathname);
	const breadcrumbs = getBreadcrumbs(pathname);

	const initial = user?.email?.charAt(0).toUpperCase() ?? "U";

	return (
		<header
			className={cn(
				"flex h-14 items-center justify-between border-b bg-background px-6",
				className,
			)}
		>
			<div>
				<h1 className="text-lg font-semibold">{title}</h1>
				<div className="flex items-center gap-1 text-xs text-muted-foreground">
					{breadcrumbs.map((crumb, i) => (
						<span key={crumb} className="flex items-center gap-1">
							{i > 0 && <span>/</span>}
							<span>{crumb}</span>
						</span>
					))}
				</div>
			</div>
			<div
				className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground"
				title={user?.email ?? "User"}
			>
				{initial}
			</div>
		</header>
	);
}
