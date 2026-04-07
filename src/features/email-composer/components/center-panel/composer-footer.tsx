import {
  SendHorizontalIcon,
  SendIcon,
  PaperclipIcon,
  MessageSquareIcon,
  Trash2Icon,
  ClockIcon,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sooner";
import { useEmailComposerStore, composerRefs } from "../../api/store";
import { useCreateEmailBatch } from "@/features/email-schedule/api/queries";
import EmailScheduleModal, {
  type ScheduledEmailData,
} from "./email-schedule-modal";
import Loader from "@/components/global/loader";

export default function ComposerFooter() {
  const subject = useEmailComposerStore((s) => s.subject);
  const bodyHtml = useEmailComposerStore((s) => s.bodyHtml);
  const toRecipients = useEmailComposerStore((s) => s.toRecipients);
  const ccRecipients = useEmailComposerStore((s) => s.ccRecipients);
  const bccRecipients = useEmailComposerStore((s) => s.bccRecipients);
  const selectedTemplate = useEmailComposerStore((s) => s.selectedTemplate);
  const reset = useEmailComposerStore((s) => s.reset);
  const setOpen = useEmailComposerStore((s) => s.setOpen);
  const toggleRightSidebar = useEmailComposerStore((s) => s.toggleRightSidebar);
  const isRightSidebarOpen = useEmailComposerStore((s) => s.isRightSidebarOpen);
  const getBatchSources = useEmailComposerStore((s) => s.getBatchSources);
  const getEstimatedRecipientCount = useEmailComposerStore(
    (s) => s.getEstimatedRecipientCount,
  );

  const [isSending, setIsSending] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const { mutate: createEmailBatch, isPending } = useCreateEmailBatch();

  const hasRecipients = toRecipients.length > 0;
  const hasBody = bodyHtml.replace(/<[^>]*>/g, "").trim().length > 0;
  const hasSubject = subject.trim().length > 0;
  const canSend = hasRecipients && hasBody && hasSubject && !isSending;

  const handleSend = async () => {
    if (!canSend) return;

    setIsSending(true);

    // TODO: Call the sendEmail server function when implemented
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const count = getEstimatedRecipientCount();
      toast.success("Email sent successfully", {
        description: `Sent to ${count} recipient${count > 1 ? "s" : ""}`,
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

    const sources = getBatchSources();
    if (sources.length === 0) {
      toast.error("Add at least one recipient");
      return;
    }

    createEmailBatch(
      {
        subject,
        bodyHtml,
        templateId: selectedTemplate?.id,
        ccRecipients: ccRecipients.length > 0
          ? ccRecipients.map((r) => r.email)
          : undefined,
        bccRecipients: bccRecipients.length > 0
          ? bccRecipients.map((r) => r.email)
          : undefined,
        scheduledAt: null,
        sources,
      },
      {
        onSuccess: () => {
          const count = getEstimatedRecipientCount();
          toast.success("Emails queued for sending", {
            description: `Sending to ${count.toLocaleString()} recipient${count !== 1 ? "s" : ""}`,
          });
          reset();
          setOpen(false);
        },
        onError: () => {
          toast.error("Failed to queue emails for sending");
        },
      },
    );
  };

  const handleScheduleSend = () => {
    if (!canSend) return;
    setScheduleOpen(true);
  };

  const handleScheduleConfirm = useCallback(
    (data: ScheduledEmailData) => {
      createEmailBatch(
        {
          subject: data.subject,
          bodyHtml: data.bodyHtml,
          templateId: data.templateId,
          ccRecipients: data.cc.length > 0 ? data.cc : undefined,
          bccRecipients: data.bcc.length > 0 ? data.bcc : undefined,
          scheduledAt: data.scheduledAt.toISOString(),
          sources: data.sources,
        },
        {
          onSuccess: () => {
            toast.success("Email scheduled", {
              description: `Will be sent on ${data.scheduledAt.toLocaleString()} to ${data.estimatedRecipientCount.toLocaleString()} recipient${data.estimatedRecipientCount !== 1 ? "s" : ""}`,
            });
            setScheduleOpen(false);
          },
          onError: () => {
            toast.error("Failed to schedule email");
          },
        },
      );
    },
    [createEmailBatch],
  );

  const handleDelete = () => {
    reset();
    toast.success("Draft discarded");
  };

  const estimatedCount = getEstimatedRecipientCount();

  return (
    <div className="flex items-center justify-between border-t px-4 py-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {estimatedCount > 0 && (
          <span>
            {estimatedCount.toLocaleString()} recipient{estimatedCount > 1 ? "s" : ""}
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
          disabled={!canSend || isPending}
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
            <Loader size={16} />
          ) : (
            <SendHorizontalIcon className="size-3" />
          )}
          Send
        </Button>
      </div>

      <EmailScheduleModal
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        onSchedule={handleScheduleConfirm}
        isPending={isPending}
        toRecipients={toRecipients}
        ccEmails={ccRecipients.map((r) => r.email)}
        bccEmails={bccRecipients.map((r) => r.email)}
        subject={subject}
        bodyHtml={bodyHtml}
        templateId={selectedTemplate?.id}
        attachmentCount={composerRefs.localFiles.length}
      />
    </div>
  );
}
