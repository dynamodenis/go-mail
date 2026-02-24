import { useEffect, useState, useCallback, useContext } from "react";
import { createPortal } from "react-dom";
import { EditorContext } from "@tiptap/react";
import "@/features/tiptap-editor/components/tiptap-templates/comments/comments.scss";
import { useComments } from "@/features/tiptap-editor/contexts/comments-context";
import type { TCollabThread, TCollabComment } from "@tiptap-pro/provider";
import { useEnv } from "@/features/tiptap-editor/contexts/env-context";
import { useUser } from "@/features/tiptap-editor/contexts/user-context";
import OrbiterBox from "../../ui/orbiter-box";

// Icons
import { CheckIcon } from "@/features/tiptap-editor/components/tiptap-icons/check-icon";
import { Undo2Icon } from "@/features/tiptap-editor/components/tiptap-icons/undo2-icon";
import { TrashIcon } from "@/features/tiptap-editor/components/tiptap-icons/trash-icon";
import { PencilIcon } from "@/features/tiptap-editor/components/tiptap-icons/pencil-icon";
import { ArrowUpIcon } from "@/features/tiptap-editor/components/tiptap-icons/arrow-up-icon";
import { XIcon } from "@/features/tiptap-editor/components/tiptap-icons/x-icon";

// UI Primitives
import { Button } from "@/features/tiptap-editor/components/tiptap-ui-primitive/button";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/features/tiptap-editor/components/tiptap-ui-primitive/avatar";

interface CommentData {
  authorId?: string;
  authorName?: string;
  userName?: string;
  authorAvatar?: string;
}

// ============ CommentCard Component ============
interface CommentCardProps {
  comment: TCollabComment;
  threadId: string;
  showActions?: boolean;
}

