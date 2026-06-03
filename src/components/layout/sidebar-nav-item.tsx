import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { useSidebarStore } from "./sidebar-store";

interface SubItem {
	icon?: LucideIcon;
	label: string;
	href: string;
}

interface SidebarNavItemProps {
	icon: LucideIcon;
	label: string;
	href?: string;
	isActive: boolean;
	isCollapsed: boolean;
	children?: SubItem[];
}

const LABEL_TRANSITION =
	"overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-200 ease-out";

// Standard Tailwind sizes — the global 75% root scale (app.css) shrinks these to
// the compact baseline, so the sidebar scales with the rest of the app instead
// of being shrunk a second time with text-xs/py-1.
export function SidebarNavItem({
	icon: Icon,
	label,
	href,
	isActive,
	isCollapsed,
	children,
}: SidebarNavItemProps) {
	// Persist the user's selected group, while always revealing the group that
	// contains the current route so active children cannot be hidden.
	const expandedGroup = useSidebarStore((s) => s.expandedGroup);
	const toggleGroup = useSidebarStore((s) => s.toggleGroup);
	const hasChildren = children && children.length > 0;
	const isExpanded = !!hasChildren && (expandedGroup === label || isActive);

	if (isCollapsed) {
		return (
			<div className="relative group">
				{href && !hasChildren ? (
					<Link
						to={href}
						className={cn(
							"flex h-10 w-10 items-center justify-center rounded-md transition-colors",
							isActive
								? "bg-primary/10 text-primary"
								: "text-muted-foreground hover:text-primary",
						)}
						title={label}
					>
						<Icon className="h-5 w-5" />
					</Link>
				) : (
					<button
						type="button"
						onClick={() => toggleGroup(label)}
						aria-expanded={isExpanded}
						className={cn(
							"flex h-10 w-10 items-center justify-center rounded-md transition-colors",
							isActive
								? "bg-primary/10 text-primary"
								: "text-muted-foreground hover:text-primary",
						)}
						title={label}
					>
						<Icon className="h-5 w-5" />
					</button>
				)}
				{hasChildren && (
					<div className="pointer-events-none absolute left-full top-0 z-50 ml-2 w-40 translate-x-1 rounded-md border bg-popover p-1 opacity-0 shadow-md transition-[opacity,transform] duration-150 ease-out group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-x-0 group-focus-within:opacity-100">
						<p className="px-2 py-1 text-xs font-medium text-muted-foreground">
							{label}
						</p>
						{children.map((child) => {
							const ChildIcon = child.icon;
							return (
								<Link
									key={child.href}
									to={child.href}
									tabIndex={isCollapsed ? -1 : undefined}
									className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:text-primary"
								>
									{ChildIcon && <ChildIcon className="h-3.5 w-3.5 shrink-0" />}
									{child.label}
								</Link>
							);
						})}
					</div>
				)}
			</div>
		);
	}

	if (hasChildren) {
		return (
			<div>
				<button
					type="button"
					onClick={() => toggleGroup(label)}
					aria-expanded={isExpanded}
					className={cn(
						"flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
						isActive
							? "bg-primary/10 text-primary"
							: "text-muted-foreground hover:text-primary",
					)}
				>
					<Icon className="h-5 w-5 shrink-0" />
					<span
						className={cn(
							"flex-1 text-left",
							LABEL_TRANSITION,
							"max-w-40 translate-x-0 opacity-100",
						)}
					>
						{label}
					</span>
					<ChevronDown
						className={cn(
							"h-4 w-4 shrink-0 transition-transform duration-200 ease-out",
							isExpanded && "rotate-180",
						)}
					/>
				</button>
				<div
					aria-hidden={!isExpanded}
					className={cn(
						"grid transition-[grid-template-rows,opacity,transform] duration-200 ease-out",
						isExpanded
							? "grid-rows-[1fr] translate-y-0 opacity-100"
							: "grid-rows-[0fr] -translate-y-1 opacity-0",
					)}
				>
					<div className="min-h-0 overflow-hidden">
						<div className="ml-4 mt-1 space-y-1 border-l pl-4">
							{children.map((child) => {
								const ChildIcon = child.icon;
								return (
									<Link
										key={child.href}
										to={child.href}
										tabIndex={isExpanded ? undefined : -1}
										className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-primary [&.active]:bg-primary/10 [&.active]:text-primary"
									>
										{ChildIcon && <ChildIcon className="h-4 w-4 shrink-0" />}
										{child.label}
									</Link>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<Link
			to={href}
			className={cn(
				"flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
				isActive
					? "bg-primary/10 text-primary"
					: "text-muted-foreground hover:text-primary",
			)}
		>
			<Icon className="h-5 w-5 shrink-0" />
			<span
				className={cn(LABEL_TRANSITION, "max-w-40 translate-x-0 opacity-100")}
			>
				{label}
			</span>
		</Link>
	);
}
