import { useCallback, useEffect, useRef, useState } from "react";
import { SearchIcon, LoaderIcon, UsersIcon, UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearchContacts, useSearchCollections } from "@/features/collections/api/queries";
import { getContacts } from "@/features/contacts/api/server";
import type { Contact } from "@/features/contacts/schemas/types";
import type { Collection } from "@/features/collections/schemas/types";
import { cn } from "@/lib/utils";
import { useEmailComposerStore, type EmailComposerStoreType } from "../../api/store";
import { getRecipientEmail } from "../../types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RecipientSearch() {
  const recipientSearch = useEmailComposerStore((s) => s.recipientSearch);
  const setRecipientSearch = useEmailComposerStore((s) => s.setRecipientSearch);
  const addContactRecipient = useEmailComposerStore((s) => s.addContactRecipient);
  const addManualRecipient = useEmailComposerStore((s) => s.addManualRecipient);
  const bulkAddContactRecipients = useEmailComposerStore((s) => s.bulkAddContactRecipients);
  const toRecipients = useEmailComposerStore((s) => s.toRecipients);

  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState(false);
  const [loadingCollectionId, setLoadingCollectionId] = useState<string | null>(null);

  const { data: contactsData, isLoading: isLoadingContacts } =
    useSearchContacts(recipientSearch);
  const { data: collectionsData, isLoading: isLoadingCollections } =
    useSearchCollections(recipientSearch);

  const contacts = contactsData?.contacts ?? [];
  const collections = collectionsData?.collections ?? [];

  const hasQuery = recipientSearch.trim().length > 0;
  const isSearching = isLoadingContacts || isLoadingCollections;
  const hasResults = contacts.length > 0 || collections.length > 0;
  const showSuggestions = isFocused && hasQuery;

  const isSelected = (contact: Contact) =>
    toRecipients.some((r) => getRecipientEmail(r) === contact.email);

  const handleSelectContact = (contact: Contact) => {
    addContactRecipient(contact);
    setRecipientSearch("");
    setError(false);
  };

  const handleSelectCollection = useCallback(
    async (collection: Collection) => {
      setLoadingCollectionId(collection.id);
      try {
        const result = await getContacts({
          data: {
            collectionId: collection.id,
            page: 1,
            pageSize: 1000,
          },
        });
        if (!("error" in result)) {
          bulkAddContactRecipients(result.data.data);
        }
      } finally {
        setLoadingCollectionId(null);
        setRecipientSearch("");
      }
    },
    [bulkAddContactRecipients, setRecipientSearch],
  );

  const addEmail = (raw: string) => {
    const email = raw.trim().replace(/,$/, "").trim();
    if (!email) return;
    if (!EMAIL_REGEX.test(email)) {
      setError(true);
      return;
    }
    setError(false);
    addManualRecipient(email);
    setRecipientSearch("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmail(recipientSearch);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(false);
    const value = e.target.value;
    if (value.includes(",")) {
      addEmail(value);
    } else {
      setRecipientSearch(value);
    }
  };

  const handleBlur = () => {
    // Delay to allow click on suggestions
    setTimeout(() => {
      if (recipientSearch.trim()) {
        addEmail(recipientSearch);
      }
      setIsFocused(false);
    }, 200);
  };

  return (
    <div className="flex flex-col gap-1 px-3 py-1">
      <span className="text-xs text-muted-foreground">Recipients</span>
      <div className="relative">
        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          placeholder="Search contacts, collections, or type email..."
          value={recipientSearch}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => setIsFocused(true)}
          className={cn(
            "pl-7 h-8 text-xs",
            error && "border-destructive text-destructive",
          )}
        />

        {/* Suggestions dropdown */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border bg-popover shadow-md">
            {isSearching && !hasResults && (
              <div className="flex items-center justify-center gap-2 px-3 py-3">
                <LoaderIcon className="size-3.5 animate-spin" />
                <span className="text-xs text-muted-foreground">
                  Searching...
                </span>
              </div>
            )}

            {!isSearching && !hasResults && (
              <div className="px-3 py-3 text-xs text-muted-foreground">
                No results. Press Enter to add as email.
              </div>
            )}

            {/* Contacts */}
            {contacts.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Contacts
                </div>
                {contacts.map((contact) => {
                  const selected = isSelected(contact);
                  return (
                    <button
                      key={contact.id}
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors",
                        selected
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-accent",
                      )}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectContact(contact)}
                    >
                      <UserIcon className="size-3.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {[contact.firstName, contact.lastName]
                            .filter(Boolean)
                            .join(" ") || contact.email}
                        </span>
                        <span className="block truncate text-[10px] text-muted-foreground">
                          {contact.email}
                        </span>
                      </div>
                      {selected && (
                        <span className="text-[10px] text-primary">Added</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Collections */}
            {collections.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Collections
                </div>
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-accent transition-colors"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectCollection(collection)}
                    disabled={loadingCollectionId === collection.id}
                  >
                    <UsersIcon className="size-3.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {collection.name}
                      </span>
                      <span className="block truncate text-[10px] text-muted-foreground">
                        {collection.contactCount} contacts
                      </span>
                    </div>
                    {loadingCollectionId === collection.id && (
                      <LoaderIcon className="size-3 animate-spin" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
