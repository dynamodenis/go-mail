import { useCallback, useMemo } from "react";
import type { Editor } from "@tiptap/react";
import { useEmailComposerStore } from "../../api/store";
import { resolveTemplateHtml } from "@/features/email-templates/utils/resolve-merge-tags";
import { NotionEditor, MergeTag } from "@/features/tiptap-editor";
import type { MergeTagContext } from "../../types";

const LOCAL_USER = {
  id: "local",
  name: "",
  avatar: "",
  color: "#000",
};

const MERGE_TAG_EXTENSIONS = [MergeTag];

interface ComposerBodyProps {
  mergeContext: MergeTagContext | null;
}

export default function ComposerBody({ mergeContext }: ComposerBodyProps) {
  const bodyHtml = useEmailComposerStore((s) => s.bodyHtml);
  const setBodyHtml = useEmailComposerStore((s) => s.setBodyHtml);
  const selectedTemplate = useEmailComposerStore((s) => s.selectedTemplate);

  const editorRoom = selectedTemplate?.tiptapReference ?? "";

  const resolvedHtml = useMemo(() => {
    if (!bodyHtml) return "";
    if (!mergeContext) return bodyHtml;

    return resolveTemplateHtml(bodyHtml, {
      firstName: mergeContext.firstName ?? null,
      lastName: mergeContext.lastName ?? null,
      email: mergeContext.email,
    });
  }, [bodyHtml, mergeContext]);

  const handleEditorReady = useCallback((editor: Editor) => {
    const currentHtml = useEmailComposerStore.getState().bodyHtml;
    if (currentHtml && editor.isEmpty) {
      editor.commands.setContent(currentHtml);
    }
    editor.commands.focus("start");
  }, []);

  const handleChange = useCallback(
    (html: string) => {
      setBodyHtml(html);
    },
    [setBodyHtml],
  );

  if (selectedTemplate) {
    return (
      <div className="flex flex-col h-full">
        {/* Resolved preview */}
        <div className="flex-1 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Preview
            </span>
            {mergeContext && (
              <span className="text-[10px] text-muted-foreground">
                (merge tags resolved for selected recipient)
              </span>
            )}
          </div>
          <div
            className="prose prose-sm max-w-none rounded-md border bg-white p-4 dark:bg-accent/20"
            dangerouslySetInnerHTML={{ __html: resolvedHtml }}
          />
        </div>

        {/* Editable template body */}
        <div className="border-t">
          <details>
            <summary className="px-4 py-2 text-[10px] text-muted-foreground cursor-pointer">
              Edit template body
            </summary>
            <div className="composer-body-editor relative min-h-[200px]">
              <div className="h-full overflow-y-auto px-4 pb-4">
                <NotionEditor
                  key={editorRoom}
                  room={editorRoom}
                  parentSelector=".composer-body-editor"
                  user={LOCAL_USER}
                  showTitle={false}
                  additionalExtensions={MERGE_TAG_EXTENSIONS}
                  onEditorReady={handleEditorReady}
                  onChange={handleChange}
                  paragraphPlaceholder="Edit template body..."
                />
              </div>
            </div>
          </details>
        </div>
      </div>
    );
  }

  // No template — free-form compose mode with NotionEditor
  return (
    <div className="composer-body-editor relative h-full min-h-[300px]">
      <div className="h-full overflow-y-auto px-4">
        <NotionEditor
          room=""
          parentSelector=".composer-body-editor"
          user={LOCAL_USER}
          showTitle={false}
          additionalExtensions={MERGE_TAG_EXTENSIONS}
          onEditorReady={handleEditorReady}
          onChange={handleChange}
          paragraphPlaceholder="Write your email..."
        />
      </div>
    </div>
  );
}
