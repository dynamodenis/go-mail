import {
  SendHorizontalIcon,
  SendIcon,
  PaperclipIcon,
  LoaderIcon,
  MessageSquareIcon,
  Trash2Icon,
  ClockIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sooner";
import { useEmailComposerStore, composerRefs } from "../../api/store";

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
  const toggleRightSidebar = useEmailComposerStore((s) => s.toggleRightSidebar);
  const isRightSidebarOpen = useEmailComposerStore((s) => s.isRightSidebarOpen);

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

  const handleSendAll = async () => {
    if (!canSend) return;
    // TODO: Send to all recipients (bulk send via campaign)
    toast.info("Send All — coming soon");
  };

  const handleScheduleSend = () => {
    if (!canSend) return;
    // TODO: Open a date/time picker and schedule the send
    toast.info("Schedule Send — coming soon");
  };

  const handleDelete = () => {
    reset();
    toast.success("Draft discarded");
  };

  return (
    <div className="flex items-center justify-between border-t px-4 py-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {toRecipients.length > 0 && (
          <span>
            {toRecipients.length} recipient{toRecipients.length > 1 ? "s" : ""}
          </span>
        )}
        {ccRecipients.length > 0 && (
          <span>&middot; {ccRecipients.length} cc</span>
        )}
        {bccRecipients.length > 0 && (
          <span>&middot; {bccRecipients.length} bcc</span>
        )}
        {selectedTemplate && (
          <span className="text-primary">
            &middot; {selectedTemplate.name}
          </span>
        )}
        {composerRefs.localFiles.length > 0 && (
          <span>
            &middot; {composerRefs.localFiles.length} file
            {composerRefs.localFiles.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6"
          onClick={() => composerRefs.openFilePicker?.()}
        >
          <PaperclipIcon className="size-3" />
          Attach
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`h-6 ${isRightSidebarOpen ? "text-primary" : ""}`}
          onClick={toggleRightSidebar}
        >
          <MessageSquareIcon className="size-3" />
          Comment
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-destructive hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2Icon className="size-3" />
          Delete
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        <Button
          variant="outline"
          size="sm"
          className="h-6"
          disabled={!canSend}
          onClick={handleScheduleSend}
        >
          <ClockIcon className="size-3" />
          Schedule
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-6"
          disabled={!canSend}
          onClick={handleSendAll}
        >
          <SendIcon className="size-3" />
          Send All
        </Button>

        <Button
          size="sm"
          className="h-6"
          disabled={!canSend}
          onClick={handleSend}
        >
          {isSending ? (
            <LoaderIcon className="size-3 animate-spin" />
          ) : (
            <SendHorizontalIcon className="size-3" />
          )}
          Send
        </Button>
      </div>
    </div>
  );
}
