import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/calendar")({
	component: CalendarPage,
});

function CalendarPage() {
	return (
		<div>
			<h1 className="text-2xl font-bold">Calendar</h1>
			<p className="mt-2 text-muted-foreground">This page is under construction.</p>
		</div>
	);
}
