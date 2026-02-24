import { useContext, useEffect, useMemo, useRef } from "react";
import { EditorContent, EditorContext, Extension, useEditor } from "@tiptap/react";
import type { Editor, Extensions } from "@tiptap/react";
import { Plugin } from "@tiptap/pm/state";
import { AddMarkStep, RemoveMarkStep } from "@tiptap/pm/transform";
import type { Doc as YDoc } from "yjs";
import type { TiptapCollabProvider } from "@tiptap-pro/provider";

// --- Titap Core Extensions ---
import StarterKit from "@tiptap/starter-kit";
import { Document } from "@tiptap/extension-document";
import { Heading } from "@tiptap/extension-heading";
import { Mention } from "@tiptap/extension-mention";
import { CommentsKit } from "@tiptap-pro/extension-comments";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import { Placeholder, Selection } from "@tiptap/extensions";
import { Collaboration, isChangeOrigin } from "@tiptap/extension-collaboration";
import { CollaborationCaret } from "@tiptap/extension-collaboration-caret";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Superscript } from "@tiptap/extension-superscript";
import { Subscript } from "@tiptap/extension-subscript";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";
import { Mathematics } from "@tiptap/extension-mathematics";
import { Ai } from "@tiptap-pro/extension-ai";
import { UniqueID } from "@tiptap/extension-unique-id";
import { Emoji, gitHubEmojis } from "@tiptap/extension-emoji";

// --- Hooks ---
import { useUiEditorState } from "@/features/tiptap-editor/hooks/use-ui-editor-state";
import { useScrollToHash } from "@/features/tiptap-editor/components/tiptap-ui/copy-anchor-link-button/use-scroll-to-hash";

// --- Custom Extensions ---
import { HorizontalRule } from "@/features/tiptap-editor/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
import { UiState } from "@/features/tiptap-editor/components/tiptap-extension/ui-state-extension";
import { Image } from "@/features/tiptap-editor/components/tiptap-node/image-node/image-node-extension";
import { NodeBackground } from "@/features/tiptap-editor/components/tiptap-extension/node-background-extension";
import { NodeAlignment } from "@/features/tiptap-editor/components/tiptap-extension/node-alignment-extension";

// --- Tiptap Node ----
import { ImageUploadNode } from "@/features/tiptap-editor/components/tiptap-node/image-upload-node/image-upload-node-extension";

// --- Table Node ---
import { TableKit } from "@/features/tiptap-editor/components/tiptap-node/table-node/extensions/table-node-extension";
import { TableHandleExtension } from "@/features/tiptap-editor/components/tiptap-node/table-node/extensions/table-handle";
import { TableHandle } from "@/features/tiptap-editor/components/tiptap-node/table-node/ui/table-handle/table-handle";
import { TableSelectionOverlay } from "@/features/tiptap-editor/components/tiptap-node/table-node/ui/table-selection-overlay";
import { TableCellHandleMenu } from "@/features/tiptap-editor/components/tiptap-node/table-node/ui/table-cell-handle-menu";
import { TableExtendRowColumnButtons } from "@/features/tiptap-editor/components/tiptap-node/table-node/ui/table-extend-row-column-button";
import "@/features/tiptap-editor/components/tiptap-node/table-node/styles/prosemirror-table.scss";
import "@/features/tiptap-editor/components/tiptap-node/table-node/styles/table-node.scss";

import "@/features/tiptap-editor/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/features/tiptap-editor/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/features/tiptap-editor/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/features/tiptap-editor/components/tiptap-node/list-node/list-node.scss";
import "@/features/tiptap-editor/components/tiptap-node/image-node/image-node.scss";
import "@/features/tiptap-editor/components/tiptap-node/heading-node/heading-node.scss";
import "@/features/tiptap-editor/components/tiptap-node/paragraph-node/paragraph-node.scss";
import "@/features/tiptap-editor/components/tiptap-node/merge-tag-node/merge-tag-node.scss";

// --- Titap UI ---
import { EmojiDropdownMenu } from "@/features/tiptap-editor/components/tiptap-ui/emoji-dropdown-menu";
import { MentionDropdownMenu } from "@/features/tiptap-editor/components/tiptap-ui/mention-dropdown-menu";
import { SlashDropdownMenu } from "@/features/tiptap-editor/components/tiptap-ui/slash-dropdown-menu";
import { DragContextMenu } from "@/features/tiptap-editor/components/tiptap-ui/drag-context-menu";
import { AiMenu } from "@/features/tiptap-editor/components/tiptap-ui/ai-menu";

//  --- Contexts ---
import { AppProvider } from "@/features/tiptap-editor/contexts/app-context";
import { UserProvider, useUser } from "@/features/tiptap-editor/contexts/user-context";
import { CollabProvider, useCollab } from "@/features/tiptap-editor/contexts/collab-context";
import { AiProvider, useAi } from "@/features/tiptap-editor/contexts/ai-context";
import { EnvProvider, useEnv } from "@/features/tiptap-editor/contexts/env-context";

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/features/tiptap-editor/lib/tiptap-utils";

