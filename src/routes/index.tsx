import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Mail, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

function LandingPage() {
	const { user } = Route.useRouteContext();

	return (
		<div className="min-h-screen bg-background">
			{/* Navigation */}
			<nav className="border-b">
				<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
					<div className="flex items-center gap-2">
						<Mail className="h-6 w-6" />
						<span className="text-xl font-bold">{APP_NAME}</span>
					</div>
					<div className="flex items-center gap-4">
						{user ? (
							<Button asChild>
								<Link to="/dashboard">Dashboard</Link>
							</Button>
						) : (
							<>
								<Button variant="secondary" asChild>
									<Link to="/sign-in">Sign In</Link>
								</Button>
								<Button asChild>
									<Link to="/sign-up">Get Started</Link>
								</Button>
							</>
						)}
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col items-center justify-center py-24 text-center">
					<h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
						Bulk email sending
						<br />
						<span className="text-muted-foreground">made simple</span>
					</h1>
					<p className="mt-6 max-w-2xl text-lg text-muted-foreground">
						Create beautiful email campaigns, manage your contacts, and send
						bulk emails with confidence. {APP_NAME} makes email outreach effortless.
					</p>
					<div className="mt-10 flex gap-4">
						{user ? (
							<Button size="lg" asChild>
								<Link to="/dashboard">
									Go to Dashboard
									<ArrowRight className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						) : (
							<>
								<Button size="lg" asChild>
									<Link to="/sign-up">
										Get Started Free
										<ArrowRight className="ml-2 h-4 w-4" />
									</Link>
								</Button>
								<Button size="lg" variant="outline" asChild>
									<Link to="/sign-in">Sign In</Link>
								</Button>
							</>
						)}
					</div>
				</div>

				{/* Features Section */}
				<div className="grid gap-8 pb-24 sm:grid-cols-3">
					<div className="rounded-lg border bg-card p-6">
						<Send className="mb-4 h-10 w-10 text-muted-foreground" />
						<h3 className="mb-2 text-lg font-semibold">Email Campaigns</h3>
						<p className="text-sm text-muted-foreground">
							Create and send email campaigns to your contact lists with
							customizable templates.
						</p>
					</div>
					<div className="rounded-lg border bg-card p-6">
						<Users className="mb-4 h-10 w-10 text-muted-foreground" />
						<h3 className="mb-2 text-lg font-semibold">Contact Management</h3>
						<p className="text-sm text-muted-foreground">
							Organize your contacts into collections and manage your mailing
							lists effortlessly.
						</p>
					</div>
					<div className="rounded-lg border bg-card p-6">
						<Mail className="mb-4 h-10 w-10 text-muted-foreground" />
						<h3 className="mb-2 text-lg font-semibold">Rich Templates</h3>
						<p className="text-sm text-muted-foreground">
							Design beautiful emails with our rich text editor and reusable
							templates.
						</p>
					</div>
				</div>
			</main>
		</div>
	);
}
