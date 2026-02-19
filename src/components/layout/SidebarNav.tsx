import { useRouterState } from "@tanstack/react-router";
import {
	BarChart3,
	Calendar,
	FileText,
	LayoutDashboard,
	type LucideIcon,
	Mail,
	Send,
	Settings,
	Users,
} from "lucide-react";
import { SidebarNavItem } from "./SidebarNavItem";

interface NavItem {
	icon: LucideIcon;
	label: string;
	href?: string;
	children?: { label: string; href: string }[];
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
			{ label: "Inbox", href: "/email/inbox" },
			{ label: "Sent", href: "/email/sent" },
			{ label: "Drafts", href: "/email/drafts" },
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
			{ label: "All Campaigns", href: "/campaigns" },
			{ label: "Create New", href: "/campaigns/new" },
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
			{ label: "All Contacts", href: "/contacts" },
			{ label: "Collections", href: "/contacts/collections" },
		],
	},
	{
		icon: BarChart3,
		label: "Reports",
		children: [
			{ label: "Overview", href: "/reports" },
			{ label: "Deliverability", href: "/reports/deliverability" },
			{ label: "Engagement", href: "/reports/engagement" },
			{ label: "Growth", href: "/reports/growth" },
		],
	},
	{
		icon: Settings,
		label: "Settings",
		children: [
			{ label: "Account", href: "/settings/account" },
			{ label: "Team", href: "/settings/team" },
			{ label: "Integrations", href: "/settings/integrations" },
			{ label: "Compliance", href: "/settings/compliance" },
			{ label: "Logs", href: "/settings/logs" },
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
						children={item.children as { label: string; href: string }[]}
					/>
				);
			})}
		</nav>
	);
}
