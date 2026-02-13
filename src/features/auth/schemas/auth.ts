import { z } from "zod";

export const signInSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signUpSchema = z
	.object({
		email: z.string().email("Please enter a valid email address"),
		password: z.string().min(6, "Password must be at least 6 characters"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

export type User = {
	id: string;
	email: string;
};
