import {
	ActivitySquare,
	BarChart3,
	BookPlus,
	Calendar,
	FileText,
	LayoutDashboard,
	Library,
	type LucideIcon,
	Mail,
	MailPlus,
	Plug,
	ScrollText,
	Send,
	Settings,
	ShieldCheck,
	TrendingUp,
	UserCog,
	Users,
	UsersRound,
} from "lucide-react";

export interface NavChild {
	icon?: LucideIcon;
	label: string;
	href: string;
}

export interface NavItem {
	icon: LucideIcon;
	label: string;
	href?: string;
	children?: NavChild[];
	/** Marks a section whose sub-nav is rendered from live data rather than the
	 *  static `children` list (e.g. the email folder list, fetched from Nylas).
	 *  SecondaryNav renders a dedicated component for these. */
	dynamic?: "email-folders";
}

export const NAV_ITEMS: NavItem[] = [
	{
		icon: LayoutDashboard,
		label: "Dashboard",
		href: "/dashboard",
	},
	{
		icon: Mail,
		label: "Email",
		href: "/email",
		dynamic: "email-folders",
	},
	{
		icon: Calendar,
		label: "Calendar",
		href: "/calendar",
	},
	{
		icon: Send,
		label: "Campaigns",
		href: "/campaigns",
	},
	{
		icon: FileText,
		label: "Outreach Composer",
		children: [
			{
				icon: BookPlus,
				label: "Email Templates",
				href: "/outreach-composer/email-templates",
			},
			{
				icon: MailPlus,
				label: "Outreach Emails",
				href: "/outreach-composer/email-composer",
			},
		],
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
			{
				icon: ActivitySquare,
				label: "Deliverability",
				href: "/reports/deliverability",
			},
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

// The set of route prefixes that belong to a nav item — its own href, or each
// of its children's hrefs.
function targetsOf(item: NavItem): string[] {
	if (item.children?.length) return item.children.map((c) => c.href);
	return item.href ? [item.href] : [];
}

// A path "belongs" to a target if it equals it or is nested beneath it. The
// trailing-slash guard stops "/contacts" from matching "/contacts-archive".
function matches(pathname: string, href: string): boolean {
	return pathname === href || pathname.startsWith(`${href}/`);
}

/** Where a top-level rail item navigates: its own href, or its first child. */
export function navItemHref(item: NavItem): string {
	return item.href ?? item.children?.[0]?.href ?? "/";
}

/** True if the current path falls anywhere within this item's section. */
export function isSectionActive(item: NavItem, pathname: string): boolean {
	return targetsOf(item).some((href) => matches(pathname, href));
}

/** The nav section the current path belongs to, chosen by the most specific
 *  (longest) matching href so nested routes resolve to the right section. */
export function getActiveSection(pathname: string): NavItem | undefined {
	let best: { item: NavItem; len: number } | undefined;
	for (const item of NAV_ITEMS) {
		for (const href of targetsOf(item)) {
			if (matches(pathname, href) && (!best || href.length > best.len)) {
				best = { item, len: href.length };
			}
		}
	}
	return best?.item;
}

/** Within a section, the active child — again by longest matching href so e.g.
 *  /contacts/collections highlights "Collections", not "All Contacts". */
export function getActiveChild(
	item: NavItem,
	pathname: string,
): NavChild | undefined {
	let best: { child: NavChild; len: number } | undefined;
	for (const child of item.children ?? []) {
		if (
			matches(pathname, child.href) &&
			(!best || child.href.length > best.len)
		) {
			best = { child, len: child.href.length };
		}
	}
	return best?.child;
}
