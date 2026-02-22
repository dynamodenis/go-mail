import type {
	DateRange,
	DashboardKpiResponse,
	SendsOverTimeDataPoint,
	EngagementTrendDataPoint,
	SendTimeCell,
	CampaignPerformanceItem,
	AudienceGrowthDataPoint,
	DomainBreakdownItem,
	BounceBreakdownItem,
	RecentCampaignItem,
} from "../types";
import * as repo from "./repository";

/** All business logic for the dashboard. No HTTP or auth concerns. */

const TOP_CAMPAIGNS_LIMIT = 10;
const RECENT_CAMPAIGNS_LIMIT = 10;

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDateRangeStart(range: DateRange): Date {
	const now = new Date();
	const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
	return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function getPreviousPeriodStart(range: DateRange): Date {
	const now = new Date();
	const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
	return new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000);
}

function formatDate(d: Date): string {
	return d.toISOString().slice(0, 10);
}

function safeRate(numerator: number, denominator: number): number {
	if (denominator === 0) return 0;
	return Math.round((numerator / denominator) * 10000) / 100;
}

function buildKpiCard(
	label: string,
	current: number,
	previous: number,
	format: "number" | "percent" | "rate",
) {
	const changePercent =
		previous === 0 ? (current > 0 ? 100 : 0) : safeRate(current - previous, previous);
	return { label, value: current, previousValue: previous, changePercent, format };
}

// ─── KPIs ───────────────────────────────────────────────────────────────────

export async function getDashboardKpis(
	userId: string,
	range: DateRange,
): Promise<DashboardKpiResponse> {
	const now = new Date();
	const from = getDateRangeStart(range);
	const prevFrom = getPreviousPeriodStart(range);

	const [current, previous, contactsCurrent, contactsPrevious] = await Promise.all([
		repo.countSendsByStatus(userId, from, now),
		repo.countSendsByStatus(userId, prevFrom, from),
		repo.countContacts(userId),
		repo.countContacts(userId, prevFrom, from),
	]);

	const sumByStatus = (rows: typeof current, ...statuses: string[]) =>
		rows
			.filter((r) => statuses.includes(r.status))
			.reduce((sum, r) => sum + r._count.id, 0);

	const totalCur = sumByStatus(current, "SENT", "DELIVERED", "OPENED", "CLICKED", "BOUNCED", "UNSUBSCRIBED");
	const totalPrev = sumByStatus(previous, "SENT", "DELIVERED", "OPENED", "CLICKED", "BOUNCED", "UNSUBSCRIBED");

	const deliveredCur = sumByStatus(current, "DELIVERED", "OPENED", "CLICKED");
	const deliveredPrev = sumByStatus(previous, "DELIVERED", "OPENED", "CLICKED");

	const openedCur = sumByStatus(current, "OPENED", "CLICKED");
	const openedPrev = sumByStatus(previous, "OPENED", "CLICKED");

	const clickedCur = sumByStatus(current, "CLICKED");
	const clickedPrev = sumByStatus(previous, "CLICKED");

	const bouncedCur = sumByStatus(current, "BOUNCED");
	const bouncedPrev = sumByStatus(previous, "BOUNCED");

	return {
		totalSends: buildKpiCard("Total Sends", totalCur, totalPrev, "number"),
		delivered: buildKpiCard("Delivered", deliveredCur, deliveredPrev, "number"),
		opened: buildKpiCard("Open Rate", safeRate(openedCur, totalCur), safeRate(openedPrev, totalPrev), "rate"),
		clicked: buildKpiCard("Click Rate", safeRate(clickedCur, totalCur), safeRate(clickedPrev, totalPrev), "rate"),
		bounced: buildKpiCard("Bounce Rate", safeRate(bouncedCur, totalCur), safeRate(bouncedPrev, totalPrev), "rate"),
		totalContacts: buildKpiCard("Total Contacts", contactsCurrent, contactsPrevious, "number"),
	};
}

// ─── Sends Over Time ────────────────────────────────────────────────────────

