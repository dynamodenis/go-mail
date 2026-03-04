import type {
	ContactField,
	ContactFieldMapping,
	ParsedContactRow,
} from "@/features/contacts/schemas/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mapping of common header names to contact fields. */
const HEADER_FIELD_MAP: Record<string, ContactField> = {
	email: "email",
	"e-mail": "email",
	"email address": "email",
	"email_address": "email",
	"emailaddress": "email",
	"first name": "firstName",
	"first_name": "firstName",
	firstname: "firstName",
	"given name": "firstName",
	"last name": "lastName",
	"last_name": "lastName",
	lastname: "lastName",
	"family name": "lastName",
	surname: "lastName",
	phone: "phone",
	"phone number": "phone",
	"phone_number": "phone",
	telephone: "phone",
	mobile: "phone",
	company: "company",
	organization: "company",
	organisation: "company",
	"company name": "company",
	"company_name": "company",
};

/** Auto-detects column-to-field mapping based on header names. */
export function autoDetectMapping(
	headers: string[],
	sampleRow: Record<string, string>,
): ContactFieldMapping[] {
	const usedFields = new Set<ContactField>();

	return headers.map((header) => {
		const normalized = header.toLowerCase().trim();
		const field = HEADER_FIELD_MAP[normalized] ?? null;
		const mappedField = field && !usedFields.has(field) ? field : null;

		if (mappedField) {
			usedFields.add(mappedField);
		}

		return {
			header,
			sampleValue: sampleRow[header] ?? "",
			field: mappedField,
		};
	});
}

/** Validates and maps parsed rows using the column mapping.
 *  Returns ParsedContactRow[] with validation status per row. */
export function validateParsedContacts(
	rows: Record<string, string>[],
	mapping: ContactFieldMapping[],
): ParsedContactRow[] {
	const emailMapping = mapping.find((m) => m.field === "email");

	return rows.map((row) => {
		const contact: ParsedContactRow = {
			email: "",
			isValid: true,
		};

		for (const m of mapping) {
			if (!m.field) continue;
			const value = row[m.header]?.trim() ?? "";
			if (m.field === "email") {
				contact.email = value;
			} else {
				contact[m.field] = value || undefined;
			}
		}

		if (!emailMapping) {
			contact.isValid = false;
			contact.error = "No email column mapped";
		} else if (!contact.email) {
			contact.isValid = false;
			contact.error = "Email is empty";
		} else if (!EMAIL_REGEX.test(contact.email)) {
			contact.isValid = false;
			contact.error = "Invalid email format";
		}

		return contact;
	});
}
