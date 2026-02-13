import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useMutation } from "~/hooks/use-mutation";
import { signInFn } from "../api/auth-fns";
import { type SignInInput, signInSchema } from "../schemas/auth";

export function SignInForm() {
	const [formData, setFormData] = useState<SignInInput>({
		email: "",
		password: "",
	});
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});

	const router = useRouter();

	const signInMutation = useMutation({
		fn: signInFn,
		onSuccess: async ({ data }) => {
			if (data && "success" in data) {
				await router.invalidate();
				router.navigate({ to: "/dashboard" });
			}
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setValidationErrors({});

		const result = signInSchema.safeParse(formData);
		if (!result.success) {
			const errors: Record<string, string> = {};
			for (const issue of result.error.issues) {
				errors[issue.path[0] as string] = issue.message;
			}
			setValidationErrors(errors);
			return;
		}

		signInMutation.mutate({
			data: {
				email: result.data.email,
				password: result.data.password,
			},
		});
	};

	const serverError =
		signInMutation.data && "error" in signInMutation.data
			? signInMutation.data.error
			: signInMutation.error
				? "Something went wrong. Please try again."
				: null;

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
				<CardDescription>Sign in to your GoMail account</CardDescription>
			</CardHeader>
			<form onSubmit={handleSubmit}>
				<CardContent className="space-y-4">
					{serverError && (
						<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
							{serverError}
						</div>
					)}
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="you@example.com"
							value={formData.email}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, email: e.target.value }))
							}
						/>
						{validationErrors.email && (
							<p className="text-sm text-destructive">
								{validationErrors.email}
							</p>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							placeholder="Enter your password"
							value={formData.password}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, password: e.target.value }))
							}
						/>
						{validationErrors.password && (
							<p className="text-sm text-destructive">
								{validationErrors.password}
							</p>
						)}
					</div>
				</CardContent>
				<CardFooter className="flex flex-col gap-4">
					<Button
						type="submit"
						className="w-full"
						disabled={signInMutation.status === "pending"}
					>
						{signInMutation.status === "pending"
							? "Signing in..."
							: "Sign In"}
					</Button>
					<p className="text-sm text-muted-foreground">
						Don't have an account?{" "}
						<Link
							to="/sign-up"
							className="font-medium text-primary underline-offset-4 hover:underline"
						>
							Sign up
						</Link>
					</p>
				</CardFooter>
			</form>
		</Card>
	);
}
