import * as XLSX from "xlsx";
import { APP_NAME } from "@/lib/constants";
/** The expected column headers for contact import files.
 *  "Email" is required; all others are optional. */
export const IMPORT_TEMPLATE_HEADERS = [
	"Email",
	"First Name",
	"Last Name",
	"Phone",
	"Company",
] as const;

const SAMPLE_ROWS = [
	{
		Email: "john.doe@example.com",
		"First Name": "John",
		"Last Name": "Doe",
		Phone: "(555) 123-4567",
		Company: "Acme Corp",
	},
	{
		Email: "jane.smith@example.com",
		"First Name": "Jane",
		"Last Name": "Smith",
		Phone: "(555) 987-6543",
		Company: "TechNova Inc",
	},
];

/** Generates and downloads an Excel template with the expected headers
 *  and two sample rows so users know the correct format. */
export function downloadImportTemplate() {
	const ws = XLSX.utils.json_to_sheet(SAMPLE_ROWS, {
		header: [...IMPORT_TEMPLATE_HEADERS],
	});

	// Set column widths for readability
	ws["!cols"] = [
		{ wch: 28 }, // Email
		{ wch: 14 }, // First Name
		{ wch: 14 }, // Last Name
		{ wch: 16 }, // Phone
		{ wch: 20 }, // Company
	];

	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "Contacts");
	XLSX.writeFile(wb, `${APP_NAME}-contacts-import-template.xlsx`);
}
