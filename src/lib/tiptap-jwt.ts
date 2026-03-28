import { SignJWT } from "jose";

const TIPTAP_SECRET = process.env.TIPTAP_SECRET;
const TIPTAP_AI_SECRET = process.env.TIPTAP_AI_SECRET;

function getCollabSecretKey(): Uint8Array {
	if (!TIPTAP_SECRET) {
		throw new Error("TIPTAP_SECRET environment variable is not set");
	}
	return new TextEncoder().encode(TIPTAP_SECRET);
}

function getAiSecretKey(): Uint8Array {
	if (!TIPTAP_AI_SECRET) {
		throw new Error("TIPTAP_AI_SECRET environment variable is not set");
	}
	return new TextEncoder().encode(TIPTAP_AI_SECRET);
}

/** Generate a TipTap Collaboration JWT for a given user. */
export async function generateTiptapCollabJwt(userId: string): Promise<string> {
	const secret = getCollabSecretKey();
	return new SignJWT({ sub: userId })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setIssuer("xano-server")
		.setAudience("tiptap")
		.sign(secret);
}

/** Generate a TipTap AI JWT for a given user. */
export async function generateTiptapAiJwt(userId: string): Promise<string> {
	const secret = getAiSecretKey();
	return new SignJWT({ sub: userId })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setIssuer("xano-server")
		.setAudience("tiptap")
		.sign(secret);
}
