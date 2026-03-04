import { describe, it, expect } from "vitest";
import {
	autoDetectMapping,
	validateParsedContacts,
} from "../utils/validate-parsed-contacts";
import type { ContactFieldMapping } from "../schemas/types";

describe("autoDetectMapping", () => {
	it("detects common header names", () => {
		const headers = ["Email", "First Name", "Last Name", "Phone", "Company"];
		const sample = {
			"Email": "john@test.com",
			"First Name": "John",
			"Last Name": "Doe",
			"Phone": "555-1234",
			"Company": "Acme",
		};

		const result = autoDetectMapping(headers, sample);
		expect(result[0].field).toBe("email");
		expect(result[1].field).toBe("firstName");
		expect(result[2].field).toBe("lastName");
		expect(result[3].field).toBe("phone");
		expect(result[4].field).toBe("company");
	});

	it("detects snake_case headers", () => {
		const headers = ["email_address", "first_name", "last_name"];
		const sample = { email_address: "a@b.com", first_name: "A", last_name: "B" };

		const result = autoDetectMapping(headers, sample);
		expect(result[0].field).toBe("email");
		expect(result[1].field).toBe("firstName");
		expect(result[2].field).toBe("lastName");
	});

	it("sets null for unrecognized headers", () => {
		const headers = ["foo", "bar"];
		const sample = { foo: "1", bar: "2" };

		const result = autoDetectMapping(headers, sample);
		expect(result[0].field).toBeNull();
		expect(result[1].field).toBeNull();
	});

	it("does not assign same field twice", () => {
		const headers = ["email", "e-mail"];
		const sample = { email: "a@b.com", "e-mail": "c@d.com" };

		const result = autoDetectMapping(headers, sample);
		expect(result[0].field).toBe("email");
		expect(result[1].field).toBeNull();
	});

	it("populates sample values", () => {
		const headers = ["Email"];
		const sample = { Email: "john@test.com" };

		const result = autoDetectMapping(headers, sample);
		expect(result[0].sampleValue).toBe("john@test.com");
	});
});

describe("validateParsedContacts", () => {
	const baseMapping: ContactFieldMapping[] = [
		{ header: "Email", sampleValue: "a@b.com", field: "email" },
		{ header: "Name", sampleValue: "John", field: "firstName" },
	];

	it("marks valid contacts as valid", () => {
		const rows = [{ Email: "john@test.com", Name: "John" }];
		const result = validateParsedContacts(rows, baseMapping);
		expect(result[0].isValid).toBe(true);
		expect(result[0].email).toBe("john@test.com");
		expect(result[0].firstName).toBe("John");
	});

	it("marks contacts with empty email as invalid", () => {
		const rows = [{ Email: "", Name: "John" }];
		const result = validateParsedContacts(rows, baseMapping);
		expect(result[0].isValid).toBe(false);
		expect(result[0].error).toBe("Email is empty");
	});

	it("marks contacts with invalid email format as invalid", () => {
		const rows = [{ Email: "not-an-email", Name: "John" }];
		const result = validateParsedContacts(rows, baseMapping);
		expect(result[0].isValid).toBe(false);
		expect(result[0].error).toBe("Invalid email format");
	});

	it("marks contacts as invalid when no email column mapped", () => {
		const mapping: ContactFieldMapping[] = [
			{ header: "Name", sampleValue: "John", field: "firstName" },
		];
		const rows = [{ Name: "John" }];
		const result = validateParsedContacts(rows, mapping);
		expect(result[0].isValid).toBe(false);
		expect(result[0].error).toBe("No email column mapped");
	});

	it("skips unmapped columns", () => {
		const mapping: ContactFieldMapping[] = [
			{ header: "Email", sampleValue: "", field: "email" },
			{ header: "Notes", sampleValue: "", field: null },
		];
		const rows = [{ Email: "a@b.com", Notes: "some notes" }];
		const result = validateParsedContacts(rows, mapping);
		expect(result[0].isValid).toBe(true);
		expect((result[0] as unknown as Record<string, unknown>)["Notes"]).toBeUndefined();
	});

	it("handles multiple rows with mixed validity", () => {
		const rows = [
			{ Email: "valid@test.com", Name: "Valid" },
			{ Email: "bad", Name: "Bad" },
			{ Email: "also-valid@test.com", Name: "Also Valid" },
		];
		const result = validateParsedContacts(rows, baseMapping);
		expect(result[0].isValid).toBe(true);
		expect(result[1].isValid).toBe(false);
		expect(result[2].isValid).toBe(true);
	});
});
