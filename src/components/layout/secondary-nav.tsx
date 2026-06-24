import { EmailFolderNav } from "@/features/email/components/email-folder-nav";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { getActiveChild, getActiveSection } from "./nav-items";

// The contextual sub-navigation shown beside the icon rail. It renders for
// sections that have children (Outreach Composer, Contacts, Reports, Settings)
// and for the Email section, whose folders are fetched live from Nylas.
// Single-page sections (Dashboard, Calendar, Campaigns) render nothing, leaving
// the content full-width.
export function SecondaryNav() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const section = getActiveSection(pathname);

	const isDynamic = section?.dynamic === "email-folders";
	if (!section || (!isDynamic && !section.children?.length)) return null;

	const activeChild = getActiveChild(section, pathname);

	return (
		<aside className="hidden h-screen w-56 shrink-0 flex-col border-r bg-card md:flex">
			{/* Section title — h-14 matches the TopBar so the borders line up. */}
			<div className="flex h-14 items-center border-b px-4">
				<h2 className="truncate text-base font-semibold">{section.label}</h2>
			</div>
			<nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
				{isDynamic ? (
					<EmailFolderNav />
				) : (
					section.children?.map((child) => {
						const ChildIcon = child.icon;
						const isActive = activeChild?.href === child.href;
						return (
							<Link
								key={child.href}
								to={child.href}
								className={cn(
									"flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
									isActive
										? "bg-primary/10 text-primary"
										: "text-muted-foreground hover:bg-muted hover:text-foreground",
								)}
							>
								{ChildIcon && <ChildIcon className="h-4 w-4 shrink-0" />}
								{child.label}
							</Link>
						);
					})
				)}
			</nav>
		</aside>
	);
}
