import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
	beforeLoad: ({ context }) => {
		if (context.user) {
			throw redirect({ to: "/dashboard" });
		}
	},
	component: AuthLayout,
});

function AuthLayout() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
			<Outlet />
		</div>
	);
}
