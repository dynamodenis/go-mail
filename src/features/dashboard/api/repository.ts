import { prisma } from "@/lib/prisma";

/** Pure data-access layer for dashboard queries. No auth checks or business logic. */

export async function countSendsByStatus(
	userId: string,
	from: Date,
	to: Date,
) {
	return prisma.campaignSend.groupBy({
		by: ["status"],
		where: {
			campaign: { userId },
			sentAt: { gte: from, lte: to },
		},
		_count: { id: true },
	});
}

export async function countContacts(userId: string, from?: Date, to?: Date) {
	return prisma.contact.count({
		where: {
			userId,
			...(from && to ? { createdAt: { gte: from, lte: to } } : {}),
		},
	});
}

export async function findSendsInRange(
	userId: string,
	from: Date,
	to: Date,
) {
	return prisma.campaignSend.findMany({
		where: {
			campaign: { userId },
			sentAt: { gte: from, lte: to },
		},
		select: {
			status: true,
			sentAt: true,
			openedAt: true,
			clickedAt: true,
		},
	});
}

export async function findCampaignsWithSends(
	userId: string,
	from: Date,
	to: Date,
	limit: number,
) {
	return prisma.campaign.findMany({
		where: {
			userId,
			sentAt: { gte: from, lte: to },
		},
		select: {
			id: true,
			name: true,
			sends: {
				select: {
					status: true,
					openedAt: true,
					clickedAt: true,
				},
			},
		},
		orderBy: { sentAt: "desc" },
		take: limit,
	});
}

export async function findContactsCreatedInRange(
	userId: string,
	from: Date,
	to: Date,
) {
	return prisma.contact.findMany({
		where: {
			userId,
			createdAt: { gte: from, lte: to },
		},
		select: {
			createdAt: true,
		},
	});
}

export async function findUnsubscribesInRange(
	userId: string,
	from: Date,
	to: Date,
) {
	return prisma.campaignSend.findMany({
		where: {
			campaign: { userId },
			status: "UNSUBSCRIBED",
			unsubscribedAt: { gte: from, lte: to },
		},
		select: {
			unsubscribedAt: true,
		},
	});
}

export async function findContactEmails(userId: string) {
	return prisma.contact.findMany({
		where: { userId, status: "ACTIVE" },
		select: { email: true },
	});
}

export async function findBouncedSends(
	userId: string,
	from: Date,
	to: Date,
) {
	return prisma.campaignSend.findMany({
		where: {
			campaign: { userId },
			status: "BOUNCED",
			bouncedAt: { gte: from, lte: to },
		},
		select: {
			bouncedAt: true,
			contact: { select: { status: true } },
		},
	});
}

export async function findRecentCampaigns(userId: string, limit: number) {
	return prisma.campaign.findMany({
		where: { userId },
		select: {
			id: true,
			name: true,
			status: true,
			sentAt: true,
			sends: {
				select: {
					status: true,
					openedAt: true,
					clickedAt: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
		take: limit,
	});
}
