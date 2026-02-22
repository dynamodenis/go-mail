import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: ({ context }) => {
		if (!context.user) {
			throw redirect({ to: "/sign-in" });
		}
	},
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
	return <AppLayout />;
}
