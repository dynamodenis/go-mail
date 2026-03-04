import { createServerFn } from "@tanstack/react-start";
import {
	saveContactService,
	getContactsService,
	updateContactService,
	deleteContactService,
	deleteContactsService,
	importContactsService,
} from "@/features/contacts/api/service";
import { requireUserId } from "@/lib/require-user";
import { handleServerError } from "@/lib/errors";
import type {
	CreateContactInput,
	ContactFilters,
	ImportContactsInput,
	UpdateContactInput,
} from "@/features/contacts/schemas/types";
import {
	createContactSchema,
	contactFiltersSchema,
	importContactsSchema,
	updateContactSchema,
	deleteContactSchema,
	deleteContactsSchema,
} from "@/features/contacts/schemas/types";

/** Creates a new contact for the authenticated user.
 *  Auth: Requires authenticated session.
 *  Errors: CONTACT_ALREADY_EXISTS, INTERNAL_ERROR */
export const saveContact = createServerFn({ method: "POST" })
	.inputValidator(
		(data: CreateContactInput) => createContactSchema.parse(data),
	)
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			const contact = await saveContactService({ ...data, userId });
			return { data: contact };
		} catch (error) {
			return handleServerError(error);
		}
	});

/** Fetches paginated contacts with optional search and status filters.
 *  Auth: Requires authenticated session.
 *  Errors: INTERNAL_ERROR */
export const getContacts = createServerFn({ method: "GET" })
	.inputValidator(
		(data: ContactFilters) => contactFiltersSchema.parse(data),
	)
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			const result = await getContactsService(userId, data);
			return { data: result };
		} catch (error) {
			return handleServerError(error);
		}
	});

/** Updates an existing contact.
 *  Auth: Requires authenticated session.
 *  Errors: CONTACT_NOT_FOUND, CONTACT_ALREADY_EXISTS, INTERNAL_ERROR */
export const updateContact = createServerFn({ method: "POST" })
	.inputValidator(
		(data: UpdateContactInput) => updateContactSchema.parse(data),
	)
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			const contact = await updateContactService(userId, data);
			return { data: contact };
		} catch (error) {
			return handleServerError(error);
		}
	});

/** Deletes a single contact.
 *  Auth: Requires authenticated session.
 *  Errors: CONTACT_NOT_FOUND, INTERNAL_ERROR */
export const deleteContact = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { id: string }) => deleteContactSchema.parse(data),
	)
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			await deleteContactService(userId, data.id);
			return { data: { success: true } };
		} catch (error) {
			return handleServerError(error);
		}
	});

/** Deletes multiple contacts at once.
 *  Auth: Requires authenticated session.
 *  Errors: INTERNAL_ERROR */
export const deleteContacts = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { ids: string[] }) => deleteContactsSchema.parse(data),
	)
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			const result = await deleteContactsService(userId, data.ids);
			return { data: result };
		} catch (error) {
			return handleServerError(error);
		}
	});

/** Bulk-imports contacts from a file upload, optionally assigning to a collection.
 *  Auth: Requires authenticated session.
 *  Errors: COLLECTION_NOT_FOUND, INTERNAL_ERROR */
export const importContacts = createServerFn({ method: "POST" })
	.inputValidator(
		(data: ImportContactsInput) => importContactsSchema.parse(data),
	)
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();
			const result = await importContactsService(userId, data);
			return { data: result };
		} catch (error) {
			return handleServerError(error);
		}
	});