export async function getSendsOverTime(
	userId: string,
	range: DateRange,
): Promise<SendsOverTimeDataPoint[]> {
	const from = getDateRangeStart(range);
	const sends = await repo.findSendsInRange(userId, from, new Date());

	const byDate = new Map<string, { sent: number; delivered: number }>();
	for (const s of sends) {
		if (!s.sentAt) continue;
		const key = formatDate(s.sentAt);
		const entry = byDate.get(key) ?? { sent: 0, delivered: 0 };
		entry.sent++;
		if (["DELIVERED", "OPENED", "CLICKED"].includes(s.status)) {
			entry.delivered++;
		}
		byDate.set(key, entry);
	}

	return Array.from(byDate.entries())
		.map(([date, v]) => ({ date, ...v }))
		.sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Engagement Trend ───────────────────────────────────────────────────────

export async function getEngagementTrend(
	userId: string,
	range: DateRange,
): Promise<EngagementTrendDataPoint[]> {
	const from = getDateRangeStart(range);
	const sends = await repo.findSendsInRange(userId, from, new Date());

	const byDate = new Map<string, { total: number; opened: number; clicked: number }>();
	for (const s of sends) {
		if (!s.sentAt) continue;
		const key = formatDate(s.sentAt);
		const entry = byDate.get(key) ?? { total: 0, opened: 0, clicked: 0 };
		entry.total++;
		if (s.openedAt) entry.opened++;
		if (s.clickedAt) entry.clicked++;
		byDate.set(key, entry);
	}

	return Array.from(byDate.entries())
		.map(([date, v]) => ({
			date,
			openRate: safeRate(v.opened, v.total),
			clickRate: safeRate(v.clicked, v.total),
		}))
		.sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Send Time Distribution ─────────────────────────────────────────────────

export async function getSendTimeDistribution(
	userId: string,
	range: DateRange,
): Promise<SendTimeCell[]> {
	const from = getDateRangeStart(range);
	const sends = await repo.findSendsInRange(userId, from, new Date());

	const grid = new Map<string, number>();
	for (const s of sends) {
		if (!s.sentAt) continue;
		const d = new Date(s.sentAt);
		const key = `${d.getUTCDay()}-${d.getUTCHours()}`;
		grid.set(key, (grid.get(key) ?? 0) + 1);
	}

	return Array.from(grid.entries()).map(([key, count]) => {
		const [dayOfWeek, hour] = key.split("-").map(Number);
		return { dayOfWeek, hour, count };
	});
}

// ─── Campaign Performance ───────────────────────────────────────────────────

export async function getCampaignPerformance(
	userId: string,
	range: DateRange,
): Promise<CampaignPerformanceItem[]> {
	const from = getDateRangeStart(range);
	const campaigns = await repo.findCampaignsWithSends(
		userId,
		from,
		new Date(),
		TOP_CAMPAIGNS_LIMIT,
	);

	return campaigns
		.map((c) => {
			const total = c.sends.length;
			const opened = c.sends.filter((s) => s.openedAt).length;
			const clicked = c.sends.filter((s) => s.clickedAt).length;
			return {
				campaignId: c.id,
				name: c.name,
				totalSends: total,
				openRate: safeRate(opened, total),
				clickRate: safeRate(clicked, total),
			};
		})
		.sort((a, b) => b.openRate - a.openRate);
}

// ─── Audience Growth ────────────────────────────────────────────────────────

export async function getAudienceGrowth(
	userId: string,
	range: DateRange,
): Promise<AudienceGrowthDataPoint[]> {
	const from = getDateRangeStart(range);
	const now = new Date();

	const [contacts, unsubs] = await Promise.all([
		repo.findContactsCreatedInRange(userId, from, now),
		repo.findUnsubscribesInRange(userId, from, now),
	]);

	const byDate = new Map<string, { newContacts: number; unsubscribes: number }>();

	for (const c of contacts) {
		const key = formatDate(c.createdAt);
		const entry = byDate.get(key) ?? { newContacts: 0, unsubscribes: 0 };
		entry.newContacts++;
		byDate.set(key, entry);
	}

	for (const u of unsubs) {
		if (!u.unsubscribedAt) continue;
		const key = formatDate(u.unsubscribedAt);
		const entry = byDate.get(key) ?? { newContacts: 0, unsubscribes: 0 };
		entry.unsubscribes++;
		byDate.set(key, entry);
	}

	return Array.from(byDate.entries())
		.map(([date, v]) => ({
			date,
			newContacts: v.newContacts,
			unsubscribes: v.unsubscribes,
			netGrowth: v.newContacts - v.unsubscribes,
		}))
		.sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Domain Breakdown ───────────────────────────────────────────────────────

export async function getDomainBreakdown(
	userId: string,
): Promise<DomainBreakdownItem[]> {
	const contacts = await repo.findContactEmails(userId);
	const total = contacts.length;
	if (total === 0) return [];

	const counts = new Map<string, number>();
	for (const c of contacts) {
		const domain = c.email.split("@")[1]?.toLowerCase() ?? "unknown";
		counts.set(domain, (counts.get(domain) ?? 0) + 1);
	}

	return Array.from(counts.entries())
		.map(([domain, count]) => ({
			domain,
			count,
			percentage: safeRate(count, total),
		}))
		.sort((a, b) => b.count - a.count)
		.slice(0, 10);
}

// ─── Bounce Breakdown ───────────────────────────────────────────────────────

export async function getBounceBreakdown(
	userId: string,
	range: DateRange,
): Promise<BounceBreakdownItem[]> {
	const from = getDateRangeStart(range);
	const bounced = await repo.findBouncedSends(userId, from, new Date());

	const total = bounced.length;
	if (total === 0) return [];

	// Hard bounce = contact status is BOUNCED, soft bounce = contact still ACTIVE
	let hard = 0;
	let soft = 0;
	for (const b of bounced) {
		if (b.contact.status === "BOUNCED") {
			hard++;
		} else {
			soft++;
		}
	}

	return [
		{ type: "hard" as const, count: hard, percentage: safeRate(hard, total) },
		{ type: "soft" as const, count: soft, percentage: safeRate(soft, total) },
	];
}

// ─── Recent Campaigns ───────────────────────────────────────────────────────

export async function getRecentCampaigns(
	userId: string,
): Promise<RecentCampaignItem[]> {
	const campaigns = await repo.findRecentCampaigns(userId, RECENT_CAMPAIGNS_LIMIT);

	return campaigns.map((c) => {
		const total = c.sends.length;
		const opened = c.sends.filter((s) => s.openedAt).length;
		const clicked = c.sends.filter((s) => s.clickedAt).length;
		return {
			id: c.id,
			name: c.name,
			status: c.status,
			sentAt: c.sentAt?.toISOString() ?? null,
			totalSends: total,
			openRate: safeRate(opened, total),
			clickRate: safeRate(clicked, total),
		};
	});
}
