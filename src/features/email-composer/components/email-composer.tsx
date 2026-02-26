import { Mail } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

function EmailComposer() {
	return (
		<div>
			<PageHeader
				title="Email Composer"
				description="Compose and send emails to your contacts."
			/>
			<div className="mt-6">
				<EmptyState
					icon={Mail}
					title="Email Composer"
					description="Compose personalized emails using your templates and contact lists. Coming soon."
				/>
			</div>
		</div>
	);
}

export default EmailComposer;
