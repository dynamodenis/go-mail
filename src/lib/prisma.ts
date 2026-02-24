import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error("DATABASE_URL is not set");
}
const isProduction = process.env.NODE_ENV === "production";

const adapter = new PrismaPg({
	connectionString: databaseUrl,
	max: isProduction ? 20 : 5,
	idleTimeoutMillis: 30_000,
	connectionTimeoutMillis: 5_000,
	ssl: isProduction ? { rejectUnauthorized: false } : undefined,
});
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (import.meta.env.MODE !== "production") {
	globalForPrisma.prisma = prisma;
}
