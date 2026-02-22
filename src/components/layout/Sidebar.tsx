import { useRouter, useRouteContext } from "@tanstack/react-router";
import { LogOut, Mail, Moon, PanelLeft, PanelLeftClose, Sun } from "lucide-react";
import { signOutFn } from "@/features/auth/api/auth-fns";
import { useMutation } from "@/hooks/use-mutation";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/theme-provider";
import { SidebarNav } from "./SidebarNav";

interface SidebarProps {
	isCollapsed: boolean;
	onToggle: () => void;
}

const THEME_CYCLE: Array<"light" | "dark" | "system"> = [
	"light",
	"dark",
	"system",
];

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
	const router = useRouter();
	const { user } = useRouteContext({ from: "/_authenticated" });
	const { theme, setTheme } = useTheme();

	const cycleTheme = () => {
		const currentIndex = THEME_CYCLE.indexOf(theme);
		const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
		setTheme(THEME_CYCLE[nextIndex]);
	};

	const signOutMutation = useMutation({
		fn: signOutFn,
		onSuccess: async () => {
			await router.invalidate();
			router.navigate({ to: "/" });
		},
	});

	return (
		<aside
			className={cn(
				"flex h-screen flex-col border-r bg-card transition-all duration-200",
				isCollapsed ? "w-16" : "w-64",
			)}
		>
			{/* Logo */}
			<div className="flex h-14 items-center border-b px-4">
				<Mail className="h-6 w-6 shrink-0 text-primary" />
				{!isCollapsed && (
					<span className="ml-2 text-lg font-bold">GoMail</span>
				)}
			</div>

			{/* Navigation */}
			<div className="flex-1 overflow-y-auto py-4">
				<SidebarNav isCollapsed={isCollapsed} />
			</div>

			{/* User section */}
			<div className="border-t p-3">
				{!isCollapsed && user && (
					<div className="mb-2 truncate px-2 text-xs text-muted-foreground">
						{user.email}
					</div>
				)}
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() =>
							signOutMutation.mutate({ data: undefined })
						}
						disabled={signOutMutation.status === "pending"}
						className={cn(
							"flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
							isCollapsed && "w-10 justify-center",
						)}
						title="Sign out"
					>
						<LogOut className="h-4 w-4 shrink-0" />
						{!isCollapsed && <span>Sign out</span>}
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

			{/* Collapse toggle */}
			<div className="border-t p-2">
				<button
					type="button"
					onClick={onToggle}
					className="flex w-full items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
				>
					{isCollapsed ? (
						<PanelLeft className="h-4 w-4" />
					) : (
						<PanelLeftClose className="h-4 w-4" />
					)}
				</button>
			</div>
		</aside>
	);
}
