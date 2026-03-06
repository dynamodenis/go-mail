import { useMemo } from "react";
import { useEmailComposerStore } from "../../api/store";
import { resolveTemplateHtml } from "@/features/email-templates/utils/resolve-merge-tags";
import type { MergeTagContext } from "../../types";

interface ComposerBodyProps {
  mergeContext: MergeTagContext | null;
}

export default function ComposerBody({ mergeContext }: ComposerBodyProps) {
  const bodyHtml = useEmailComposerStore((s) => s.bodyHtml);
  const setBodyHtml = useEmailComposerStore((s) => s.setBodyHtml);
  const selectedTemplate = useEmailComposerStore((s) => s.selectedTemplate);

  // Resolve merge tags in the template body for preview
  const resolvedHtml = useMemo(() => {
    if (!bodyHtml) return "";
    if (!mergeContext) return bodyHtml;

    return resolveTemplateHtml(bodyHtml, {
      firstName: mergeContext.firstName ?? null,
      lastName: mergeContext.lastName ?? null,
      email: mergeContext.email,
    });
  }, [bodyHtml, mergeContext]);

  // If we have a template, show the resolved preview + raw editor
  // If no template, show a simple textarea editor
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

        {/* Raw HTML editor (collapsible) */}
        <div className="border-t p-4">
          <details>
            <summary className="text-[10px] text-muted-foreground cursor-pointer mb-2">
              Edit raw template body
            </summary>
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              className="w-full min-h-[120px] rounded-md border bg-transparent p-3 text-xs font-mono resize-y focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Template HTML body..."
            />
          </details>
        </div>
      </div>
    );
  }

  // No template — free-form compose mode
  return (
    <div className="p-4 h-full">
      <textarea
        value={bodyHtml}
        onChange={(e) => setBodyHtml(e.target.value)}
        className="w-full h-full min-h-[300px] rounded-md border bg-transparent p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="Write your email..."
      />
    </div>
  );
}
