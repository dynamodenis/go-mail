import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"rounded-md border bg-card text-card-foreground shadow",
				className,
			)}
			{...props}
		/>
	);
}

function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("flex flex-col space-y-1.5 pl-6 pt-2", className)}
			{...props}
		/>
	);
}

function CardTitle({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("font-semibold leading-none tracking-tight", className)}
			{...props}
		/>
	);
}

function CardDescription({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("text-sm text-muted-foreground", className)}
			{...props}
		/>
	);
}

function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("px-6 pb-2 pt-0", className)} {...props} />;
}

function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={cn("flex items-center p-6 pt-0", className)} {...props} />
	);
}

export {
	Card,
	CardHeader,
	CardFooter,
	CardTitle,
	CardDescription,
	CardContent,
};
