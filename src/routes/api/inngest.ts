import { createFileRoute } from "@tanstack/react-router";
import { serve } from "inngest/edge";
import { inngest } from "@/lib/inngest";
import { functions } from "@/features/email-schedule/inngest/functions";

const inngestHandler = serve({ client: inngest, functions });

export const Route = createFileRoute("/api/inngest")({
	server: {
		handlers: {
			GET: ({ request }) => inngestHandler(request),
			POST: ({ request }) => inngestHandler(request),
			PUT: ({ request }) => inngestHandler(request),
		},
	},
});
