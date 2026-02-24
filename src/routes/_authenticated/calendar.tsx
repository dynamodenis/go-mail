import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
const Calendar = lazy(() => import("@/features/calendar/components/calendar"));
export const Route = createFileRoute("/_authenticated/calendar")({
	component: CalendarPage,
});

function CalendarPage() {
	return <Calendar />;
}
