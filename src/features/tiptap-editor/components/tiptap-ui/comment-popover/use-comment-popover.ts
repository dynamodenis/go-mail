"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";

// --- Hooks ---
import { useTiptapEditor } from "@/features/tiptap-editor/hooks/use-tiptap-editor";

// --- Icons ---
import { MessageSquarePlusIcon } from "@/features/tiptap-editor/components/tiptap-icons/message-square-plus-icon";

// --- Lib ---
import { isNodeTypeSelected } from "@/features/tiptap-editor/lib/tiptap-utils";

/**
 * Configuration for the comment popover functionality
 */
export interface UseCommentPopoverConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null;
  /**
   * Whether to hide the comment popover when not available.
   * @default false
   */
  hideWhenUnavailable?: boolean;
  /**
   * Callback function called when a comment is submitted.
   */
  onSetComment?: () => void;
}

/**
 * Checks if a comment can be set in the current editor state
 */
export function canSetComment(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false;

  // Cannot add comments inside image captions
  if (isNodeTypeSelected(editor, ["image"], true)) return false;

  // Need to have selected text for inline comments
  const { selection } = editor.state;
  if (selection.empty) return false;

  return true;
}

/**
 * Checks if CommentsKit is available in the editor
 */
export function isCommentsInSchema(editor: Editor | null): boolean {
  if (!editor) return false;

  // Check if CommentsKit extension is loaded by looking for:
  // 1. The inlineThread/blockThread marks in schema
  // 2. Or the setThread command being available
  const hasMarks = !!editor.schema.marks.inlineThread || !!editor.schema.marks.blockThread;
  const hasCommand = typeof editor.commands.setThread === "function";

  return hasMarks || hasCommand;
}

/**
 * Determines if the comment button should be shown
 */
export function shouldShowCommentButton(props: {
  editor: Editor | null;
  hideWhenUnavailable: boolean;
}): boolean {
  const { editor, hideWhenUnavailable } = props;

  const commentsInSchema = isCommentsInSchema(editor);

  if (!commentsInSchema || !editor) {
    return false;
  }

  if (hideWhenUnavailable) {
    return canSetComment(editor);
  }

  return true;
}

/**
 * Custom hook for comment popover state management
 */
export function useCommentState(props: {
  editor: Editor | null;
  hideWhenUnavailable: boolean;
}) {
  const { editor, hideWhenUnavailable = false } = props;

  const canSet = canSetComment(editor);

  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      setIsVisible(
        shouldShowCommentButton({
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

  return {
    isVisible,
    canSet,
  };
}

/**
 * Main hook that provides comment popover functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * function MyCommentButton() {
 *   const { isVisible, canSet, Icon, label } = useCommentPopover()
 *
 *   if (!isVisible) return null
 *
 *   return <button disabled={!canSet}>Comment</button>
 * }
 * ```
 */
export function useCommentPopover(config?: UseCommentPopoverConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
  } = config || {};

  const { editor } = useTiptapEditor(providedEditor);

  const { isVisible, canSet } = useCommentState({
    editor,
    hideWhenUnavailable,
  });

  return {
    isVisible,
    canSet,
    label: "Comment",
    Icon: MessageSquarePlusIcon,
  };
}
