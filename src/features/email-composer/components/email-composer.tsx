import { XIcon, PanelLeftIcon } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useEmailComposerStore, composerRefs } from "../api/store";
import LeftSidebar from "./left-sidebar/left-sidebar";
import CenterPanel from "./center-panel/center-panel";
import RightSidebar from "./right-sidebar/right-sidebar";

export default function EmailComposer() {
  const open = useEmailComposerStore((s) => s.open);
  const setOpen = useEmailComposerStore((s) => s.setOpen);
  const reset = useEmailComposerStore((s) => s.reset);
  const isLeftSidebarOpen = useEmailComposerStore((s) => s.isLeftSidebarOpen);
  const isRightSidebarOpen = useEmailComposerStore((s) => s.isRightSidebarOpen);
  const toggleLeftSidebar = useEmailComposerStore((s) => s.toggleLeftSidebar);
  const addFiles = useEmailComposerStore((s) => s.addFiles);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    composerRefs.openFilePicker = () => fileInputRef.current?.click();
    return () => {
      composerRefs.openFilePicker = null;
    };
  }, []);

  const handleAttachFiles = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      addFiles(Array.from(files));
      e.target.value = "";
    },
    [addFiles],
  );

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "flex flex-col p-0 overflow-hidden",
          // Mobile: full screen (base already has inset-0)
          "h-full w-full",
          // sm+: centered modal that scales with viewport
          "sm:h-[85vh] sm:w-[92vw] sm:max-w-[1200px]",
          // lg+: bigger
          "lg:h-[80vh] lg:w-[88vw] lg:max-w-[1400px]",
          // xl: even bigger
          "xl:h-[85vh] xl:max-w-[1600px]",
        )}
      >
        <DialogTitle className="sr-only">Outreach Emails</DialogTitle>

        {/* Top toolbar — fixed height, never scrolls */}
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLeftSidebar}
              className={cn(
                "h-8 w-8 p-0 hidden sm:inline-flex",
                isLeftSidebarOpen && "bg-accent",
              )}
            >
              <PanelLeftIcon className="size-4" />
            </Button>
            <span className="text-sm font-medium">Outreach Emails</span>
          </div>

          <div className="flex items-center gap-2">
            <DialogClose
              className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <XIcon className="size-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </div>

        {/* Three-panel layout — fills remaining height */}
        {/* Mobile: stacked column | Desktop: side-by-side row */}
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row overflow-hidden">
          {/* Left sidebar */}
          {isLeftSidebarOpen && (
            <div
              className={cn(
                "shrink-0 border-b sm:border-b-0 sm:border-r overflow-y-auto",
                // Mobile: limited height, full width
                "max-h-[40vh] sm:max-h-none",
                // Desktop: fixed width sidebar
                "sm:w-[260px] md:w-[280px] lg:w-[300px]",
              )}
            >
              <LeftSidebar />
            </div>
          )}

          {/* Center panel — takes remaining space, scrolls internally */}
          <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
            <CenterPanel />
          </div>

          {/* Right sidebar — hidden on mobile */}
          {isRightSidebarOpen && (
            <div
              className={cn(
                "shrink-0 border-t sm:border-t-0 sm:border-l overflow-y-auto",
                "hidden sm:block",
                "sm:w-[240px] md:w-[260px] lg:w-[280px]",
              )}
            >
              <RightSidebar />
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleAttachFiles}
        />
      </DialogContent>
    </Dialog>
  );
}
