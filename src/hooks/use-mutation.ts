import { useRouter } from "@tanstack/react-router";
import { useCallback, useState, useTransition } from "react";

export function useMutation<TVariables, TData>(opts: {
	fn: (variables: TVariables) => Promise<TData>;
	onSuccess?: (ctx: { data: TData }) => void | Promise<void>;
}) {
	const [submittedAt, setSubmittedAt] = useState<number | undefined>();
	const [variables, setVariables] = useState<TVariables | undefined>();
	const [error, setError] = useState<Error | undefined>();
	const [data, setData] = useState<TData | undefined>();
	const [status, setStatus] = useState<
		"idle" | "pending" | "success" | "error"
	>("idle");
	const [isPending, startTransition] = useTransition();

	const router = useRouter();

	const mutate = useCallback(
		(variables: TVariables) => {
			setStatus("pending");
			setSubmittedAt(Date.now());
			setVariables(variables);
			setError(undefined);

			startTransition(() => {
				(async () => {
					try {
						const data = await opts.fn(variables);
						await opts.onSuccess?.({ data });
						setStatus("success");
						setData(data);
						await router.invalidate();
					} catch (e) {
						if (e instanceof Error) {
							setError(e);
						}
						setStatus("error");
					}
				})();
			});
		},
		[opts.fn, opts.onSuccess, router],
	);

	return {
		status,
		variables,
		submittedAt,
		error,
		data,
		mutate,
		isPending,
	};
}
