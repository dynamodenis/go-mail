import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { useEmailComposerStore } from "../../api/store";
import { recipientToMergeContext } from "../../types";
import ComposerBody from "./composer-body";
import ComposerFooter from "./composer-footer";
import RecipientPreviewSelector from "./recipient-preview-selector";

export default function CenterPanel() {
  const subject = useEmailComposerStore((s) => s.subject);
  const setSubject = useEmailComposerStore((s) => s.setSubject);
  const toRecipients = useEmailComposerStore((s) => s.toRecipients);
  const previewRecipientIndex = useEmailComposerStore(
    (s) => s.previewRecipientIndex,
  );

  // Build merge tag context from the currently-previewed recipient
  const mergeContext = useMemo(() => {
    if (toRecipients.length === 0) return null;
    const safeIndex = Math.min(previewRecipientIndex, toRecipients.length - 1);
    return recipientToMergeContext(toRecipients[safeIndex]);
  }, [toRecipients, previewRecipientIndex]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Subject line — pinned top */}
      <div className="shrink-0 border-b px-4 py-3">
        <Input
          placeholder="Subject..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="border-none bg-transparent p-0 text-sm font-medium placeholder:text-muted-foreground focus-visible:ring-0 h-auto"
        />
      </div>

      {/* Recipient preview selector — pinned */}
      {toRecipients.length > 0 && (
        <div className="shrink-0">
          <RecipientPreviewSelector mergeContext={mergeContext} />
        </div>
      )}

      {/* Email body — scrollable, fills remaining space */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ComposerBody mergeContext={mergeContext} />
      </div>

      {/* Footer — pinned bottom */}
      <div className="shrink-0">
        <ComposerFooter />
      </div>
    </div>
  );
}
