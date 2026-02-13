import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { Header } from "~/components/global/header";

export const Route = createFileRoute("/_authed")({
	beforeLoad: ({ context }) => {
		if (!context.user) {
			throw redirect({ to: "/sign-in" });
		}
	},
	component: AuthedLayout,
});

function AuthedLayout() {
	return (
		<div className="min-h-screen bg-background">
			<Header />
			<main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<Outlet />
			</main>
		</div>
	);
}
