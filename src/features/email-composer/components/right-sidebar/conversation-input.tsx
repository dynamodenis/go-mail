import { SendHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmailComposerStore } from "../../api/store";

export default function ConversationInput() {
  const conversationMessage = useEmailComposerStore(
    (s) => s.conversationMessage,
  );
  const setConversationMessage = useEmailComposerStore(
    (s) => s.setConversationMessage,
  );

  const handleSend = () => {
    if (!conversationMessage.trim()) return;
    // TODO: Call server function to send conversation message
    setConversationMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t p-3">
      <div className="flex items-end gap-2">
        <textarea
          value={conversationMessage}
          onChange={(e) => setConversationMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={2}
          className="flex-1 resize-none rounded-md border bg-transparent px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 shrink-0"
          disabled={!conversationMessage.trim()}
          onClick={handleSend}
        >
          <SendHorizontalIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
