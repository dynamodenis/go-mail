import { forwardRef, useCallback, useState } from "react";

// --- Hooks ---
import { useIsBreakpoint } from "@/features/tiptap-editor/hooks/use-is-breakpoint";
import { useTiptapEditor } from "@/features/tiptap-editor/hooks/use-tiptap-editor";
import { useUser } from "@/features/tiptap-editor/contexts/user-context";

// --- Icons ---
import { MessageSquarePlusIcon } from "@/features/tiptap-editor/components/tiptap-icons/message-square-plus-icon";
import { ArrowUpIcon } from "@/features/tiptap-editor/components/tiptap-icons/arrow-up-icon";

// --- Tiptap UI ---
import type { UseCommentPopoverConfig } from "@/features/tiptap-editor/components/tiptap-ui/comment-popover";
import { useCommentPopover } from "@/features/tiptap-editor/components/tiptap-ui/comment-popover";

// --- UI Primitives ---
import type { ButtonProps } from "@/features/tiptap-editor/components/tiptap-ui-primitive/button";
import {
  Button,
  ButtonGroup,
} from "@/features/tiptap-editor/components/tiptap-ui-primitive/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/tiptap-editor/components/tiptap-ui-primitive/popover";
import {
  Card,
  CardBody,
  CardItemGroup,
} from "@/features/tiptap-editor/components/tiptap-ui-primitive/card";
import {
  Input,
  InputGroup,
} from "@/features/tiptap-editor/components/tiptap-ui-primitive/input";

export interface CommentMainProps {
  /**
   * The comment content.
   */
  content: string;
  /**
   * Function to update the content state.
   */
  setContent: React.Dispatch<React.SetStateAction<string>>;
  /**
   * Function to submit the comment.
   */
  submitComment: () => void;
}

export interface CommentPopoverProps
  extends Omit<ButtonProps, "type">,
    UseCommentPopoverConfig {
  /**
   * Callback for when the popover opens or closes.
   */
  onOpenChange?: (isOpen: boolean) => void;
}

/**
 * Comment button component for triggering the comment popover
 */
export const CommentButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        type="button"
        className={className}
        data-style="ghost"
        role="button"
        tabIndex={-1}
        aria-label="Comment"
        tooltip="Comment"
        ref={ref}
        {...props}
      >
        {children || (
          <>
            <MessageSquarePlusIcon className="tiptap-button-icon" />
            <span className="tiptap-button-text">Comment</span>
          </>
        )}
      </Button>
    );
  }
);

CommentButton.displayName = "CommentButton";

/**
 * Main content component for the comment popover
 */
const CommentMain: React.FC<CommentMainProps> = ({
  content,
  setContent,
  submitComment,
}) => {
  const isMobile = useIsBreakpoint();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitComment();
    }
  };

  return (
    <Card
      style={{
        ...(isMobile ? { boxShadow: "none", border: 0 } : {}),
      }}
    >
      <CardBody
        style={{
          ...(isMobile ? { padding: 0 } : {}),
        }}
      >
        <CardItemGroup orientation="horizontal">
          <InputGroup>
            <Input
              type="text"
              placeholder="Add a comment..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              autoComplete="off"
            />
          </InputGroup>

          <ButtonGroup orientation="horizontal">
            <Button
              type="button"
              onClick={submitComment}
              title="Add comment"
              disabled={!content.trim()}
              data-style="ghost"
            >
              <ArrowUpIcon className="tiptap-button-icon" />
            </Button>
          </ButtonGroup>
        </CardItemGroup>
      </CardBody>
    </Card>
  );
};

/**
 * Comment popover component for Tiptap editors.
 *
 * For custom popover implementations, use the `useCommentPopover` hook instead.
 */
export const CommentPopover = forwardRef<HTMLButtonElement, CommentPopoverProps>(
  (
    {
      editor: providedEditor,
      hideWhenUnavailable = false,
      onSetComment,
      onOpenChange,
      onClick,
      children,
      ...buttonProps
    },
    ref
  ) => {
    const { editor } = useTiptapEditor(providedEditor);
    const { user } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [content, setContent] = useState("");

    const { isVisible, canSet, Icon } = useCommentPopover({
      editor,
      hideWhenUnavailable,
    });

    const handleOnOpenChange = useCallback(
      (nextIsOpen: boolean) => {
        setIsOpen(nextIsOpen);
        if (!nextIsOpen) {
          setContent("");
        }
        onOpenChange?.(nextIsOpen);
      },
      [onOpenChange]
    );

    const handleSubmitComment = useCallback(() => {
      if (!content.trim() || !editor) return;

      editor.chain().setThread({
        content: content.trim(),
        data: {
          authorId: user.id,
          authorName: user.name,
          authorAvatar: user.avatar,
        },
        commentData: {
          authorId: user.id,
          authorName: user.name,
          authorAvatar: user.avatar,
        },
      }).run();

      setContent("");
      setIsOpen(false);
      onSetComment?.();
    }, [content, editor, user, onSetComment]);

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        setIsOpen(!isOpen);
      },
      [onClick, isOpen]
    );

    if (!isVisible) {
      return null;
    }

    return (
      <Popover open={isOpen} onOpenChange={handleOnOpenChange}>
        <PopoverTrigger asChild>
          <CommentButton
            disabled={!canSet}
            data-disabled={!canSet}
            aria-label="Comment"
            onClick={handleClick}
            {...buttonProps}
            ref={ref}
          >
            {children ?? (
              <>
                <Icon className="tiptap-button-icon" />
                <span className="tiptap-button-text">Comment</span>
              </>
            )}
          </CommentButton>
        </PopoverTrigger>

        <PopoverContent>
          <CommentMain
            content={content}
            setContent={setContent}
            submitComment={handleSubmitComment}
          />
        </PopoverContent>
      </Popover>
    );
  }
);

CommentPopover.displayName = "CommentPopover";

export default CommentPopover;
