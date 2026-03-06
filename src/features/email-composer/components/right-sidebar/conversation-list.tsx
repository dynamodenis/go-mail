import { MessageSquareIcon } from "lucide-react";

/**
 * Conversation message list — displays collaboration chat messages.
 * TODO: Wire to real conversation data via React Query when the
 * conversation server functions are implemented.
 */
export default function ConversationList() {
  // Placeholder: no messages yet
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-8">
      <MessageSquareIcon className="size-8 text-muted-foreground/30 mb-3" />
      <p className="text-xs text-muted-foreground text-center">
        No conversations yet
      </p>
      <p className="text-[10px] text-muted-foreground/60 text-center mt-1">
        Start a conversation to collaborate on this email draft with your team.
      </p>
    </div>
  );
}
