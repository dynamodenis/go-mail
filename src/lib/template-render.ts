/** Lightweight {{token}} merge tag renderer for emails.
 *  Intentionally minimal — no logic, conditionals, or loops. Use a real templating
 *  engine if those needs emerge. */

const TOKEN_RE = /\{\{\s*([\w.-]+)\s*\}\}/g;

const HTML_ESCAPE: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (ch) => HTML_ESCAPE[ch] ?? ch);
}

export type MergeData = Record<string, string | number | null | undefined>;

interface RenderOptions {
	/** When true (default for HTML bodies), escape merge values. Set false for
	 *  plain-text contexts like the subject line. */
	escape?: boolean;
}

/** Replace `{{token}}` placeholders with values from `data`. Missing or
 *  null/undefined values render as an empty string. HTML-escapes values by
 *  default to prevent injection from contact data. */
export function renderTemplate(
	template: string,
	data: MergeData,
	options: RenderOptions = {},
): string {
	const shouldEscape = options.escape ?? true;
	return template.replace(TOKEN_RE, (_, key: string) => {
		const raw = data[key];
		if (raw === null || raw === undefined) return "";
		const str = String(raw);
		return shouldEscape ? escapeHtml(str) : str;
	});
}
