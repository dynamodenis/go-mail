import { useCallback, useMemo } from "react";
import type { Editor, JSONContent } from "@tiptap/react";
import { PencilIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmailComposerStore } from "../../api/store";
import { composerRefs } from "../../api/store";
import { NotionEditor, MergeTag } from "@/features/tiptap-editor";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getRecipientEmail, getRecipientName } from "../../types";

const MERGE_TAG_EXTENSIONS = [MergeTag];

export default function ComposerBody() {
  const setBodyHtml = useEmailComposerStore((s) => s.setBodyHtml);
  const selectedTemplate = useEmailComposerStore((s) => s.selectedTemplate);
  const toRecipients = useEmailComposerStore((s) => s.toRecipients);
  const activeRecipientEmail = useEmailComposerStore((s) => s.activeRecipientEmail);
  const recipientRooms = useEmailComposerStore((s) => s.recipientRooms);
  const selectRecipientForPreview = useEmailComposerStore((s) => s.selectRecipientForPreview);
  const setEditorRef = useEmailComposerStore((s) => s.setEditorRef);
  const recipientRoomInitialized = useEmailComposerStore((s) => s.recipientRoomInitialized);
  const recipientContentChanged = useEmailComposerStore((s) => s.recipientContentChanged);
  const currentUser = useCurrentUser();

  const editorUser = {
    id: currentUser?.id ?? "local",
    name: currentUser?.fullName ?? "",
    avatar: currentUser?.avatarUrl ?? "",
    color: "#000",
  };

  // Determine which room to show: recipient-specific or template
  const templateRoom = selectedTemplate?.tiptapReference ?? "";
  const isRecipientMode = activeRecipientEmail !== null;
  const activeRecipientRoomId = activeRecipientEmail
    ? (recipientRooms[activeRecipientEmail] ?? null)
    : null;
  const roomId = activeRecipientRoomId || templateRoom;

  // Get initial content for recipient room (resolved merge tags)
  const recipientInitialContent: JSONContent | null = useMemo(() => {
    if (
      activeRecipientEmail &&
      activeRecipientRoomId &&
      !composerRefs.initializedRooms.has(activeRecipientRoomId)
    ) {
      return (composerRefs.pendingRecipientContent[activeRecipientEmail] as JSONContent) ?? null;
    }
    return null;
  }, [activeRecipientEmail, activeRecipientRoomId]);

  const activeRecipientName = useMemo(() => {
    if (!activeRecipientEmail) return null;
    const recipient = toRecipients.find(
      (r) => getRecipientEmail(r) === activeRecipientEmail,
    );
    return recipient ? getRecipientName(recipient) : activeRecipientEmail;
  }, [activeRecipientEmail, toRecipients]);

  const handleEditorReady = useCallback(
    (editor: Editor) => {
      setEditorRef(editor);

      // For recipient rooms: seed with resolved content if room is empty
      if (activeRecipientRoomId && recipientInitialContent) {
        const content = recipientInitialContent;
        const currentRoom = activeRecipientRoomId;
        setTimeout(() => {
          if (editor.isEmpty) {
            editor.commands.setContent(content);
          }
          recipientRoomInitialized(currentRoom);
        }, 100);
      } else if (!isRecipientMode) {
        // Template mode: restore body if available
        const currentHtml = useEmailComposerStore.getState().bodyHtml;
        if (currentHtml && editor.isEmpty) {
          editor.commands.setContent(currentHtml);
        }
      }

      requestAnimationFrame(() => {
        editor.commands.focus("start");
      });
    },
    [activeRecipientRoomId, recipientInitialContent, isRecipientMode, setEditorRef, recipientRoomInitialized],
  );

  const handleChange = useCallback(
    (html: string) => {
      if (isRecipientMode) {
        recipientContentChanged(html);
        return;
      }
      setBodyHtml(html);
    },
    [isRecipientMode, setBodyHtml, recipientContentChanged],
  );

  // Header bar showing which mode we're in
  const modeBar = isRecipientMode ? (
    <div className="flex items-center gap-2 border-b bg-primary/5 px-4 py-1.5">
      <UserIcon className="size-3.5 text-primary" />
      <span className="text-xs text-muted-foreground">
        Editing for <span className="font-medium text-foreground">{activeRecipientName}</span>
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="ml-auto h-6 gap-1.5 text-[11px]"
        onClick={() => selectRecipientForPreview(null)}
      >
        <PencilIcon className="size-3" />
        Back to template
      </Button>
    </div>
  ) : null;

  if (selectedTemplate) {
    return (
      <div className="flex flex-col h-full">
        {modeBar}
        <div className="border-t py-2 px-4">
          <div className="composer-body-editor relative min-h-[200px]">
            <div className="h-full overflow-y-auto px-4 pb-4">
              <NotionEditor
                key={roomId}
                room={roomId}
                parentSelector=".composer-body-editor"
                user={editorUser}
                showTitle={false}
                additionalExtensions={MERGE_TAG_EXTENSIONS}
                onEditorReady={handleEditorReady}
                onChange={handleChange}
                paragraphPlaceholder={
                  isRecipientMode
                    ? `Editing email for ${activeRecipientName}...`
                    : "Edit template body..."
                }
                tiptapCollabToken={currentUser?.tiptapCollabJwt ?? undefined}
                tiptapAiToken={currentUser?.tiptapAiJwt ?? undefined}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No template — free-form compose mode
  return (
    <div className="flex flex-col h-full">
      {modeBar}
      <div className="composer-body-editor relative h-full min-h-[300px]">
        <div className="h-full overflow-y-auto px-4">
          <NotionEditor
            key={roomId}
            room={roomId}
            parentSelector=".composer-body-editor"
            user={editorUser}
            showTitle={false}
            additionalExtensions={MERGE_TAG_EXTENSIONS}
            onEditorReady={handleEditorReady}
            onChange={handleChange}
            paragraphPlaceholder={
              isRecipientMode
                ? `Editing email for ${activeRecipientName}...`
                : "Write your email..."
            }
            tiptapCollabToken={currentUser?.tiptapCollabJwt ?? undefined}
            tiptapAiToken={currentUser?.tiptapAiJwt ?? undefined}
          />
        </div>
      </div>
    </div>
  );
}
