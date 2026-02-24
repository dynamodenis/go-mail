import { useRouterState } from "@tanstack/react-router";
import {
	ActivitySquare,
	BarChart3,
	Calendar,
	FileText,
	Inbox,
	LayoutDashboard,
	Library,
	type LucideIcon,
	Mail,
	Plug,
	PlusCircle,
	ScrollText,
	Send,
	Settings,
	ShieldCheck,
	TrendingUp,
	UserCog,
	Users,
	UsersRound,
} from "lucide-react";
import { SidebarNavItem } from "./SidebarNavItem";

interface NavItem {
	icon: LucideIcon;
	label: string;
	href?: string;
	children?: { icon: LucideIcon; label: string; href: string }[];
}

const NAV_ITEMS: NavItem[] = [
	{
		icon: LayoutDashboard,
		label: "Dashboard",
		href: "/dashboard",
	},
	{
		icon: Mail,
		label: "Email",
		children: [
			{ icon: Inbox, label: "Inbox", href: "/email/inbox" },
			{ icon: Send, label: "Sent", href: "/email/sent" },
			{ icon: FileText, label: "Drafts", href: "/email/drafts" },
		],
	},
	{
		icon: Calendar,
		label: "Calendar",
		href: "/calendar",
	},
	{
		icon: Send,
		label: "Campaigns",
		children: [
			{ icon: Send, label: "All Campaigns", href: "/campaigns" },
			{ icon: PlusCircle, label: "Create New", href: "/campaigns/new" },
		],
	},
	{
		icon: FileText,
		label: "Templates",
		href: "/templates",
	},
	{
		icon: Users,
		label: "Contacts",
		children: [
			{ icon: Users, label: "All Contacts", href: "/contacts" },
			{ icon: Library, label: "Collections", href: "/contacts/collections" },
		],
	},
	{
		icon: BarChart3,
		label: "Reports",
		children: [
			{ icon: BarChart3, label: "Overview", href: "/reports" },
			{ icon: ActivitySquare, label: "Deliverability", href: "/reports/deliverability" },
			{ icon: TrendingUp, label: "Engagement", href: "/reports/engagement" },
			{ icon: UsersRound, label: "Growth", href: "/reports/growth" },
		],
	},
	{
		icon: Settings,
		label: "Settings",
		children: [
			{ icon: UserCog, label: "Account", href: "/settings/account" },
			{ icon: UsersRound, label: "Team", href: "/settings/team" },
			{ icon: Plug, label: "Integrations", href: "/settings/integrations" },
			{ icon: ShieldCheck, label: "Compliance", href: "/settings/compliance" },
			{ icon: ScrollText, label: "Logs", href: "/settings/logs" },
		],
	},
];

interface SidebarNavProps {
	isCollapsed: boolean;
}

export function SidebarNav({ isCollapsed }: SidebarNavProps) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	return (
		<nav className="space-y-1 px-2">
			{NAV_ITEMS.map((item) => {
				const isActive = item.href
					? pathname === item.href
					: !!item.children?.some((child) => pathname.startsWith(child.href));

				return (
					<SidebarNavItem
						key={item.label}
						icon={item.icon}
						label={item.label}
						href={item.href}
						isActive={isActive}
						isCollapsed={isCollapsed}
						children={item.children}
					/>
				);
			})}
		</nav>
	);
}
