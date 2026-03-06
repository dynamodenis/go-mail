import { MailPlusIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useEmailComposerStore } from "../api/store";
import EmailComposer from "./email-composer";

/**
 * Outreach Emails page — shows a CTA to open the composer dialog.
 * Used by the /outreach-composer/email-composer route.
 */
export default function EmailComposerPage() {
  const setOpen = useEmailComposerStore((s) => s.setOpen);

  return (
    <div>
      <PageHeader
        title="Outreach Emails"
        description="Create and send personalized outreach emails to your contacts and collections."
      />

      <div className="mt-6 flex items-center justify-center">
        <EmptyState
          icon={MailPlusIcon}
          title="Compose an Outreach Email"
          description="Select a template, pick your recipients, preview merge tags, and send — all in one place."
          actionLabel="Compose Email"
          onAction={() => setOpen(true)}
        />
      </div>

      <EmailComposer />
    </div>
  );
}
