/// <reference types="vite/client" />
import type { QueryClient } from "@tanstack/react-query";
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import {
	HeadContent,
	Link,
	Outlet,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { fetchUser } from "@/features/auth/api/auth-fns";
import type { User } from "@/features/auth/schemas/auth";
import { ThemeProvider } from "@/providers/theme-provider";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import appCss from "@/styles/app.css?url";

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
	beforeLoad: async () => {
		const user = await fetchUser();
		return { user };
	},
	component: RootComponent,
	shellComponent: RootDocument,
	notFoundComponent: NotFound,
});

function RootComponent() {
	return (
		<>
			<Outlet />
			{/* <ClientOnly fallback={null}>
				<ReactQueryDevtools buttonPosition="bottom-right" />
			</ClientOnly> */}
		</>
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
