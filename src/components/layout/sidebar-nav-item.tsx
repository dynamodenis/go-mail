import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

interface SidebarNavItemProps {
	icon: LucideIcon;
	label: string;
	href: string;
	isActive: boolean;
	isCollapsed: boolean;
}

const LABEL_TRANSITION =
	"overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-200 ease-out";

// A single rail entry. Items with children navigate to their section (the
// children themselves live in the contextual second sidebar), so every entry is
// just a link — no inline expansion. The label collapses to zero width on the
// icon rail and grows back when the sidebar expands.
export function SidebarNavItem({
	icon: Icon,
	label,
	href,
	isActive,
	isCollapsed,
}: SidebarNavItemProps) {
	return (
		<Link
			to={href}
			title={label}
			className={cn(
				"flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
				isActive
					? "bg-primary/10 text-primary"
					: "text-muted-foreground hover:text-primary",
			)}
		>
			<Icon className="h-5 w-5 shrink-0" />
			<span
				className={cn(
					LABEL_TRANSITION,
					isCollapsed
						? "max-w-0 -translate-x-1 opacity-0"
						: "max-w-40 translate-x-0 opacity-100",
				)}
			>
				{label}
			</span>
		</Link>
	);
}
