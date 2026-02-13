import { createFileRoute } from "@tanstack/react-router";
import { Mail, Send, Users } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";

export const Route = createFileRoute("/_authed/dashboard")({
	component: DashboardPage,
});

function DashboardPage() {
	const { user } = Route.useRouteContext();

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-3xl font-bold">Welcome back!</h1>
				<p className="mt-1 text-muted-foreground">
					Signed in as {user?.email}
				</p>
			</div>

			<div className="grid gap-6 sm:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Campaigns
						</CardTitle>
						<Send className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">0</div>
						<CardDescription>No campaigns yet</CardDescription>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Contacts
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">0</div>
						<CardDescription>No contacts yet</CardDescription>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Emails Sent
						</CardTitle>
						<Mail className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">0</div>
						<CardDescription>No emails sent yet</CardDescription>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
