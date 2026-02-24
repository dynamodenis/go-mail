import { useEffect, useMemo, useState } from "react";
import { type Editor } from "@tiptap/react";
import { FloatingPortal } from "@floating-ui/react";

// --- Hooks ---
import { useTiptapEditor } from "@/features/tiptap-editor/hooks/use-tiptap-editor";
import { useUiEditorState } from "@/features/tiptap-editor/hooks/use-ui-editor-state";
import { useIsBreakpoint } from "@/features/tiptap-editor/hooks/use-is-breakpoint";
import { useFloatingToolbarVisibility } from "@/features/tiptap-editor/hooks/use-floating-toolbar-visibility";
import { useEnv } from "@/features/tiptap-editor/contexts/env-context";

// --- Node ---
import { ImageNodeFloating } from "@/features/tiptap-editor/components/tiptap-node/image-node/image-node-floating";

// --- Icons ---
import { MoreVerticalIcon } from "@/features/tiptap-editor/components/tiptap-icons/more-vertical-icon";

// --- UI ---
import { ColorTextPopover } from "@/features/tiptap-editor/components/tiptap-ui/color-text-popover";
import { CommentPopover } from "@/features/tiptap-editor/components/tiptap-ui/comment-popover";
import { ImproveDropdown } from "@/features/tiptap-editor/components/tiptap-ui/improve-dropdown";
import { LinkPopover } from "@/features/tiptap-editor/components/tiptap-ui/link-popover";
import type { Mark } from "@/features/tiptap-editor/components/tiptap-ui/mark-button";
import {
  canToggleMark,
  MarkButton,
} from "@/features/tiptap-editor/components/tiptap-ui/mark-button";
import type { TextAlign } from "@/features/tiptap-editor/components/tiptap-ui/text-align-button";
import {
  canSetTextAlign,
  TextAlignButton,
} from "@/features/tiptap-editor/components/tiptap-ui/text-align-button";
import { TurnIntoDropdown } from "@/features/tiptap-editor/components/tiptap-ui/turn-into-dropdown";

// --- Utils ---
import { isSelectionValid } from "@/features/tiptap-editor/lib/tiptap-collab-utils";

// --- Primitive UI Components ---
import type { ButtonProps } from "@/features/tiptap-editor/components/tiptap-ui-primitive/button";
import { Button } from "@/features/tiptap-editor/components/tiptap-ui-primitive/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/tiptap-editor/components/tiptap-ui-primitive/popover";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/features/tiptap-editor/components/tiptap-ui-primitive/toolbar";

// --- UI Utils ---
import { FloatingElement } from "@/features/tiptap-editor/components/tiptap-ui-utils/floating-element";

export function NotionToolbarFloating() {
  const { editor } = useTiptapEditor();
  const { PARENT_SELECTOR } = useEnv();
  const isMobile = useIsBreakpoint("max", 480);
  const { lockDragHandle, aiGenerationActive, commentInputVisible } =
    useUiEditorState(editor);

  const { shouldShow } = useFloatingToolbarVisibility({
    editor,
    isSelectionValid,
    extraHideWhen: Boolean(aiGenerationActive || commentInputVisible),
  });

  // Get the parent element for the floating portal
  const portalRoot = useMemo(() => {
    if (PARENT_SELECTOR && typeof document !== "undefined") {
      return document.querySelector(PARENT_SELECTOR) as HTMLElement | null;
    }
    return null;
  }, [PARENT_SELECTOR]);

  if (lockDragHandle || isMobile) return null;

  return (
    <FloatingPortal root={portalRoot}>
      <FloatingElement shouldShow={shouldShow}>
        <Toolbar variant="floating">
          <ToolbarGroup>
            <ImproveDropdown hideWhenUnavailable={true} />
          </ToolbarGroup>

          <ToolbarSeparator />

          <ToolbarGroup>
            <TurnIntoDropdown hideWhenUnavailable={true} />
          </ToolbarGroup>

          <ToolbarSeparator />

          <ToolbarGroup>
            <MarkButton type="bold" hideWhenUnavailable={true} />
            <MarkButton type="italic" hideWhenUnavailable={true} />
            <MarkButton type="underline" hideWhenUnavailable={true} />
            <MarkButton type="strike" hideWhenUnavailable={true} />
            <MarkButton type="code" hideWhenUnavailable={true} />
          </ToolbarGroup>

          <ToolbarSeparator />

          <ToolbarGroup>
            <ImageNodeFloating />
          </ToolbarGroup>

          <ToolbarGroup>
            <LinkPopover
              autoOpenOnLinkActive={false}
              hideWhenUnavailable={true}
            />
            <CommentPopover hideWhenUnavailable={true} />
            <ColorTextPopover hideWhenUnavailable={true} />
          </ToolbarGroup>

          <MoreOptions hideWhenUnavailable={true} />
        </Toolbar>
      </FloatingElement>
    </FloatingPortal>
  );
}

function canMoreOptions(editor: Editor | null): boolean {
  if (!editor) {
    return false;
  }

  const canTextAlignAny = ["left", "center", "right", "justify"].some((align) =>
    canSetTextAlign(editor, align as TextAlign)
  );

  const canMarkAny = ["superscript", "subscript"].some((type) =>
    canToggleMark(editor, type as Mark)
  );

  return canMarkAny || canTextAlignAny;
}

function shouldShowMoreOptions(params: {
  editor: Editor | null;
  hideWhenUnavailable: boolean;
}): boolean {
  const { editor, hideWhenUnavailable } = params;

  if (!editor) {
    return false;
  }

  if (hideWhenUnavailable && !editor.isActive("code")) {
    return canMoreOptions(editor);
  }

  return Boolean(editor?.isEditable);
}

export interface MoreOptionsProps extends Omit<ButtonProps, "type"> {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null;
  /**
   * Whether to hide the dropdown when no options are available.
   * @default false
   */
  hideWhenUnavailable?: boolean;
}

export function MoreOptions({
  editor: providedEditor,
  hideWhenUnavailable = false,
  ...props
}: MoreOptionsProps) {
  const { editor } = useTiptapEditor(providedEditor);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      setShow(
        shouldShowMoreOptions({
          editor,
          hideWhenUnavailable,
        })
      );
    };

    handleSelectionUpdate();

    editor.on("selectionUpdate", handleSelectionUpdate);

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
    };
  }, [editor, hideWhenUnavailable]);

  if (!show || !editor || !editor.isEditable) {
    return null;
  }

  return (
    <>
      <ToolbarSeparator />
      <ToolbarGroup>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              data-style="ghost"
              role="button"
              tabIndex={-1}
              tooltip="More options"
              {...props}
            >
              <MoreVerticalIcon className="tiptap-button-icon" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            side="top"
            align="end"
            alignOffset={4}
            sideOffset={4}
            asChild
          >
            <Toolbar variant="floating" tabIndex={0}>
              <ToolbarGroup>
                <MarkButton type="superscript" />
                <MarkButton type="subscript" />
              </ToolbarGroup>

              <ToolbarSeparator />

              <ToolbarGroup>
                <TextAlignButton align="left" />
                <TextAlignButton align="center" />
                <TextAlignButton align="right" />
                <TextAlignButton align="justify" />
              </ToolbarGroup>

              <ToolbarSeparator />
            </Toolbar>
          </PopoverContent>
        </Popover>
      </ToolbarGroup>
    </>
  );
}