// --- Styles ---
import "@/features/tiptap-editor/styles/_variables.scss";
import "@/features/tiptap-editor/styles/_keyframe-animations.scss";
import "@/features/tiptap-editor/components/tiptap-templates/notion-like/notion-like-editor.scss";

// -- Content ---
import { NotionToolbarFloating } from "@/features/tiptap-editor/components/tiptap-templates/notion-like/notion-like-editor-toolbar-floating";
import { ListNormalizationExtension } from "../../tiptap-extension/list-normalization-extension";
import type { MentionItem } from "../../tiptap-ui/mention-dropdown-menu/mention.types";
import {
  CommentsProvider,
  useComments,
} from "@/features/tiptap-editor/contexts/comments-context";
import Comments from "../comments/comments";

export interface EditorProviderProps {
  provider: TiptapCollabProvider | null;
  ydoc: YDoc;
  hasCollab: boolean;
  showComments?: boolean;
  titlePlaceholder?: string;
  paragraphPlaceholder?: string;
  aiToken: string | null;
  mentionsList: MentionItem[];
  onChange: (html: string) => void;
  onMentionQuery: (query: string) => void;
  additionalExtensions?: Extensions;
  onEditorReady?: (editor: Editor) => void;
  /** Whether to show the title heading. Defaults to true */
  showTitle?: boolean;
  /** Editor interaction mode. "edit" = full editing, "comment" = read-only content but can comment, "view" = fully read-only. Defaults to "edit" */
  mode?: "edit" | "comment" | "view";
}

export interface NotionEditorProps {
  parentSelector?: string;
  showComments?: boolean;
  userId: string;
  userName: string;
  userAvatar: string;
  userColor: string;
  tiptapCollabDocPrefix: string;
  tiptapCollabAppId: string;
  tiptapCollabToken: string;
  tiptapAiAppId: string;
  tiptapAiToken: string;
  titlePlaceholder?: string;
  paragraphPlaceholder?: string;
  room: string;
  mentionsList: MentionItem[];
  onChange: (html: string) => void;
  onMentionQuery: (query: string) => void;
}

export interface NotionEditorContentProps {
  showComments?: boolean;
  showTitle?: boolean;
  titlePlaceholder?: string;
  paragraphPlaceholder?: string;
  mentionsList: MentionItem[];
  onChange: (html: string) => void;
  onMentionQuery: (query: string) => void;
  additionalExtensions?: Extensions;
  onEditorReady?: (editor: Editor) => void;
  /** Editor interaction mode. Defaults to "edit" */
  mode?: "edit" | "comment" | "view";
}

/**
 * Loading spinner component shown while connecting to the notion server
 */
export function LoadingSpinner({ text = "Connecting..." }: { text?: string }) {
  return (
    <div className="spinner-container">
      <div className="spinner-content">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div className="spinner-loading-text">{text}</div>
      </div>
    </div>
  );
}

export function EditorContentArea({
  showComments = true,
  mentionsList,
  onMentionQuery,
}: {
  showComments?: boolean;
  mentionsList: MentionItem[];
  onMentionQuery: (query: string) => void;
}) {
  const { editor } = useContext(EditorContext);

  const {
    aiGenerationIsLoading,
    aiGenerationIsSelection,
    aiGenerationHasMessage,
    isDragging,
  } = useUiEditorState(editor);

  // Selection based effect to handle AI generation acceptance
  useEffect(() => {
    if (!editor) return;

    if (
      !aiGenerationIsLoading &&
      aiGenerationIsSelection &&
      aiGenerationHasMessage
    ) {
      editor.chain().focus().aiAccept().run();
      editor.commands.resetUiState();
    }
  }, [
    aiGenerationHasMessage,
    aiGenerationIsLoading,
    aiGenerationIsSelection,
    editor,
  ]);

  useScrollToHash();

  if (!editor) {
    return null;
  }

  return (
    <EditorContent
      editor={editor}
      role="presentation"
      className="notion-like-editor-content"
      style={{
        cursor: isDragging ? "grabbing" : "auto",
      }}
    >
      {showComments && <Comments />}
      <DragContextMenu />
      <AiMenu />
      <EmojiDropdownMenu />
      <MentionDropdownMenu
        mentionsList={mentionsList}
        onMentionQuery={onMentionQuery}
      />
      <SlashDropdownMenu />
      <NotionToolbarFloating />
    </EditorContent>
  );
}

