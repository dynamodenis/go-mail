interface ContactFields {
	firstName?: string | null;
	lastName?: string | null;
	email: string;
}

type TagResolver = (contact: ContactFields) => string;

const TAG_RESOLVERS: Record<string, TagResolver> = {
	"{first_name}": (c) => c.firstName ?? "",
	"{full_name}": (c) =>
		[c.firstName, c.lastName].filter(Boolean).join(" ") || "",
	"{email}": (c) => c.email,
};

/**
 * Replace merge tag spans in HTML with resolved contact values.
 * Merge tags are rendered as `<span data-type="mergeTag" data-value="{tag}">label</span>`.
 * Custom tags are resolved via the optional `customValues` map.
 */
export function resolveTemplateHtml(
	html: string,
	contact: ContactFields,
	customValues?: Record<string, string>,
): string {
	return html.replace(
		/<span[^>]*data-type="mergeTag"[^>]*data-value="([^"]*)"[^>]*>[^<]*<\/span>/g,
		(_match, value: string) => {
			const resolver = TAG_RESOLVERS[value];
			if (resolver) return resolver(contact);
			if (customValues && value in customValues) return customValues[value];
			return value;
		},
	);
}

/**
 * Deep-clone a TipTap JSON tree and convert mergeTag nodes to text nodes
 * with the resolved contact value.
 * Custom tags are resolved via the optional `customValues` map.
 */
export function resolveTemplateTags(
	json: Record<string, unknown>,
	contact: ContactFields,
	customValues?: Record<string, string>,
): Record<string, unknown> {
	const clone = structuredClone(json);
	resolveNode(clone, contact, customValues);
	return clone;
}

function resolveNode(
	node: Record<string, unknown>,
	contact: ContactFields,
	customValues?: Record<string, string>,
): void {
	if (node.type === "mergeTag") {
		const attrs = node.attrs as Record<string, string> | undefined;
		const value = attrs?.value ?? "";
		const resolver = TAG_RESOLVERS[value];
		node.type = "text";
		if (resolver) {
			node.text = resolver(contact);
		} else if (customValues && value in customValues) {
			node.text = customValues[value];
		} else {
			node.text = value;
		}
		delete node.attrs;
		return;
	}

	const content = node.content as Record<string, unknown>[] | undefined;
	if (Array.isArray(content)) {
		for (const child of content) {
			resolveNode(child, contact, customValues);
		}
	}
}
