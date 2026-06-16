import type { EmailParticipant } from "../types";

/** Up-to-two-letter initials from a display name or email, for avatar chips. */
export function emailInitials(value: string): string {
	return value
		.split(/[\s@.]+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");
}

/** Best display label for a participant: name if present, else the email. */
export function participantLabel(p: EmailParticipant | undefined): string {
	return p?.name || p?.email || "Unknown";
}

/** Compact, inbox-style relative date: time today, weekday this week, else a
 *  short month/day. */
export function formatThreadDate(iso: string): string {
	const date = new Date(iso);
	const now = new Date();

	if (date.toDateString() === now.toDateString()) {
		return date.toLocaleTimeString(undefined, {
			hour: "numeric",
			minute: "2-digit",
		});
	}

	const diffDays = Math.floor(
		(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
	);
	if (diffDays < 7) {
		return date.toLocaleDateString(undefined, {
			weekday: "short",
			day: "numeric",
		});
	}

	return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Full timestamp for an individual message in the reading pane. */
export function formatMessageDate(iso: string): string {
	return new Date(iso).toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

// Stable avatar palette — index by participant position so colors are
// deterministic per thread.
const AVATAR_COLORS = [
	"bg-rose-500",
	"bg-emerald-500",
	"bg-amber-500",
	"bg-violet-500",
	"bg-sky-500",
	"bg-pink-500",
	"bg-teal-500",
	"bg-orange-500",
];

export function avatarColor(index: number): string {
	return AVATAR_COLORS[index % AVATAR_COLORS.length];
}
