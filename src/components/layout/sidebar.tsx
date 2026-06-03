import { signOutFn } from "@/features/auth/api/auth-fns";
import { authKeys } from "@/features/auth/api/queries";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMutation } from "@/hooks/use-mutation";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/theme-provider";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import {
	LogOut,
	Mail,
	Moon,
	PanelLeft,
	PanelLeftClose,
	Sun,
} from "lucide-react";
import { type FocusEvent, useState } from "react";
import { SidebarNav } from "./sidebar-nav";
import { useSidebarStore } from "./sidebar-store";

const THEME_CYCLE: Array<"light" | "dark" | "system"> = [
	"light",
	"dark",
	"system",
];

const RAIL_WIDTH = "w-16";
const PANEL_WIDTH = "w-60";
const LABEL_TRANSITION =
	"overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-200 ease-out";

export function Sidebar() {
	const router = useRouter();
	const user = useCurrentUser();
	const { theme, setTheme } = useTheme();

	// Pin state is persisted (survives reload); see sidebar-store.
	const isPinned = useSidebarStore((s) => s.isPinned);
	const onTogglePin = useSidebarStore((s) => s.togglePinned);

	// Hover drives expansion when not pinned. `expanded` is the visual state;
	// `isCollapsed` (its inverse) is what the nav/labels key off.
	const [isHovered, setIsHovered] = useState(false);
	const expanded = isPinned || isHovered;
	const isCollapsed = !expanded;
	const isOverlay = expanded && !isPinned;

	const closeWhenFocusLeaves = (event: FocusEvent<HTMLElement>) => {
		if (!event.currentTarget.contains(event.relatedTarget)) {
			setIsHovered(false);
		}
	};

	const cycleTheme = () => {
		const currentIndex = THEME_CYCLE.indexOf(theme);
		const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
		setTheme(THEME_CYCLE[nextIndex]);
	};

	const queryClient = useQueryClient();

	const signOutMutation = useMutation({
		fn: signOutFn,
		onSuccess: async () => {
			queryClient.setQueryData(authKeys.user, null);
			await router.invalidate();
			router.navigate({ to: "/sign-in" });
		},
	});

	return (
		// Spacer: this is what occupies space in the flex row. It only ever
		// reserves the rail width unless pinned, so hover-expansion never reflows
		// the page — the panel below grows as an absolute overlay on top of it.
		<div
			className={cn(
				"relative h-screen shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
				isPinned ? PANEL_WIDTH : RAIL_WIDTH,
			)}
		>
			<aside
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				onFocusCapture={() => setIsHovered(true)}
				onBlurCapture={closeWhenFocusLeaves}
				onPointerDown={() => setIsHovered(true)}
				className={cn(
					"absolute inset-y-0 left-0 z-40 flex h-screen flex-col border-r bg-card transition-[width,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
					expanded ? PANEL_WIDTH : RAIL_WIDTH,
					// Lift the panel above content while it's floating over it.
					isOverlay && "shadow-xl",
				)}
			>
				{/* Logo */}
				<div className="flex h-14 items-center border-b px-4">
					<Mail className="h-6 w-6 shrink-0 text-primary" />
					<span
						className={cn(
							"ml-2 truncate text-lg font-bold",
							LABEL_TRANSITION,
							isCollapsed
								? "max-w-0 -translate-x-1 opacity-0"
								: "max-w-40 translate-x-0 opacity-100",
						)}
					>
						{APP_NAME}
					</span>
				</div>

				{/* Navigation — min-h-0 lets this flex child shrink below its content
				    height so overflow-y-auto actually scrolls instead of pushing the
				    footer off-screen. */}
				<div className="min-h-0 flex-1 overflow-y-auto py-4">
					<SidebarNav isCollapsed={isCollapsed} />
				</div>

				{/* User section */}
				<div className="border-t p-3">
					{user && (
						<div
							className={cn(
								"mb-2 truncate px-2 text-xs text-muted-foreground",
								LABEL_TRANSITION,
								isCollapsed
									? "max-w-0 -translate-x-1 opacity-0"
									: "max-w-52 translate-x-0 opacity-100",
							)}
						>
							{user.email}
						</div>
					)}
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => signOutMutation.mutate({ data: undefined })}
							disabled={signOutMutation.status === "pending"}
							className={cn(
								"flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
								isCollapsed && "w-10 justify-center",
							)}
							title="Sign out"
						>
							<LogOut className="h-4 w-4 shrink-0" />
							<span
								className={cn(
									LABEL_TRANSITION,
									isCollapsed
										? "max-w-0 -translate-x-1 opacity-0"
										: "max-w-20 translate-x-0 opacity-100",
								)}
							>
								Sign out
							</span>
						</button>
						<button
							type="button"
							onClick={cycleTheme}
							className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							title={`Theme: ${theme}`}
						>
							{theme === "dark" ? (
								<Moon className="h-4 w-4" />
							) : (
								<Sun className="h-4 w-4" />
							)}
						</button>
					</div>
				</div>

				{/* Pin toggle — lock the sidebar open (reserves width) or release it
				    back to a hover-expand rail. */}
				<div className="border-t p-2">
					<button
						type="button"
						onClick={onTogglePin}
						className={cn(
							"flex items-center gap-2 rounded-md p-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
							isCollapsed ? "w-10 justify-center" : "w-full",
						)}
						title={isPinned ? "Unpin sidebar" : "Pin sidebar open"}
					>
						{isPinned ? (
							<PanelLeftClose className="h-4 w-4 shrink-0" />
						) : (
							<PanelLeft className="h-4 w-4 shrink-0" />
						)}
						<span
							className={cn(
								LABEL_TRANSITION,
								isCollapsed
									? "max-w-0 -translate-x-1 opacity-0"
									: "max-w-24 translate-x-0 opacity-100",
							)}
						>
							{isPinned ? "Unpin" : "Pin open"}
						</span>
					</button>
				</div>
			</aside>
		</div>
	);
}
