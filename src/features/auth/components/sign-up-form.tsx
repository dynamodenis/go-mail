import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@/hooks/use-mutation";
import { APP_NAME } from "@/lib/constants";
import { signUpFn } from "../api/auth-fns";
import { type SignUpInput, signUpSchema } from "../schemas/auth";

export function SignUpForm() {
	const [formData, setFormData] = useState<SignUpInput>({
		fullName: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});

	const signUpMutation = useMutation({
		fn: signUpFn,
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setValidationErrors({});

		const result = signUpSchema.safeParse(formData);
		if (!result.success) {
			const errors: Record<string, string> = {};
			for (const issue of result.error.issues) {
				errors[issue.path[0] as string] = issue.message;
			}
			setValidationErrors(errors);
			return;
		}

		signUpMutation.mutate({
			data: {
				email: result.data.email,
				password: result.data.password,
				fullName: result.data.fullName || undefined,
			},
		});
	};

	const serverError =
		signUpMutation.data && "error" in signUpMutation.data
			? signUpMutation.data.error
			: signUpMutation.error
				? "Something went wrong. Please try again."
				: null;

	const successMessage =
		signUpMutation.data && "success" in signUpMutation.data
			? signUpMutation.data.success
			: null;

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl font-bold">Create an account</CardTitle>
				<CardDescription>Get started with {APP_NAME}</CardDescription>
			</CardHeader>
			<form onSubmit={handleSubmit}>
				<CardContent className="space-y-4">
					{serverError && (
						<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
							{serverError}
						</div>
					)}
					{successMessage && (
						<div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
							{successMessage}
						</div>
					)}
					<div className="space-y-2">
						<Label htmlFor="fullName">Full Name</Label>
						<Input
							id="fullName"
							type="text"
							placeholder="John Doe"
							value={formData.fullName ?? ""}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									fullName: e.target.value,
								}))
							}
						/>
						{validationErrors.fullName && (
							<p className="text-sm text-destructive">
								{validationErrors.fullName}
							</p>
						)}
					</div>
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
						<div className="relative">
							<Input
								id="password"
								type={showPassword ? "text" : "password"}
								placeholder="Create a password"
								value={formData.password}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, password: e.target.value }))
								}
								className="pr-10"
							/>
							<button
								type="button"
								onClick={() => setShowPassword((prev) => !prev)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								tabIndex={-1}
							>
								{showPassword ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</button>
						</div>
						{validationErrors.password && (
							<p className="text-sm text-destructive">
								{validationErrors.password}
							</p>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor="confirmPassword">Confirm Password</Label>
						<div className="relative">
							<Input
								id="confirmPassword"
								type={showConfirmPassword ? "text" : "password"}
								placeholder="Confirm your password"
								value={formData.confirmPassword}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										confirmPassword: e.target.value,
									}))
								}
								className="pr-10"
							/>
							<button
								type="button"
								onClick={() => setShowConfirmPassword((prev) => !prev)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								tabIndex={-1}
							>
								{showConfirmPassword ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</button>
						</div>
						{validationErrors.confirmPassword && (
							<p className="text-sm text-destructive">
								{validationErrors.confirmPassword}
							</p>
						)}
					</div>
				</CardContent>
				<CardFooter className="flex flex-col gap-4">
					<Button
						type="submit"
						className="w-full"
						disabled={signUpMutation.status === "pending"}
					>
						{signUpMutation.status === "pending"
							? "Creating account..."
							: "Create Account"}
					</Button>
					<p className="text-sm text-muted-foreground">
						Already have an account?{" "}
						<Link
							to="/sign-in"
							className="font-medium text-primary underline-offset-4 hover:underline"
						>
							Sign in
						</Link>
					</p>
				</CardFooter>
			</form>
		</Card>
	);
}
