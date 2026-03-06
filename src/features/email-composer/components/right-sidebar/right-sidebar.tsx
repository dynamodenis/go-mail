import { MessageSquareIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmailComposerStore } from "../../api/store";
import ConversationList from "./conversation-list";
import ConversationInput from "./conversation-input";

export default function RightSidebar() {
  const toggleRightSidebar = useEmailComposerStore((s) => s.toggleRightSidebar);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <MessageSquareIcon className="size-4 text-primary" />
          <span className="text-sm font-medium">Conversations</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={toggleRightSidebar}
        >
          <XIcon className="size-3.5" />
        </Button>
      </div>

      {/* Info text */}
      <div className="px-3 py-2 border-b">
        <p className="text-[10px] text-muted-foreground">
          Share this composer with team members to collaborate on email drafts before sending.
        </p>
      </div>

      {/* Conversation messages */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ConversationList />
      </div>

      {/* Message input */}
      <ConversationInput />
    </div>
  );
}
