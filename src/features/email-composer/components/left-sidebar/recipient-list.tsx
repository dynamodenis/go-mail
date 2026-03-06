import { XIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmailComposerStore } from "../../api/store";
import { getRecipientEmail, getRecipientName } from "../../types";

export default function RecipientList() {
  const toRecipients = useEmailComposerStore((s) => s.toRecipients);
  const removeRecipient = useEmailComposerStore((s) => s.removeRecipient);

  if (toRecipients.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 px-3 py-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          To ({toRecipients.length})
        </span>
      </div>
      <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto">
        {toRecipients.map((recipient) => {
          const email = getRecipientEmail(recipient);
          const name = getRecipientName(recipient);
          const isContact = recipient.type === "contact";

          return (
            <div
              key={email}
              className="flex items-center gap-2 rounded-md bg-accent/50 px-2 py-1 group"
            >
              <div className="flex size-5 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <UserIcon className="size-3 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">
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
                onClick={() => removeRecipient(email)}
              >
                <XIcon className="size-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
