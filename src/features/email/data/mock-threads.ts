import type { EmailFolder } from "../types";
import type { EmailThread, EmailThreadDetail } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON MOCK DATA — placeholder content so the inbox UI is usable before the
// Nylas integration is wired. Replace the getters below (and the query hooks in
// api/queries.ts) with Nylas-backed server functions. Nothing else in the UI
// needs to change — it only knows the EmailThread / EmailThreadDetail shapes.
// ─────────────────────────────────────────────────────────────────────────────

// Relative ISO timestamps would drift across reloads/tests; use fixed dates so
// the skeleton renders identically every time.
const D = (s: string) => new Date(s).toISOString();

const THREADS: Record<EmailFolder, EmailThread[]> = {
	inbox: [
		{
			id: "t1",
			subject: "Q3 roadmap review",
			snippet: "Sharing the deck ahead of Thursday — let me know your thoughts on the prioritization.",
			unread: true,
			starred: false,
			hasAttachments: true,
			preview: { name: "Maya Patel", email: "maya@acme.com" },
			participants: [
				{ name: "Maya Patel", email: "maya@acme.com" },
				{ name: "You", email: "me@gomail.app" },
			],
			date: D("2026-06-09T08:42:00"),
			messageCount: 3,
		},
		{
			id: "t2",
			subject: "Re: Contract renewal",
			snippet: "Thanks for the quick turnaround. We're good to proceed with the annual plan.",
			unread: true,
			starred: true,
			hasAttachments: false,
			preview: { name: "Daniel Osei", email: "daniel@northwind.io" },
			participants: [
				{ name: "Daniel Osei", email: "daniel@northwind.io" },
				{ name: "You", email: "me@gomail.app" },
			],
			date: D("2026-06-09T07:15:00"),
			messageCount: 5,
		},
		{
			id: "t3",
			subject: "Design system handoff",
			snippet: "Components are published to the shared library. Tokens doc is linked inside.",
			unread: false,
			starred: false,
			hasAttachments: false,
			preview: { name: "Lena Fischer", email: "lena@studio.design" },
			participants: [{ name: "Lena Fischer", email: "lena@studio.design" }],
			date: D("2026-06-08T16:30:00"),
			messageCount: 1,
		},
		{
			id: "t4",
			subject: "Weekly metrics",
			snippet: "Open rate up 4.2% week over week. Full breakdown attached.",
			unread: false,
			starred: false,
			hasAttachments: true,
			preview: { name: "Analytics Bot", email: "reports@gomail.app" },
			participants: [{ name: "Analytics Bot", email: "reports@gomail.app" }],
			date: D("2026-06-06T09:00:00"),
			messageCount: 1,
		},
	],
	sent: [
		{
			id: "s1",
			subject: "Intro: Sarah <> Tom",
			snippet: "Connecting you both — Sarah leads partnerships, Tom runs our API team.",
			unread: false,
			starred: false,
			hasAttachments: false,
			preview: { name: "Sarah Lin", email: "sarah@acme.com" },
			participants: [{ name: "Sarah Lin", email: "sarah@acme.com" }],
			date: D("2026-06-09T06:05:00"),
			messageCount: 1,
		},
		{
			id: "s2",
			subject: "Follow-up on demo",
			snippet: "Great chatting today — here are the resources I mentioned.",
			unread: false,
			starred: false,
			hasAttachments: true,
			preview: { name: "Priya Nair", email: "priya@vendor.co" },
			participants: [{ name: "Priya Nair", email: "priya@vendor.co" }],
			date: D("2026-06-08T11:20:00"),
			messageCount: 2,
		},
	],
	drafts: [
		{
			id: "d1",
			subject: "Re: Pricing question",
			snippet: "Hi — wanted to circle back on the volume discount we discussed…",
			unread: false,
			starred: false,
			hasAttachments: false,
			preview: { name: "Greg Hall", email: "greg@bigco.com" },
			participants: [{ name: "Greg Hall", email: "greg@bigco.com" }],
			date: D("2026-06-09T05:40:00"),
			messageCount: 1,
		},
	],
};

const DETAILS: Record<string, EmailThreadDetail> = {
	t1: {
		id: "t1",
		subject: "Q3 roadmap review",
		participants: THREADS.inbox[0].participants,
		messages: [
			{
				id: "t1-m1",
				from: { name: "Maya Patel", email: "maya@acme.com" },
				to: [{ name: "You", email: "me@gomail.app" }],
				subject: "Q3 roadmap review",
				snippet: "Sharing the deck ahead of Thursday…",
				body: "Hi,\n\nSharing the deck ahead of Thursday — let me know your thoughts on the prioritization. I flagged a few items I think we should pull forward.\n\nBest,\nMaya",
				date: D("2026-06-09T08:42:00"),
				unread: true,
			},
			{
				id: "t1-m2",
				from: { name: "You", email: "me@gomail.app" },
				to: [{ name: "Maya Patel", email: "maya@acme.com" }],
				subject: "Re: Q3 roadmap review",
				snippet: "Looks solid. One concern on the timeline…",
				body: "Looks solid overall. One concern on the timeline for the migration work — can we discuss capacity on Thursday?",
				date: D("2026-06-09T09:05:00"),
				unread: false,
			},
		],
	},
};

function buildFallbackDetail(thread: EmailThread): EmailThreadDetail {
	return {
		id: thread.id,
		subject: thread.subject,
		participants: thread.participants,
		messages: [
			{
				id: `${thread.id}-m1`,
				from: thread.preview,
				to: [{ name: "You", email: "me@gomail.app" }],
				subject: thread.subject,
				snippet: thread.snippet,
				body: thread.snippet,
				date: thread.date,
				unread: thread.unread,
			},
		],
	};
}

export function getMockThreads(
	folder: EmailFolder,
	search?: string,
): EmailThread[] {
	const all = THREADS[folder] ?? [];
	if (!search) return all;
	const q = search.toLowerCase();
	return all.filter(
		(t) =>
			t.subject.toLowerCase().includes(q) ||
			t.snippet.toLowerCase().includes(q) ||
			t.preview.email.toLowerCase().includes(q) ||
			(t.preview.name?.toLowerCase().includes(q) ?? false),
	);
}

export function getMockThreadDetail(threadId: string): EmailThreadDetail {
	if (DETAILS[threadId]) return DETAILS[threadId];
	const thread = Object.values(THREADS)
		.flat()
		.find((t) => t.id === threadId);
	return thread
		? buildFallbackDetail(thread)
		: { id: threadId, subject: "(no subject)", participants: [], messages: [] };
}
