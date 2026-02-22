import { Link } from "@tanstack/react-router";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SubItem {
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

export function SidebarNavItem({
	icon: Icon,
	label,
	href,
	isActive,
	isCollapsed,
	children,
}: SidebarNavItemProps) {
	const [isExpanded, setIsExpanded] = useState(isActive && !!children);
	const hasChildren = children && children.length > 0;

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
								: "text-muted-foreground hover:bg-muted hover:text-foreground",
						)}
						title={label}
					>
						<Icon className="h-5 w-5" />
					</Link>
				) : (
					<button
						type="button"
						className={cn(
							"flex h-10 w-10 items-center justify-center rounded-md transition-colors",
							isActive
								? "bg-primary/10 text-primary"
								: "text-muted-foreground hover:bg-muted hover:text-foreground",
						)}
						title={label}
					>
						<Icon className="h-5 w-5" />
					</button>
				)}
				{hasChildren && (
					<div className="absolute left-full top-0 z-50 ml-2 hidden w-40 rounded-md border bg-popover p-1 shadow-md group-hover:block">
						<p className="px-2 py-1 text-xs font-medium text-muted-foreground">
							{label}
						</p>
						{children.map((child) => (
							<Link
								key={child.href}
								to={child.href}
								className="block rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
							>
								{child.label}
							</Link>
						))}
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
					onClick={() => setIsExpanded(!isExpanded)}
					className={cn(
						"flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
						isActive
							? "bg-primary/10 text-primary"
							: "text-muted-foreground hover:bg-muted hover:text-foreground",
					)}
				>
					<Icon className="h-5 w-5 shrink-0" />
					<span className="flex-1 text-left">{label}</span>
					<ChevronDown
						className={cn(
							"h-4 w-4 shrink-0 transition-transform",
							isExpanded && "rotate-180",
						)}
					/>
				</button>
				{isExpanded && (
					<div className="ml-4 mt-1 space-y-1 border-l pl-4">
						{children.map((child) => (
							<Link
								key={child.href}
								to={child.href}
								className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-primary/10 [&.active]:text-primary"
							>
								{child.label}
							</Link>
						))}
					</div>
				)}
			</div>
		);
	}

	return (
		<Link
			to={href!}
			className={cn(
				"flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
				isActive
					? "bg-primary/10 text-primary"
					: "text-muted-foreground hover:bg-muted hover:text-foreground",
			)}
		>
			<Icon className="h-5 w-5 shrink-0" />
			<span>{label}</span>
		</Link>
	);
}
