import { useState } from "react";
import { XIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEmailComposerStore } from "../../api/store";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function EmailChipList({
  label,
  emails,
  onAdd,
  onRemove,
}: {
  label: string;
  emails: { email: string; name?: string }[];
  onAdd: (email: string) => void;
  onRemove: (email: string) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

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

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground">{label}:</span>
      <Input
        placeholder={`Add ${label.toLowerCase()}...`}
        value={value}
        onChange={(e) => {
          setError(false);
          if (e.target.value.includes(",")) {
            addEmail(e.target.value);
          } else {
            setValue(e.target.value);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addEmail(value);
          }
        }}
        onBlur={() => {
          if (value.trim()) addEmail(value);
        }}
        className={`h-7 text-xs ${error ? "border-destructive" : ""}`}
      />
      {emails.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {emails.map((entry) => (
            <span
              key={entry.email}
              className="inline-flex items-center gap-1 rounded-md bg-accent px-1.5 py-0.5 text-[10px]"
            >
              {entry.email}
              <button
                type="button"
                onClick={() => onRemove(entry.email)}
                className="text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-2.5" />
              </button>
            </span>
          ))}
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
  const removeBccRecipient = useEmailComposerStore((s) => s.removeBccRecipient);

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
      <EmailChipList
        label="Cc"
        emails={ccRecipients}
        onAdd={addCcRecipient}
        onRemove={removeCcRecipient}
      />
      <EmailChipList
        label="Bcc"
        emails={bccRecipients}
        onAdd={addBccRecipient}
        onRemove={removeBccRecipient}
      />
    </div>
  );
}
