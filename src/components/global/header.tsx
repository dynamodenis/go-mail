import { Link, useRouter } from "@tanstack/react-router";
import { LogOut, Mail } from "lucide-react";
import { signOutFn } from "@/features/auth/api/auth-fns";
import { useMutation } from "@/hooks/use-mutation";
import { APP_NAME } from "@/lib/constants";
import { Button } from "../ui/button";

export function Header() {
	const router = useRouter();

	const signOutMutation = useMutation({
		fn: signOutFn,
		onSuccess: async () => {
			await router.invalidate();
			router.navigate({ to: "/" });
		},
	});

	return (
		<header className="border-b bg-background">
			<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
				<Link to="/dashboard" className="flex items-center gap-2">
					<Mail className="h-6 w-6" />
					<span className="text-xl font-bold">{APP_NAME}</span>
				</Link>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => signOutMutation.mutate({ data: undefined })}
					disabled={signOutMutation.status === "pending"}
				>
					<LogOut className="mr-2 h-4 w-4" />
					Sign Out
				</Button>
			</div>
		</header>
	);
}
