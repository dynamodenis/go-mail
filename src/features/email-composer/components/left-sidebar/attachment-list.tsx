import { PaperclipIcon, XIcon, FileTextIcon, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmailComposerStore, composerRefs } from "../../api/store";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  return FileTextIcon;
}

export default function AttachmentList() {
  const fileVersion = useEmailComposerStore((s) => s.fileVersion);
  const removeFile = useEmailComposerStore((s) => s.removeFile);

  // fileVersion triggers re-render; actual files in composerRefs
  void fileVersion;
  const files = composerRefs.localFiles;

  return (
    <div className="flex flex-col gap-1 px-3 py-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Attachments</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px]"
          onClick={() => composerRefs.openFilePicker?.()}
        >
          <PaperclipIcon className="size-3 mr-1" />
          Add
        </Button>
      </div>

      {files.length > 0 && (
        <div className="flex flex-col gap-0.5">
          {files.map((file, index) => {
            const Icon = getFileIcon(file.type);
            return (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-1.5 rounded-md bg-accent/50 px-2 py-1 group"
              >
                <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-xs">
                  {file.name}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatFileSize(file.size)}
                </span>
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  onClick={() => removeFile(index)}
                >
                  <XIcon className="size-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {files.length === 0 && (
        <p className="text-[10px] text-muted-foreground">
          No files attached
        </p>
      )}
    </div>
  );
}
