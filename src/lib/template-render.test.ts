import { describe, it, expect } from "vitest";
import { renderTemplate } from "./template-render";

describe("renderTemplate", () => {
	it("substitutes a single token", () => {
		expect(renderTemplate("Hi {{firstName}}", { firstName: "Alice" })).toBe(
			"Hi Alice",
		);
	});

	it("substitutes multiple tokens including repeats", () => {
		const out = renderTemplate(
			"<p>Hello {{firstName}} {{lastName}}, your email is {{email}}. Welcome, {{firstName}}!</p>",
			{ firstName: "Bob", lastName: "Smith", email: "b@x.com" },
		);
		expect(out).toBe(
			"<p>Hello Bob Smith, your email is b@x.com. Welcome, Bob!</p>",
		);
	});

	it("renders missing or null tokens as empty strings", () => {
		expect(renderTemplate("Hi {{firstName}}!", {})).toBe("Hi !");
		expect(
			renderTemplate("Hi {{firstName}}!", { firstName: null }),
		).toBe("Hi !");
		expect(
			renderTemplate("Hi {{firstName}}!", { firstName: undefined }),
		).toBe("Hi !");
	});

	it("HTML-escapes merge values by default to prevent injection", () => {
		const out = renderTemplate("<p>Hi {{name}}</p>", {
			name: '<script>alert("xss")</script>',
		});
		expect(out).toBe(
			"<p>Hi &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p>",
		);
	});

	it("does not escape when escape: false (e.g. plain-text subject lines)", () => {
		expect(
			renderTemplate("Hi {{name}} & friends", { name: "A&B" }, { escape: false }),
		).toBe("Hi A&B & friends");
	});

	it("tolerates whitespace inside braces", () => {
		expect(
			renderTemplate("{{  firstName  }}", { firstName: "Carol" }),
		).toBe("Carol");
	});

	it("coerces numeric values to strings", () => {
		expect(renderTemplate("Total: {{count}}", { count: 42 })).toBe(
			"Total: 42",
		);
	});

	it("leaves text without tokens untouched", () => {
		expect(renderTemplate("plain text", { firstName: "ignored" })).toBe(
			"plain text",
		);
	});
});