export function EditorProvider(props: EditorProviderProps) {
  const {
    provider,
    ydoc,
    hasCollab,
    showComments = true,
    showTitle = true,
    titlePlaceholder = "Enter your title here",
    paragraphPlaceholder = "Write, type '/' for commands…",
    aiToken,
    mentionsList,
    onMentionQuery,
    onChange,
    additionalExtensions = [],
    onEditorReady,
    mode = "edit",
  } = props;

  const { user } = useUser();
  const { TIPTAP_AI_APP_ID } = useEnv();
  const { onEditorClickThread, registerEditor } = useComments();

  // Use ref to avoid stale closure in the extension configuration
  const onEditorClickThreadRef = useRef(onEditorClickThread);
  useEffect(() => {
    onEditorClickThreadRef.current = onEditorClickThread;
  }, [onEditorClickThread]);

  const CustomDocument = Document.extend({
    content: showTitle ? "title block+" : "block+",
  });

  const titleExtensions = showTitle
    ? [
        Heading.extend({
          name: "title",
          group: "title",
          parseHTML: () => [{ tag: "h1:first-child" }],
        }).configure({ levels: [1] }),
      ]
    : [];

  // Build collaboration-related extensions conditionally
  const collabExtensions = hasCollab
    ? [
        CommentsKit.configure({
          provider,
          onClickThread: (threadIdOrThread: unknown) => {
            // Handle both cases: threadId as string/number or as object with id property
            const threadId =
              typeof threadIdOrThread === "object" && threadIdOrThread !== null
                ? (threadIdOrThread as { id?: string | number }).id
                : threadIdOrThread;
            if (threadId) {
              onEditorClickThreadRef.current(String(threadId));
            }
          },
        }),
        Collaboration.configure({ document: ydoc }),
        CollaborationCaret.configure({
          provider,
          user: { id: user.id, name: user.name, color: user.color },
        }),
      ]
    : [];

  // "comment" mode: block content changes but allow comment thread marks
  // "view" mode: block all changes (use native editable: false)
  const commentOnlyExtension = mode === "comment"
    ? [
        Extension.create({
          name: "commentOnlyContent",
          addProseMirrorPlugins() {
            return [
              new Plugin({
                filterTransaction(tr) {
                  if (!tr.docChanged) return true;
                  if (isChangeOrigin(tr)) return true;
                  // Allow mark-only changes (e.g. adding/removing comment thread marks)
                  const onlyMarkSteps = tr.steps.every(
                    (step) => step instanceof AddMarkStep || step instanceof RemoveMarkStep,
                  );
                  if (onlyMarkSteps) return true;
                  return false;
                },
              }),
            ];
          },
        }),
      ]
    : [];

  const editor = useEditor({
    editable: mode !== "view",
    extensions: [
      CustomDocument,
      ...titleExtensions,
      ...commentOnlyExtension,
      StarterKit.configure({
        document: false,
        undoRedo: false,
        horizontalRule: false,
        heading: false,
        dropcursor: {
          width: 2,
        },
        link: { openOnClick: false },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      ...collabExtensions,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "title") {
            return titlePlaceholder;
          }
          return paragraphPlaceholder;
        },
        emptyEditorClass: "is-empty with-slash",
      }),
      Mention.configure({
        suggestion: {
          char: "@",
          // Disable the built-in suggestion rendering since MentionDropdownMenu handles it
          render: () => ({}),
        },
      }),
      Emoji.configure({
        emojis: gitHubEmojis.filter(
          (emoji) => !emoji.name.includes("regional")
        ),
        forceFallbackImages: true,
      }),
      TableKit.configure({
        table: {
          resizable: true,
          cellMinWidth: 120,
        },
      }),
      NodeBackground,
      NodeAlignment,
      TextStyle,
      Mathematics,
      Superscript,
      Subscript,
      Color,
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Selection,
      Image,
      TableHandleExtension,
      ListNormalizationExtension,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed: ", error),
      }),
      UniqueID.configure({
        types: [
          "table",
          "paragraph",
          "bulletList",
          "orderedList",
          "taskList",
          "heading",
          "blockquote",
          "codeBlock",
          "imageUpload",
        ],
        filterTransaction: (transaction) => !isChangeOrigin(transaction),
      }),
      Typography,
      UiState,
      Ai.configure({
        appId: TIPTAP_AI_APP_ID,
        token: aiToken || undefined,
        autocompletion: false,
        showDecorations: true,
        hideDecorationsOnStreamEnd: false,
        onLoading: (context) => {
          context.editor.commands.aiGenerationSetIsLoading(true);
          context.editor.commands.aiGenerationHasMessage(false);
        },
        onChunk: (context) => {
          context.editor.commands.aiGenerationSetIsLoading(true);
          context.editor.commands.aiGenerationHasMessage(true);
        },
        onSuccess: (context) => {
          const hasMessage = !!context.response;
          context.editor.commands.aiGenerationSetIsLoading(false);
          context.editor.commands.aiGenerationHasMessage(hasMessage);
        },
      }),
      ...additionalExtensions,
    ],
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Register the editor with CommentsProvider so it can be used for hover/selection
  useEffect(() => {
    if (editor) {
      registerEditor(editor);
    }
  }, [editor, registerEditor]);

  if (!editor) return <LoadingSpinner />;

  return (
    <div className="notion-like-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <EditorContentArea
          showComments={showComments}
          mentionsList={mentionsList}
          onMentionQuery={onMentionQuery}
        />
        <TableExtendRowColumnButtons />
        <TableHandle />
        <TableSelectionOverlay
          showResizeHandles={true}
          cellMenu={(props) => (
            <TableCellHandleMenu
              editor={props.editor}
              onMouseDown={(e) => props.onResizeStart?.("br")(e)}
            />
          )}
        />
      </EditorContext.Provider>
    </div>
  );
}

