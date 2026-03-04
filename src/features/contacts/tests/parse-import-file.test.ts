import { describe, it, expect } from "vitest";
import {
	validateFile,
	parseImportFile,
} from "../utils/parse-import-file";

function createMockFile(
	name: string,
	size: number,
	type = "text/csv",
): File {
	const buffer = new ArrayBuffer(size);
	return new File([buffer], name, { type });
}

describe("validateFile", () => {
	it("returns null for valid CSV file", () => {
		const file = createMockFile("contacts.csv", 1024);
		expect(validateFile(file)).toBeNull();
	});

	it("returns null for valid XLSX file", () => {
		const file = createMockFile("contacts.xlsx", 1024);
		expect(validateFile(file)).toBeNull();
	});

	it("returns null for valid XLS file", () => {
		const file = createMockFile("contacts.xls", 1024);
		expect(validateFile(file)).toBeNull();
	});

	it("returns error for unsupported file type", () => {
		const file = createMockFile("contacts.pdf", 1024);
		const result = validateFile(file);
		expect(result).toContain("Unsupported file type");
	});

	it("returns error for file exceeding 10MB", () => {
		const file = createMockFile("contacts.csv", 11 * 1024 * 1024);
		const result = validateFile(file);
		expect(result).toContain("10MB");
	});

	it("allows file exactly at 10MB", () => {
		const file = createMockFile("contacts.csv", 10 * 1024 * 1024);
		expect(validateFile(file)).toBeNull();
	});
});

describe("parseImportFile", () => {
	it("parses a CSV file correctly", async () => {
		const csvContent = "Email,First Name,Last Name\njohn@test.com,John,Doe\njane@test.com,Jane,Smith";
		const file = new File([csvContent], "contacts.csv", { type: "text/csv" });

		const result = await parseImportFile(file);
		expect(result.headers).toEqual(["Email", "First Name", "Last Name"]);
		expect(result.rows).toHaveLength(2);
		expect(result.rows[0]["Email"]).toBe("john@test.com");
		expect(result.rows[0]["First Name"]).toBe("John");
		expect(result.fileName).toBe("contacts.csv");
	});

	it("trims CSV headers", async () => {
		const csvContent = " Email , Name \njohn@test.com,John";
		const file = new File([csvContent], "test.csv", { type: "text/csv" });

		const result = await parseImportFile(file);
		expect(result.headers).toEqual(["Email", "Name"]);
	});

	it("throws for unsupported extension", async () => {
		const file = new File(["data"], "test.txt", { type: "text/plain" });
		await expect(parseImportFile(file)).rejects.toThrow("Unsupported file type");
	});
});
