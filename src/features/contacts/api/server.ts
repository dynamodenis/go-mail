import { createServerFn } from "@tanstack/react-start";
import { saveContactService } from "@/features/contacts/api/service";
import { requireUserId } from "@/lib/require-user";
import { handleServerError } from "@/lib/errors";
import type { CreateContactInput } from "@/features/contacts/schemas/types";
import { createContactSchema } from "@/features/contacts/schemas/types";

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
