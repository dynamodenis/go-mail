import { useState } from "react";
import {
  XIcon,
  PlusIcon,
  SearchIcon,
  LoaderIcon,
  UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchContacts } from "@/features/collections/api/queries";
import type { Contact } from "@/features/contacts/schemas/types";
import { cn } from "@/lib/utils";
import { useEmailComposerStore } from "../../api/store";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CcBccEntry {
  email: string;
  name?: string;
}

function CcBccSearchField({
  label,
  entries,
  onAdd,
  onRemove,
}: {
  label: string;
  entries: CcBccEntry[];
  onAdd: (email: string, name?: string) => void;
  onRemove: (email: string) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const { data: contactsData, isLoading } = useSearchContacts(value);
  const contacts = contactsData?.contacts ?? [];

  const hasQuery = value.trim().length > 0;
  const showSuggestions = isFocused && hasQuery;
  const isAlreadyAdded = (email: string) =>
    entries.some((e) => e.email === email);

  const addEmail = (raw: string) => {
    const email = raw.trim().replace(/,$/, "").trim();
    if (!email) return;
    if (!EMAIL_REGEX.test(email)) {
      setError(true);
      return;
    }
    setError(false);
    onAdd(email);
    setValue("");
  };

  const handleSelectContact = (contact: Contact) => {
    const name =
      [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
      undefined;
    onAdd(contact.email, name);
    setValue("");
    setError(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmail(value);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(false);
    const v = e.target.value;
    if (v.includes(",")) {
      addEmail(v);
    } else {
      setValue(v);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (value.trim()) addEmail(value);
      setIsFocused(false);
    }, 200);
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </span>

      {/* Search input */}
      <div className="relative">
        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          placeholder="Search contacts or type email..."
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => setIsFocused(true)}
          className={cn(
            "pl-7 h-7 text-xs",
            error && "border-destructive text-destructive",
          )}
        />

        {/* Contact suggestions dropdown */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-40 overflow-y-auto rounded-md border bg-popover shadow-md">
            {isLoading && contacts.length === 0 && (
              <div className="flex items-center justify-center gap-2 px-3 py-2">
                <LoaderIcon className="size-3 animate-spin" />
                <span className="text-xs text-muted-foreground">
                  Searching...
                </span>
              </div>
            )}

            {!isLoading && contacts.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                No results. Press Enter to add as email.
              </div>
            )}

            {contacts.map((contact) => {
              const added = isAlreadyAdded(contact.email);
              const displayName =
                [contact.firstName, contact.lastName]
                  .filter(Boolean)
                  .join(" ") || contact.email;
              return (
                <button
                  key={contact.id}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors",
                    added ? "bg-primary/10 text-primary" : "hover:bg-accent",
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectContact(contact)}
                >
                  <UserIcon className="size-3.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {displayName}
                    </span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {contact.email}
                    </span>
                  </div>
                  {added && (
                    <span className="text-[10px] text-primary">Added</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Recipient chips — styled like the To recipient list */}
      {entries.length > 0 && (
        <div className="flex flex-col gap-0.5 max-h-[120px] overflow-y-auto">
          {entries.map((entry) => {
            const hasName = entry.name && entry.name !== entry.email;
            return (
              <div
                key={entry.email}
                className="flex items-center gap-2 rounded-md px-2 py-1 group bg-accent/50 hover:bg-accent/80 transition-colors"
              >
                <div className="flex size-5 items-center justify-center rounded-full shrink-0 bg-primary/10">
                  <UserIcon className="size-3 text-primary/70" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">
                    {entry.name || entry.email}
                  </span>
                  {hasName && (
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {entry.email}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => onRemove(entry.email)}
                >
                  <XIcon className="size-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CcBccFields() {
  const showCcBcc = useEmailComposerStore((s) => s.showCcBcc);
  const setShowCcBcc = useEmailComposerStore((s) => s.setShowCcBcc);
  const ccRecipients = useEmailComposerStore((s) => s.ccRecipients);
  const bccRecipients = useEmailComposerStore((s) => s.bccRecipients);
  const addCcRecipient = useEmailComposerStore((s) => s.addCcRecipient);
  const removeCcRecipient = useEmailComposerStore((s) => s.removeCcRecipient);
  const addBccRecipient = useEmailComposerStore((s) => s.addBccRecipient);
  const removeBccRecipient = useEmailComposerStore(
    (s) => s.removeBccRecipient,
  );

  if (!showCcBcc) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-[10px] text-muted-foreground justify-start px-3 py-1"
        onClick={() => setShowCcBcc(true)}
      >
        <PlusIcon className="size-3 mr-1" />
        Add Cc / Bcc
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-3 py-1">
      <CcBccSearchField
        label="Cc"
        entries={ccRecipients}
        onAdd={addCcRecipient}
        onRemove={removeCcRecipient}
      />
      <CcBccSearchField
        label="Bcc"
        entries={bccRecipients}
        onAdd={addBccRecipient}
        onRemove={removeBccRecipient}
      />
    </div>
  );
}
