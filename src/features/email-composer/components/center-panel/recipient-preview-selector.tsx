import { ChevronLeftIcon, ChevronRightIcon, UserIcon, TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmailComposerStore } from "../../api/store";
import { getRecipientName, getRecipientEmail, type MergeTagContext } from "../../types";

interface RecipientPreviewSelectorProps {
  mergeContext: MergeTagContext | null;
}

export default function RecipientPreviewSelector({
  mergeContext,
}: RecipientPreviewSelectorProps) {
  const toRecipients = useEmailComposerStore((s) => s.toRecipients);
  const previewRecipientIndex = useEmailComposerStore(
    (s) => s.previewRecipientIndex,
  );
  const setPreviewRecipientIndex = useEmailComposerStore(
    (s) => s.setPreviewRecipientIndex,
  );

  if (toRecipients.length === 0) return null;

  const safeIndex = Math.min(previewRecipientIndex, toRecipients.length - 1);
  const currentRecipient = toRecipients[safeIndex];
  const name = getRecipientName(currentRecipient);
  const email = getRecipientEmail(currentRecipient);

  const hasPrev = safeIndex > 0;
  const hasNext = safeIndex < toRecipients.length - 1;

  return (
    <div className="flex items-center gap-2 border-b px-4 py-2 bg-accent/30">
      <TagIcon className="size-3.5 text-primary shrink-0" />
      <span className="text-[10px] text-muted-foreground shrink-0">
        Preview as:
      </span>

      <div className="flex items-center gap-1 min-w-0 flex-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
          disabled={!hasPrev}
          onClick={() => setPreviewRecipientIndex(safeIndex - 1)}
        >
          <ChevronLeftIcon className="size-3" />
        </Button>

        <div className="flex items-center gap-1.5 min-w-0">
          <UserIcon className="size-3 shrink-0 text-muted-foreground" />
          <span className="text-xs font-medium truncate">{name}</span>
          {name !== email && (
            <span className="text-[10px] text-muted-foreground truncate">
              ({email})
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
          disabled={!hasNext}
          onClick={() => setPreviewRecipientIndex(safeIndex + 1)}
        >
          <ChevronRightIcon className="size-3" />
        </Button>

        <span className="text-[10px] text-muted-foreground shrink-0 ml-auto">
          {safeIndex + 1} / {toRecipients.length}
        </span>
      </div>

      {/* Show resolved merge tag values */}
      {mergeContext && currentRecipient.type === "contact" && (
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-muted-foreground">
          {mergeContext.firstName && (
            <span className="rounded bg-primary/10 px-1 py-0.5 text-primary">
              {"{first_name}"} = {mergeContext.firstName}
            </span>
          )}
          {mergeContext.company && (
            <span className="rounded bg-primary/10 px-1 py-0.5 text-primary">
              {"{company}"} = {mergeContext.company}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
