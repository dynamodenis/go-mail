import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { ParsedFileResult } from "@/features/contacts/schemas/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

/** Validates that a file has an allowed extension and is within size limits. */
export function validateFile(file: File): string | null {
	const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
	if (!ALLOWED_EXTENSIONS.includes(ext)) {
		return `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`;
	}
	if (file.size > MAX_FILE_SIZE) {
		return "File size exceeds 10MB limit.";
	}
	return null;
}

function getFileExtension(fileName: string): string {
	return fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
}

async function parseCsv(file: File): Promise<ParsedFileResult> {
	const text = await file.text();
	const result = Papa.parse<Record<string, string>>(text, {
		header: true,
		skipEmptyLines: true,
		transformHeader: (h) => h.trim(),
	});

	if (result.errors.length > 0 && result.data.length === 0) {
		throw new Error(`CSV parsing failed: ${result.errors[0].message}`);
	}

	return {
		headers: result.meta.fields ?? [],
		rows: result.data,
		fileName: file.name,
	};
}

async function parseSpreadsheet(file: File): Promise<ParsedFileResult> {
	const buffer = await file.arrayBuffer();
	const workbook = XLSX.read(buffer, { type: "array" });
	const sheetName = workbook.SheetNames[0];
	if (!sheetName) {
		throw new Error("Spreadsheet has no sheets.");
	}

	const sheet = workbook.Sheets[sheetName];
	const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
		defval: "",
		raw: false,
	});

	if (rows.length === 0) {
		throw new Error("Spreadsheet is empty.");
	}

	const headers = Object.keys(rows[0]);
	return { headers, rows, fileName: file.name };
}

/** Parses an import file (CSV or XLSX/XLS) and returns headers + rows. */
export async function parseImportFile(file: File): Promise<ParsedFileResult> {
	const ext = getFileExtension(file.name);

	if (ext === ".csv") {
		return parseCsv(file);
	}
	if (ext === ".xlsx" || ext === ".xls") {
		return parseSpreadsheet(file);
	}

	throw new Error(`Unsupported file type: ${ext}`);
}
