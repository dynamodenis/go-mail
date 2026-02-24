import type { Editor } from "@tiptap/react";

// --- Hooks ---
import { useTiptapEditor } from "@/features/tiptap-editor/hooks/use-tiptap-editor";

// --- Lib ---
import { isNodeTypeSelected } from "@/features/tiptap-editor/lib/tiptap-utils";

// --- Tiptap UI ---
import { DeleteNodeButton } from "@/features/tiptap-editor/components/tiptap-ui/delete-node-button";
import { ImageDownloadButton } from "@/features/tiptap-editor/components/tiptap-ui/image-download-button";
import { ImageAlignButton } from "@/features/tiptap-editor/components/tiptap-ui/image-align-button";

// --- UI Primitive ---
import { Separator } from "@/features/tiptap-editor/components/tiptap-ui-primitive/separator";
import { ImageCaptionButton } from "@/features/tiptap-editor/components/tiptap-ui/image-caption-button";
import { ImageUploadButton } from "@/features/tiptap-editor/components/tiptap-ui/image-upload-button";
import { RefreshCcwIcon } from "@/features/tiptap-editor/components/tiptap-icons/refresh-ccw-icon";

export function ImageNodeFloating({
  editor: providedEditor,
}: {
  editor?: Editor | null;
}) {
  const { editor } = useTiptapEditor(providedEditor);
  const visible = isNodeTypeSelected(editor, ["image"]);

  if (!editor || !visible) {
    return null;
  }

  return (
    <>
      <ImageAlignButton align="left" />
      <ImageAlignButton align="center" />
      <ImageAlignButton align="right" />
      <Separator />
      <ImageCaptionButton />
      <Separator />
      <ImageDownloadButton />
      <ImageUploadButton icon={RefreshCcwIcon} tooltip="Replace" />
      <Separator />
      <DeleteNodeButton />
    </>
  );
}
