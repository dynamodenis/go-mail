import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SignInForm } from "../components/sign-in-form";
import { authKeys } from "../api/queries";

// Shared mutable refs available inside the hoisted vi.mock factories.
const h = vi.hoisted(() => ({
	mutate: vi.fn(),
	router: {
		invalidate: vi.fn(),
		navigate: vi.fn(),
	},
	// Drives what the mocked useMutation returns for a given render.
	mutation: {
		status: "idle" as "idle" | "pending" | "success" | "error",
		data: undefined as unknown,
		error: undefined as Error | undefined,
	},
	// Captures the component's onSuccess so we can invoke it directly.
	captured: { onSuccess: undefined as ((ctx: { data: unknown }) => unknown) | undefined },
}));

vi.mock("@tanstack/react-router", () => ({
	useRouter: () => h.router,
	Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
		<a href={to}>{children}</a>
	),
}));

vi.mock("@/hooks/use-mutation", () => ({
	useMutation: (opts: { onSuccess?: (ctx: { data: unknown }) => unknown }) => {
		h.captured.onSuccess = opts.onSuccess;
		return {
			mutate: h.mutate,
			status: h.mutation.status,
			data: h.mutation.data,
			error: h.mutation.error,
		};
	},
}));

vi.mock("../api/auth-fns", () => ({ signInFn: vi.fn() }));

function renderForm() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	const removeQueries = vi.spyOn(queryClient, "removeQueries");
	const utils = render(
		<QueryClientProvider client={queryClient}>
			<SignInForm />
		</QueryClientProvider>,
	);
	return { ...utils, removeQueries };
}

function fillAndSubmit(email: string, password: string) {
	fireEvent.change(screen.getByLabelText("Email"), {
		target: { value: email },
	});
	fireEvent.change(screen.getByLabelText("Password"), {
		target: { value: password },
	});
	fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
}

describe("SignInForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		h.router.invalidate.mockResolvedValue(undefined);
		h.router.navigate.mockResolvedValue(undefined);
		h.mutation.status = "idle";
		h.mutation.data = undefined;
		h.mutation.error = undefined;
	});

	it("renders email, password fields and the sign-up link", () => {
		renderForm();
		expect(screen.getByLabelText("Email")).toBeInTheDocument();
		expect(screen.getByLabelText("Password")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
			"href",
			"/sign-up",
		);
	});

	it("shows the Zod email error when the email is empty", () => {
		// NOTE: a *malformed* email (e.g. "not-an-email") is caught by the
		// browser's native type="email" validation, which blocks form submit
		// before handleSubmit runs — so the Zod message never shows for that.
		// An empty email is natively valid but fails Zod's .email(), which is the
		// path that surfaces this message.
		renderForm();
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "password123" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

		expect(
			screen.getByText("Please enter a valid email address"),
		).toBeInTheDocument();
		expect(h.mutate).not.toHaveBeenCalled();
	});

	it("blocks submit and shows a validation error for a short password", () => {
		renderForm();
		fillAndSubmit("user@example.com", "123");

		expect(
			screen.getByText("Password must be at least 6 characters"),
		).toBeInTheDocument();
		expect(h.mutate).not.toHaveBeenCalled();
	});

	it("calls the mutation with credentials on a valid submit", () => {
		renderForm();
		fillAndSubmit("user@example.com", "password123");

		expect(h.mutate).toHaveBeenCalledWith({
			data: { email: "user@example.com", password: "password123" },
		});
	});

	it("toggles password visibility", () => {
		renderForm();
		const password = screen.getByLabelText("Password");
		expect(password).toHaveAttribute("type", "password");

		// The toggle is the icon button with no accessible name inside the field.
		const toggle = password.parentElement?.querySelector("button");
		expect(toggle).toBeTruthy();
		fireEvent.click(toggle as HTMLElement);
		expect(password).toHaveAttribute("type", "text");
	});

	it("shows the server error returned by the mutation", () => {
		h.mutation.data = { error: "Invalid login credentials" };
		renderForm();
		expect(screen.getByText("Invalid login credentials")).toBeInTheDocument();
	});

	it("shows a generic error when the mutation throws", () => {
		h.mutation.error = new Error("boom");
		renderForm();
		expect(
			screen.getByText("Something went wrong. Please try again."),
		).toBeInTheDocument();
	});

	it("disables the button and shows a pending label while signing in", () => {
		h.mutation.status = "pending";
		renderForm();
		const button = screen.getByRole("button", { name: "Signing in..." });
		expect(button).toBeDisabled();
	});

	it("on success: clears the cached user query and navigates to the dashboard", async () => {
		const { removeQueries } = renderForm();

		// Invoke the captured onSuccess as the mutation would on a successful login.
		await h.captured.onSuccess?.({ data: { success: true } });

		expect(removeQueries).toHaveBeenCalledWith({ queryKey: authKeys.user });
		expect(h.router.invalidate).toHaveBeenCalled();
		await waitFor(() =>
			expect(h.router.navigate).toHaveBeenCalledWith({ to: "/dashboard" }),
		);
	});

	it("on a server error result: does NOT navigate or clear the cache", async () => {
		const { removeQueries } = renderForm();

		await h.captured.onSuccess?.({ data: { error: "Invalid login credentials" } });

		expect(removeQueries).not.toHaveBeenCalled();
		expect(h.router.navigate).not.toHaveBeenCalled();
	});
});
