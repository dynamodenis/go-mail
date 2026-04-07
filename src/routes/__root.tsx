/// <reference types="vite/client" />
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
	HeadContent,
	Link,
	Outlet,
	Scripts,
	createRootRouteWithContext,
	useRouteContext,
} from "@tanstack/react-router";
import { lazy, Suspense, type ReactNode } from "react";
import { Toaster } from "sonner";
import { userQueryOptions } from "@/features/auth/api/queries";
import type { User } from "@/features/auth/schemas/auth";
import { ThemeProvider } from "@/providers/theme-provider";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import appCss from "@/styles/app.css?url";

const ReactQueryDevtools = import.meta.env.DEV
	? lazy(() =>
			import("@tanstack/react-query-devtools").then((m) => ({
				default: m.ReactQueryDevtools,
			})),
		)
	: () => null;

const TanStackRouterDevtools = import.meta.env.DEV
	? lazy(() =>
			import("@tanstack/react-router-devtools").then((m) => ({
				default: m.TanStackRouterDevtools,
			})),
		)
	: () => null;

interface RouterContext {
	queryClient: QueryClient;
	user: User | null;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: `${APP_NAME} - Bulk Email Sending` },
			{
				name: "description",
				content: `${APP_DESCRIPTION} using ${APP_NAME}`,
			},
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com",
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
			},
		],
	}),
	beforeLoad: async ({ context }) => {
		try {
			const user =
				await context.queryClient.ensureQueryData(userQueryOptions);
			return { user };
		} catch {
			// If Supabase is unreachable (paused, DNS failure, network error),
			// treat the user as unauthenticated so the app still renders
			// instead of showing a blank crash screen.
			return { user: null };
		}
	},
	component: RootComponent,
	shellComponent: RootDocument,
	notFoundComponent: NotFound,
});

function RootComponent() {
	const { queryClient } = useRouteContext({ from: "__root__" });
	return (
		<QueryClientProvider client={queryClient}>
			<Outlet />
			<Suspense fallback={null}>
				<ReactQueryDevtools buttonPosition="bottom-right" />
				<TanStackRouterDevtools position="bottom-left" />
			</Suspense>
		</QueryClientProvider>
	);
}

function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4">
			<h1 className="text-4xl font-bold">404</h1>
			<p className="text-muted-foreground">
				The page you're looking for doesn't exist.
			</p>
			<div className="flex gap-2">
				<button
					type="button"
					onClick={() => window.history.back()}
					className="rounded-md bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80"
				>
					Go Back
				</button>
				<Link
					to="/"
					className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					Home
				</Link>
			</div>
		</div>
	);
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				<ThemeProvider>
					{children}
				</ThemeProvider>
				<Toaster position="top-right" richColors />
				<Scripts />
			</body>
		</html>
	);
}
