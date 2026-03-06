import { ChevronDownIcon, PlusIcon, FileTextIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTemplates } from "@/features/email-templates/api/queries";
import type { Template } from "@/features/email-templates/types";
import { useEmailComposerStore } from "../../api/store";
import TemplatePickerModal from "./template-picker-modal";

export default function TemplateSelector() {
  const selectedTemplate = useEmailComposerStore((s) => s.selectedTemplate);
  const setSelectedTemplate = useEmailComposerStore(
    (s) => s.setSelectedTemplate,
  );
  const isTemplateModalOpen = useEmailComposerStore(
    (s) => s.isTemplateModalOpen,
  );
  const setTemplateModalOpen = useEmailComposerStore(
    (s) => s.setTemplateModalOpen,
  );

  const { data: templatesResult } = useTemplates({ page: 1, pageSize: 50 });

  const templates: Template[] = (() => {
    if (!templatesResult) return [];
    if ("error" in templatesResult) return [];
    return templatesResult.data?.data ?? [];
  })();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2 px-3 py-2">
      <span className="text-xs text-muted-foreground">Template</span>

      <div className="flex items-center gap-1">
        {/* Dropdown to select from recent templates */}
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 justify-between text-xs h-8"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <FileTextIcon className="size-3.5 shrink-0" />
                <span className="truncate">
                  {selectedTemplate?.name ?? "Select template..."}
                </span>
              </div>
              <ChevronDownIcon className="size-3.5 shrink-0 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[240px]">
            {templates.length === 0 ? (
              <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                No templates yet
              </div>
            ) : (
              templates.slice(0, 10).map((template) => (
                <DropdownMenuItem
                  key={template.id}
                  className="text-xs cursor-pointer"
                  onClick={() => {
                    setSelectedTemplate(template);
                    setDropdownOpen(false);
                  }}
                >
                  <FileTextIcon className="size-3.5 mr-1.5 shrink-0" />
                  <span className="truncate">{template.name}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Button to open full template picker modal */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 shrink-0"
          onClick={() => setTemplateModalOpen(true)}
        >
          <PlusIcon className="size-3.5" />
        </Button>
      </div>

      {/* Template picker modal */}
      <TemplatePickerModal
        open={isTemplateModalOpen}
        onOpenChange={setTemplateModalOpen}
        onSelect={setSelectedTemplate}
      />
    </div>
  );
}
