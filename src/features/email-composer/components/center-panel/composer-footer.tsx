import { SendHorizontalIcon, PaperclipIcon, LoaderIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sooner";
import { useEmailComposerStore, composerRefs } from "../../api/store";
import { getRecipientEmail } from "../../types";

export default function ComposerFooter() {
  const subject = useEmailComposerStore((s) => s.subject);
  const bodyHtml = useEmailComposerStore((s) => s.bodyHtml);
  const toRecipients = useEmailComposerStore((s) => s.toRecipients);
  const ccRecipients = useEmailComposerStore((s) => s.ccRecipients);
  const bccRecipients = useEmailComposerStore((s) => s.bccRecipients);
  const getAllToEmails = useEmailComposerStore((s) => s.getAllToEmails);
  const selectedTemplate = useEmailComposerStore((s) => s.selectedTemplate);
  const reset = useEmailComposerStore((s) => s.reset);
  const setOpen = useEmailComposerStore((s) => s.setOpen);

  const [isSending, setIsSending] = useState(false);

  const hasRecipients = toRecipients.length > 0;
  const hasBody = bodyHtml.replace(/<[^>]*>/g, "").trim().length > 0;
  const hasSubject = subject.trim().length > 0;
  const canSend = hasRecipients && hasBody && hasSubject && !isSending;

  const handleSend = async () => {
    const toEmails = getAllToEmails();

    if (toEmails.length === 0) {
      toast.error("Add at least one recipient");
      return;
    }

    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }

    if (!hasBody) {
      toast.error("Write a message before sending");
      return;
    }

    setIsSending(true);

    // TODO: Call the sendEmail server function when implemented
    // For now, simulate sending
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Email sent successfully", {
        description: `Sent to ${toEmails.length} recipient${toEmails.length > 1 ? "s" : ""}`,
      });
      reset();
      setOpen(false);
    } catch {
      toast.error("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex items-center justify-between border-t px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {toRecipients.length > 0 && (
          <span>
            {toRecipients.length} recipient{toRecipients.length > 1 ? "s" : ""}
          </span>
        )}
        {ccRecipients.length > 0 && (
          <span>
            &middot; {ccRecipients.length} cc
          </span>
        )}
        {bccRecipients.length > 0 && (
          <span>
            &middot; {bccRecipients.length} bcc
          </span>
        )}
        {selectedTemplate && (
          <span className="text-primary">
            &middot; Template: {selectedTemplate.name}
          </span>
        )}
        {composerRefs.localFiles.length > 0 && (
          <span>
            &middot; {composerRefs.localFiles.length} file{composerRefs.localFiles.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => composerRefs.openFilePicker?.()}
        >
          <PaperclipIcon className="size-4 mr-1" />
          Attach
        </Button>

        <Button
          size="sm"
          className="h-8"
          disabled={!canSend}
          onClick={handleSend}
        >
          {isSending ? (
            <LoaderIcon className="size-4 mr-1 animate-spin" />
          ) : (
            <SendHorizontalIcon className="size-4 mr-1" />
          )}
          Send
        </Button>
      </div>
    </div>
  );
}
