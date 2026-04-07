/** Typed application error used by service layer to throw business-rule errors.
 *  Server functions catch these via handleServerError() and return { error } to the client. */
export class AppError extends Error {
	constructor(
		public readonly code: string,
		message: string,
	) {
		super(message);
		this.name = "AppError";
	}
}

/** Catches errors thrown by the service layer and returns a consistent { error } shape.
 *  - AppError → returns its code + message
 *  - UNAUTHORIZED / AUTH_SERVICE_UNAVAILABLE → returns appropriate error
 *  - Unknown errors → logs to server console, returns generic message */
export function handleServerError(error: unknown): {
	error: { code: string; message: string };
} {
	if (error instanceof AppError) {
		return { error: { code: error.code, message: error.message } };
	}

	if (error instanceof Error) {
		if (error.message === "UNAUTHORIZED") {
			return {
				error: {
					code: "UNAUTHORIZED",
					message: "You must be signed in to perform this action.",
				},
			};
		}
		if (error.message === "AUTH_SERVICE_UNAVAILABLE") {
			return {
				error: {
					code: "AUTH_SERVICE_UNAVAILABLE",
					message:
						"The authentication service is temporarily unavailable. Please try again in a few minutes.",
				},
			};
		}
	}

	console.error("[ServerError]", error);
	return {
		error: {
			code: "INTERNAL_ERROR",
			message: "An unexpected error occurred. Please try again.",
		},
	};
}
