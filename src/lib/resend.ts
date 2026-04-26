import { Resend } from "resend";

/** Singleton Resend client. The API key is read at module load — the dev server
 *  must be restarted after changing RESEND_API_KEY. */
export const resend = new Resend(process.env.RESEND_API_KEY);

/** The verified sender address. Configure RESEND_FROM_EMAIL in .env to a
 *  domain you've verified in the Resend dashboard. */
export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "";

/** Per-user requests-per-second cap used by the Inngest throttle. Set this to
 *  match your Resend plan's per-second limit (free: 2, pro: 10, scale: 100+). */
export const RESEND_RPS = Math.max(1, Number(process.env.RESEND_RPS ?? 2));
