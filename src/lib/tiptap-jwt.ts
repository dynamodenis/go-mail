import { SignJWT } from "jose";

const TIPTAP_SECRET = process.env.TIPTAP_SECRET;

function getSecretKey(): Uint8Array {
	if (!TIPTAP_SECRET) {
		throw new Error("TIPTAP_SECRET environment variable is not set");
	}
	return new TextEncoder().encode(TIPTAP_SECRET);
}

/** Generate a TipTap Collaboration JWT for a given user. */
export async function generateTiptapCollabJwt(userId: string): Promise<string> {
	const secret = getSecretKey();
	return new SignJWT({ sub: userId })
		.setProtectedHeader({ alg: "HS256", typ: "JWT" })
		.setIssuedAt()
		.sign(secret);
}

/** Generate a TipTap AI JWT for a given user. */
export async function generateTiptapAiJwt(userId: string): Promise<string> {
	const secret = getSecretKey();
	return new SignJWT({ sub: userId })
		.setProtectedHeader({ alg: "HS256", typ: "JWT" })
		.setIssuedAt()
		.sign(secret);
}
