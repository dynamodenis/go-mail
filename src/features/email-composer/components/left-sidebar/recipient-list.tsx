import { useCallback, useRef } from "react";
import { XIcon, UserIcon, LoaderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmailComposerStore } from "../../api/store";
import { getRecipientEmail, getRecipientName } from "../../types";

export default function RecipientList() {
  const toRecipients = useEmailComposerStore((s) => s.toRecipients);
  const removeRecipient = useEmailComposerStore((s) => s.removeRecipient);
  const activeRecipientEmail = useEmailComposerStore((s) => s.activeRecipientEmail);
  const selectRecipientForPreview = useEmailComposerStore((s) => s.selectRecipientForPreview);
  const isLoadingMore = useEmailComposerStore((s) => s.isLoadingMoreRecipients);
  const loadMore = useEmailComposerStore((s) => s.loadMoreCollectionRecipients);
  const collectionTotal = useEmailComposerStore((s) => s.collectionTotal);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const nearBottom = scrollHeight - scrollTop - clientHeight < 40;
    if (nearBottom && useEmailComposerStore.getState().hasMoreCollectionRecipients()) {
      loadMore();
    }
  }, [loadMore]);

  if (toRecipients.length === 0) return null;

  const hasMore = useEmailComposerStore.getState().hasMoreCollectionRecipients();

  return (
    <div className="flex flex-col gap-1 px-3 py-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          To ({toRecipients.length}{collectionTotal > toRecipients.length ? ` / ${collectionTotal}` : ""})
        </span>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto"
      >
        {toRecipients.map((recipient) => {
          const email = getRecipientEmail(recipient);
          const name = getRecipientName(recipient);
          const isContact = recipient.type === "contact";
          const isSelected = email === activeRecipientEmail;

          return (
            <button
              type="button"
              key={email}
              onClick={() => selectRecipientForPreview(email)}
              className={`flex items-center gap-2 rounded-md px-2 py-1 group text-left transition-colors ${
                isSelected
                  ? "bg-primary/15 ring-1 ring-primary/30"
                  : "bg-accent/50 hover:bg-accent/80"
              }`}
            >
              <div className={`flex size-5 items-center justify-center rounded-full shrink-0 ${
                isSelected ? "bg-primary/20" : "bg-primary/10"
              }`}>
                <UserIcon className={`size-3 ${isSelected ? "text-primary" : "text-primary/70"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <span className={`block truncate text-xs ${isSelected ? "font-semibold text-foreground" : "font-medium"}`}>
                  {name}
                </span>
                {isContact && name !== email && (
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {email}
                  </span>
                )}
              </div>
              {isContact && recipient.contact.company && (
                <span className="hidden group-hover:block text-[10px] text-muted-foreground shrink-0">
                  {recipient.contact.company}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removeRecipient(email);
                }}
              >
                <XIcon className="size-3" />
              </Button>
            </button>
          );
        })}

        {/* Loading indicator */}
        {isLoadingMore && (
          <div className="flex items-center justify-center py-2">
            <LoaderIcon className="size-3.5 animate-spin text-muted-foreground" />
            <span className="ml-1.5 text-[10px] text-muted-foreground">Loading more...</span>
          </div>
        )}

        {/* Load more hint */}
        {!isLoadingMore && hasMore && (
          <div className="py-1 text-center text-[10px] text-muted-foreground">
            Scroll for more
          </div>
        )}
      </div>
    </div>
  );
}