function CommentCard({
  comment,
  threadId,
  showActions = false,
}: CommentCardProps) {
  const { onUpdateComment, onDeleteComment } = useComments();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(
    typeof comment.content === "string" ? comment.content : ""
  );

  const commentData = comment.data as CommentData | undefined;
  const authorName =
    commentData?.authorName || commentData?.userName || "Anonymous";
  const authorAvatar = commentData?.authorAvatar;
  const isDeleted = !!comment.deletedAt;

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      const first = parts[0]?.[0] ?? "";
      const last = parts[parts.length - 1]?.[0] ?? "";
      return (first + last).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleSubmitEdit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (editValue.trim()) {
        onUpdateComment(threadId, comment.id, editValue.trim());
        setIsEditing(false);
      }
    },
    [editValue, threadId, comment.id, onUpdateComment]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDeleteComment(threadId, comment.id);
    },
    [threadId, comment.id, onDeleteComment]
  );

  return (
    <div className={`tiptap-comment ${isDeleted ? "is-deleted" : ""}`}>
      <div className="tiptap-comment-meta">
        <Avatar size="sm">
          <AvatarImage src={authorAvatar} alt={authorName} />
          <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
        </Avatar>
        <span className="tiptap-comment-author">{authorName}</span>
        <span className="tiptap-comment-time">
          {new Date(comment.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {isDeleted ? (
        <div className="tiptap-comment-body">
          <p className="tiptap-comment-deleted-text">Comment was deleted</p>
        </div>
      ) : isEditing ? (
        <form className="tiptap-comment-edit" onSubmit={handleSubmitEdit}>
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
          />
          <div className="tiptap-comment-edit-actions">
            <Button
              type="button"
              data-style="ghost"
              data-size="small"
              onClick={() => setIsEditing(false)}
            >
              <XIcon className="tiptap-button-icon" />
              <span className="tiptap-button-text">Cancel</span>
            </Button>
            <Button
              type="submit"
              data-style="ghost"
              data-size="small"
              disabled={!editValue.trim() || editValue === comment.content}
            >
              <CheckIcon className="tiptap-button-icon" />
              <span className="tiptap-button-text">Save</span>
            </Button>
          </div>
        </form>
      ) : (
        <div className="tiptap-comment-body">
          <p>
            {typeof comment.content === "string"
              ? comment.content
              : JSON.stringify(comment.content)}
          </p>
          {showActions && (
            <div className="tiptap-comment-actions">
              <Button
                type="button"
                data-style="ghost"
                data-size="small"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                tooltip="Edit"
              >
                <PencilIcon className="tiptap-button-icon" />
              </Button>
              <Button
                type="button"
                data-style="ghost"
                data-size="small"
                onClick={handleDelete}
                tooltip="Delete"
              >
                <TrashIcon className="tiptap-button-icon" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============ ThreadComposer Component ============
interface ThreadComposerProps {
  threadId: string;
}

function ThreadComposer({ threadId }: ThreadComposerProps) {
  const { onAddComment } = useComments();
  const { user } = useUser();
  const [comment, setComment] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!comment.trim()) return;

      onAddComment(threadId, comment.trim(), {
        userName: user.name,
        authorName: user.name,
        authorId: user.id,
        authorAvatar: user.avatar,
      });
      setComment("");
    },
    [comment, threadId, onAddComment, user]
  );

  return (
    <form className="tiptap-thread-composer" onSubmit={handleSubmit}>
      <textarea
        placeholder="Reply to thread..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="tiptap-thread-composer-actions">
        <Button
          type="submit"
          data-style="ghost"
          data-size="small"
          disabled={!comment.trim()}
        >
          <ArrowUpIcon className="tiptap-button-icon" />
          <span className="tiptap-button-text">Send</span>
        </Button>
      </div>
    </form>
  );
}

// ============ ThreadCard Component ============
interface ThreadCardProps {
  thread: TCollabThread;
  isActive: boolean;
  isOpen: boolean;
}

function ThreadCard({ thread, isActive, isOpen }: ThreadCardProps) {
  const {
    onClickThread,
    deleteThread,
    resolveThread,
    unresolveThread,
    onHoverThread,
    onLeaveThread,
    getThreadComments,
  } = useComments();

  const comments = getThreadComments(thread.id);
  const firstComment = comments[0];
  const isResolved = !!thread.resolvedAt;

  const handleResolve = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      resolveThread(thread.id);
    },
    [thread.id, resolveThread]
  );

  const handleUnresolve = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      unresolveThread(thread.id);
    },
    [thread.id, unresolveThread]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteThread(thread.id);
    },
    [thread.id, deleteThread]
  );

  const classNames = ["tiptap-thread"];
  if (isActive) classNames.push("is-active");
  if (isOpen) classNames.push("is-open");
  if (isResolved) classNames.push("is-resolved");

  return (
    <div
      className={classNames.join(" ")}
      onMouseEnter={() => onHoverThread(thread.id)}
      onMouseLeave={onLeaveThread}
      onClick={() => !isOpen && onClickThread(thread.id)}
    >
      {isOpen ? (
        <>
          {/* Header with actions */}
          <div className="tiptap-thread-header">
            <div className="tiptap-thread-actions">
              {!isResolved ? (
                <Button
                  type="button"
                  data-style="ghost"
                  data-size="small"
                  onClick={handleResolve}
                >
                  <CheckIcon className="tiptap-button-icon" />
                  <span className="tiptap-button-text">Resolve</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  data-style="ghost"
                  data-size="small"
                  onClick={handleUnresolve}
                >
                  <Undo2Icon className="tiptap-button-icon" />
                  <span className="tiptap-button-text">Unresolve</span>
                </Button>
              )}
              <Button
                type="button"
                data-style="ghost"
                data-size="small"
                onClick={handleDelete}
              >
                <TrashIcon className="tiptap-button-icon" />
                <span className="tiptap-button-text">Delete</span>
              </Button>
            </div>
          </div>

          {/* Resolved hint */}
          {isResolved && (
            <div className="tiptap-thread-hint">
              Resolved at {new Date(thread.resolvedAt!).toLocaleDateString()}{" "}
              {new Date(thread.resolvedAt!).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}

          {/* All comments */}
          <div className="tiptap-thread-comments">
            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                threadId={thread.id}
                showActions={true}
              />
            ))}
          </div>

          {/* Reply composer */}
          <ThreadComposer threadId={thread.id} />
        </>
      ) : (
        <>
          {/* Collapsed view - show first comment only */}
          {firstComment && (
            <div className="tiptap-thread-comments">
              <CommentCard
                comment={firstComment}
                threadId={thread.id}
                showActions={false}
              />
              {comments.length > 1 && (
                <div className="tiptap-thread-replies-count">
                  {comments.length - 1}{" "}
                  {comments.length - 1 === 1 ? "reply" : "replies"}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Tab types for comment filtering
type CommentTab = "open" | "resolved";

// ============ Main Comments Component ============
export default function Comments() {
  const { threads, selectedThread, selectedThreads, clearSelectedThread } =
    useComments();
  const { editor } = useContext(EditorContext);
  const { PARENT_SELECTOR } = useEnv();
  const [parentElement, setParentElement] = useState<HTMLElement | null>(null);
  const [activeTab, setActiveTab] = useState<CommentTab>("open");

  // Listen for clicks to clear thread selection when clicking outside any thread
  // Note: Thread selection is handled by CommentsKit's onClickThread callback in notion-like-editor.tsx
  useEffect(() => {
    if (!editor) return;

    // Handle clicks - only clear selection if clicking outside any thread
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if clicked element or any ancestor has the thread class
      const clickedOnThread = target.closest(".tiptap-thread");

      if (!clickedOnThread) {
        // Clicked outside any thread, clear selection
        clearSelectedThread();
      }
      // If clicked on a thread, CommentsKit's onClickThread handles selection
    };

    const editorDom = editor.view.dom;
    editorDom.addEventListener("click", handleClick);

    return () => {
      editorDom.removeEventListener("click", handleClick);
    };
  }, [editor, clearSelectedThread]);

  // Find the parent element from selector and ensure it has relative positioning
  useEffect(() => {
    if (PARENT_SELECTOR) {
      const element = document.querySelector(
        PARENT_SELECTOR
      ) as HTMLElement | null;
      setParentElement(element);

      // Ensure parent has relative positioning for absolute child positioning
      if (element) {
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.position === "static") {
          element.style.position = "relative";
        }
      }
    }
  }, [PARENT_SELECTOR]);

  // Filter threads based on active tab
  const openThreads = threads.filter(
    (thread) => !thread.resolvedAt && thread.comments.length > 0
  );
  const resolvedThreads = threads.filter(
    (thread) => thread.resolvedAt && thread.comments.length > 0
  );
  const displayedThreads = activeTab === "open" ? openThreads : resolvedThreads;

  // Don't render if there are no threads at all
  if (openThreads.length === 0 && resolvedThreads.length === 0) {
    return null;
  }

  const commentsContent = (
    <div className={`tiptap-comments ${parentElement ? "is-positioned" : ""}`}>
      <OrbiterBox>
        <div className="tiptap-comments-container">
          <OrbiterBox
            padding={10}
            borderGradient="linear-gradient(270deg, rgba(250, 204, 21, 0) 0%, rgba(250, 204, 21, 0.5) 50%, rgba(250, 204, 21, 0) 100%)"
            filter="blur(10px)"
          >
            <div className="tiptap-comments-header">
              <div className="tiptap-comments-title">Comments</div>
            </div>
          </OrbiterBox>
          
          {/* Tab Switch */}
          <div className="tiptap-comments-tabs">
            <button
              className={`tiptap-comments-tab ${activeTab === "open" ? "is-active" : ""}`}
              onClick={() => setActiveTab("open")}
            >
              <span>Open</span>
              <span className="tiptap-comments-tab-count">{openThreads.length}</span>
            </button>
            <button
              className={`tiptap-comments-tab ${activeTab === "resolved" ? "is-active" : ""}`}
              onClick={() => setActiveTab("resolved")}
            >
              <span>Resolved</span>
              <span className="tiptap-comments-tab-count">{resolvedThreads.length}</span>
            </button>
          </div>

          <div className="tiptap-comments-list">
            {displayedThreads.length === 0 ? (
              <div className="tiptap-comments-empty">
                {activeTab === "open" 
                  ? "No open comments" 
                  : "No resolved comments"}
              </div>
            ) : (
              displayedThreads.map((thread) => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  isActive={
                    selectedThreads.includes(thread.id) ||
                    selectedThread === thread.id
                  }
                  isOpen={selectedThread === thread.id}
                />
              ))
            )}
          </div>
        </div>
      </OrbiterBox>
    </div>
  );

  // If parent selector is provided, render using a portal to the parent element
  if (parentElement) {
    return createPortal(commentsContent, parentElement);
  }

  return commentsContent;
}