export function NotionEditorContent({
  showComments,
  showTitle,
  titlePlaceholder,
  paragraphPlaceholder,
  mentionsList,
  onChange,
  onMentionQuery,
  additionalExtensions,
  onEditorReady,
  mode,
}: NotionEditorContentProps) {
  const { provider, ydoc, hasCollab } = useCollab();
  const { aiToken } = useAi();

  // When collab is enabled, wait for provider to be ready
  // When collab is disabled, proceed without provider
  if (hasCollab && !provider) return <LoadingSpinner />;

  return (
    <EditorProvider
      provider={provider}
      ydoc={ydoc}
      hasCollab={hasCollab}
      showComments={showComments}
      showTitle={showTitle}
      titlePlaceholder={titlePlaceholder}
      paragraphPlaceholder={paragraphPlaceholder}
      aiToken={aiToken}
      mentionsList={mentionsList}
      onChange={onChange}
      onMentionQuery={onMentionQuery}
      additionalExtensions={additionalExtensions}
      onEditorReady={onEditorReady}
      mode={mode}
    />
  );
}

export interface SimpleNotionEditorProps {
  parentSelector?: string;
  showComments?: boolean;
  user: {
    id: string;
    name: string;
    avatar: string;
    color: string;
  };
  room: string;
  titlePlaceholder?: string;
  paragraphPlaceholder?: string;
  mentionsList?: MentionItem[];
  onChange?: (html: string) => void;
  onMentionQuery?: (query: string) => void;
  /** Tiptap collab JWT token from useCurrentUser */
  tiptapCollabToken?: string;
  /** Tiptap AI JWT token from useCurrentUser */
  tiptapAiToken?: string;
  /** Extra Tiptap extensions to register with the editor */
  additionalExtensions?: Extensions;
  /** Called when the editor instance is ready */
  onEditorReady?: (editor: Editor) => void;
  /** Whether to show the title heading. Defaults to true */
  showTitle?: boolean;
  /** Editor interaction mode. "edit" = full editing, "comment" = read-only content but can comment, "view" = fully read-only. Defaults to "edit" */
  mode?: "edit" | "comment" | "view";
}

/**
 * Simplified NotionEditor that gets env variables from env.ts context
 * Tokens (tiptapCollabToken, tiptapAiToken) should come from useCurrentUser()
 */
export function NotionEditor({
  parentSelector,
  showComments = false,
  user,
  room,
  titlePlaceholder,
  paragraphPlaceholder,
  mentionsList = [],
  onChange = () => {},
  onMentionQuery = () => {},
  tiptapCollabToken,
  tiptapAiToken,
  additionalExtensions,
  onEditorReady,
  showTitle = true,
  mode,
}: SimpleNotionEditorProps) {
  // Compute a stable key that changes when props change to force editor recreation
  const editorKey = useMemo(
    () =>
      JSON.stringify({
        parentSelector,
        userId: user.id,
        room,
      }),
    [parentSelector, user.id, room]
  );

  return (
    <EnvProvider
      key={editorKey}
      parentSelector={parentSelector}
      tiptapCollabToken={tiptapCollabToken}
      tiptapAiToken={tiptapAiToken}
    >
      <UserProvider value={user}>
        <AppProvider>
          <CollabProvider room={room}>
            <AiProvider>
              <CommentsProvider>
                <NotionEditorContent
                  showComments={showComments}
                  showTitle={showTitle}
                  paragraphPlaceholder={paragraphPlaceholder}
                  titlePlaceholder={titlePlaceholder}
                  mentionsList={mentionsList}
                  onChange={onChange}
                  onMentionQuery={onMentionQuery}
                  additionalExtensions={additionalExtensions}
                  onEditorReady={onEditorReady}
                  mode={mode}
                />
              </CommentsProvider>
            </AiProvider>
          </CollabProvider>
        </AppProvider>
      </UserProvider>
    </EnvProvider>
  );
}
