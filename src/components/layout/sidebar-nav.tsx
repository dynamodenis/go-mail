import { useRouterState } from "@tanstack/react-router";
import { NAV_ITEMS, isSectionActive, navItemHref } from "./nav-items";
import { SidebarNavItem } from "./sidebar-nav-item";

interface SidebarNavProps {
	isCollapsed: boolean;
}

export function SidebarNav({ isCollapsed }: SidebarNavProps) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	return (
		<nav className="space-y-1 px-2">
			{NAV_ITEMS.map((item) => (
				<SidebarNavItem
					key={item.label}
					icon={item.icon}
					label={item.label}
					href={navItemHref(item)}
					isActive={isSectionActive(item, pathname)}
					isCollapsed={isCollapsed}
				/>
			))}
		</nav>
	);
}
