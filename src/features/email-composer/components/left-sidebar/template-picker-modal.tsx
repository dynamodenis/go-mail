import { useState } from "react";
import { SearchIcon, FileTextIcon, CheckIcon, PlusIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTemplates } from "@/features/email-templates/api/queries";
import type { Template } from "@/features/email-templates/types";
import { cn } from "@/lib/utils";
import { useEmailComposerStore } from "../../api/store";

import { Button } from "@/components/ui/button";
import { useTemplatesUIStore } from "@/features/email-templates/api/store";
import { CreateTemplateModal } from "@/features/email-templates/components/create-template-modal";

interface TemplatePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: Template) => void;
}

export default function TemplatePickerModal({
  open,
  onOpenChange,
  onSelect,
}: TemplatePickerModalProps) {
  const [search, setSearch] = useState("");
  const selectedTemplate = useEmailComposerStore((s) => s.selectedTemplate);
  const { isCreateModalOpen, setCreateModalOpen } =
		useTemplatesUIStore();

  const { data: templatesResult, isLoading } = useTemplates({
    search: search || undefined,
    page: 1,
    pageSize: 50,
  });

  const templates: Template[] = (() => {
    if (!templatesResult) return [];
    if ("error" in templatesResult) return [];
    return templatesResult.data?.data ?? [];
  })();

  return (
  <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[500px] max-h-[70vh] p-0 overflow-hidden">
        <DialogTitle className="px-2 pt-4 text-sm font-medium">
          Select Template

          {/* Button to open full template picker modal */}
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-6 p-0 shrink-0 float-right"
          onClick={() => setCreateModalOpen(true)}
          title="Create new template"
        >
          <PlusIcon className="size-3.5" />
        </Button>
        </DialogTitle>

        {/* Search */}
        <div className="p-2">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        {/* Template list */}
        <div className="overflow-y-auto max-h-[50vh] px-2 pb-4">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              {search ? "No templates match your search" : "No templates yet"}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {templates.map((template) => {
                const isSelected = selectedTemplate?.id === template.id;
                return (
                  <button
                    key={template.id}
                    type="button"
                    className={cn(
                      "flex items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors w-full",
                      isSelected
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-accent border border-transparent",
                    )}
                    onClick={() => onSelect(template)}
                  >
                    <FileTextIcon className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium truncate">
                          {template.name}
                        </span>
                        {isSelected && (
                          <CheckIcon className="size-3.5 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        Subject: {template.subject}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {template.category}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    <CreateTemplateModal />
  </>
  );
}
