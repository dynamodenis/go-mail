import { useRouteContext, useRouterState } from "@tanstack/react-router";
import {
	BarChart3,
	Calendar,
	FileText,
	Inbox,
	LayoutDashboard,
	type LucideIcon,
	Mail,
	PlusCircle,
	Send,
	Settings,
	ShieldCheck,
	ScrollText,
	TrendingUp,
	Library,
	Users,
	UserCog,
	UsersRound,
	Plug,
	ActivitySquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RouteInfo {
	title: string;
	icon: LucideIcon;
}

const ROUTE_MAP: Record<string, RouteInfo> = {
	"/dashboard": { title: "Dashboard", icon: LayoutDashboard },
	"/email/inbox": { title: "Inbox", icon: Inbox },
	"/email/sent": { title: "Sent", icon: Send },
	"/email/drafts": { title: "Drafts", icon: FileText },
	"/calendar": { title: "Calendar", icon: Calendar },
	"/campaigns": { title: "Campaigns", icon: Send },
	"/campaigns/new": { title: "Create Campaign", icon: PlusCircle },
	"/outreach-composer/email-templates": { title: "Email Templates", icon: FileText },
	"/outreach-composer/email-composer": { title: "Email Composer", icon: PlusCircle },
	"/contacts": { title: "Contacts", icon: Users },
	"/contacts/collections": { title: "Collections", icon: Library },
	"/reports": { title: "Reports", icon: BarChart3 },
	"/reports/deliverability": { title: "Deliverability", icon: ActivitySquare },
	"/reports/engagement": { title: "Engagement", icon: TrendingUp },
	"/reports/growth": { title: "Growth", icon: UsersRound },
	"/settings/account": { title: "Account", icon: UserCog },
	"/settings/team": { title: "Team", icon: UsersRound },
	"/settings/integrations": { title: "Integrations", icon: Plug },
	"/settings/compliance": { title: "Compliance", icon: ShieldCheck },
	"/settings/logs": { title: "Logs", icon: ScrollText },
};

const SEGMENT_ICONS: Record<string, LucideIcon> = {
	dashboard: LayoutDashboard,
	email: Mail,
	calendar: Calendar,
	campaigns: Send,
	templates: FileText,
	contacts: Users,
	reports: BarChart3,
	settings: Settings,
};

function getRouteInfo(pathname: string): RouteInfo {
	return ROUTE_MAP[pathname] ?? { title: "Page", icon: LayoutDashboard };
}

interface Breadcrumb {
	label: string;
	icon?: LucideIcon;
}

function getBreadcrumbs(pathname: string): Breadcrumb[] {
	const segments = pathname.split("/").filter(Boolean);
	return segments.map((seg) => ({
		label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
		icon: SEGMENT_ICONS[seg],
	}));
}

interface TopBarProps {
	className?: string;
}

export function TopBar({ className }: TopBarProps) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { user } = useRouteContext({ from: "/_authenticated" });
	const { title, icon: PageIcon } = getRouteInfo(pathname);
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
				<div className="flex items-center gap-2">
					<PageIcon className="h-5 w-5 text-muted-foreground" />
					<h1 className="text-lg font-semibold">{title}</h1>
				</div>
				<div className="flex items-center gap-1 text-xs text-muted-foreground">
					{breadcrumbs.map((crumb, i) => (
						<span key={crumb.label} className="flex items-center gap-1">
							{i > 0 && <span className="text-muted-foreground/50">/</span>}
							{/* {crumb.icon && (
								<crumb.icon className="h-3 w-3" />
							)} */}
							<span>{crumb.label}</span>
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
