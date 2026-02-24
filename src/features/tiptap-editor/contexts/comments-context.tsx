import { EditorContext } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useCollab } from "./collab-context";
import {
  hoverOffThread,
  hoverThread,
  subscribeToThreads,
} from "@tiptap-pro/extension-comments";
import type {
  TCollabThread,
  TCollabComment,
  TiptapCollabProvider,
} from "@tiptap-pro/provider";

export type { TCollabThread, TCollabComment };

type CommentsContextValue = {
  threads: TCollabThread[];
  selectedThreads: string[];
  selectedThread: string | null;
  provider: TiptapCollabProvider | null;
  onClickThread: (threadId: string) => void;
  onEditorClickThread: (threadId: string) => void;
  clearSelectedThread: () => void;
  deleteThread: (threadId: string) => void;
  resolveThread: (threadId: string) => void;
  unresolveThread: (threadId: string) => void;
  onUpdateComment: (
    threadId: string,
    commentId: string,
    content: string,
    metaData?: any
  ) => void;
  onDeleteComment: (threadId: string, commentId: string) => void;
  onAddComment: (threadId: string, content: string, data?: any) => void;
  getThreadComments: (threadId: string) => TCollabComment[];
  onHoverThread: (threadId: string) => void;
  onLeaveThread: () => void;
  registerEditor: (editor: Editor) => void;
};

const defaultCommentsContextValue: CommentsContextValue = {
  threads: [],
  selectedThreads: [],
  selectedThread: null,
  provider: null,
  onClickThread: () => {},
  onEditorClickThread: () => {},
  clearSelectedThread: () => {},
  deleteThread: () => {},
  resolveThread: () => {},
  unresolveThread: () => {},
  onUpdateComment: () => {},
  onDeleteComment: () => {},
  onAddComment: () => {},
  getThreadComments: () => [],
  onHoverThread: () => {},
  onLeaveThread: () => {},
  registerEditor: () => {},
};

export const CommentsContext = createContext<CommentsContextValue>(
  defaultCommentsContextValue
);

export const CommentsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { provider } = useCollab();
  const { editor: contextEditor } = useContext(EditorContext);
  const editorRef = useRef<Editor | null>(null);
  const [threads, setThreads] = useState<TCollabThread[]>([]);
  const [selectedThreads] = useState<string[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);

  // Use either the registered editor or the one from context
  const getEditor = useCallback(() => {
    return editorRef.current || contextEditor;
  }, [contextEditor]);

  // Register editor from EditorProvider
  const registerEditor = useCallback((editor: Editor) => {
    editorRef.current = editor;
  }, []);

  // Subscribe to thread changes
  useEffect(() => {
    if (!provider) return;

    const unsubscribe = subscribeToThreads({
      provider,
      callback: (updatedThreads) => {
        setThreads(updatedThreads);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [provider]);

  const deleteThread = useCallback(
    (threadId: string) => {
      provider?.deleteThread(threadId);
      getEditor()?.commands.removeThread({ id: threadId });
    },
    [getEditor, provider]
  );

  const resolveThread = useCallback(
    (threadId: string) => {
      getEditor()?.commands.resolveThread({ id: threadId });
    },
    [getEditor]
  );

  const unresolveThread = useCallback(
    (threadId: string) => {
      getEditor()?.commands.unresolveThread({ id: threadId });
    },
    [getEditor]
  );

  const updateComment = useCallback(
    (threadId: string, commentId: string, content: string, metaData?: any) => {
      provider?.updateComment(threadId, commentId, { content, data: metaData });
    },
    [provider]
  );

  const deleteComment = useCallback(
    (threadId: string, commentId: string) => {
      provider?.deleteComment(threadId, commentId, { deleteContent: true });
    },
    [provider]
  );

  const addComment = useCallback(
    (threadId: string, content: string, data?: any) => {
      provider?.addComment(threadId, {
        content,
        data,
      });
    },
    [provider]
  );

  const getThreadComments = useCallback(
    (threadId: string) => {
      return provider?.getThreadComments(threadId) || [];
    },
    [provider]
  );

  const selectThreadInEditor = useCallback(
    (threadId: string) => {
      getEditor()?.chain().selectThread({ id: threadId }).run();
    },
    [getEditor]
  );

  // Called when user clicks a thread in the comments list
  const handleThreadClick = useCallback(
    (threadId: string) => {
      setSelectedThread((currentThreadId: string | null) => {
        if (currentThreadId !== threadId) {
          selectThreadInEditor(threadId);
        }
        return currentThreadId !== threadId ? threadId : null;
      });
    },
    [selectThreadInEditor]
  );

  // Called when user clicks a thread in the editor (via onClickThread callback)
  const onEditorClickThread = useCallback(
    (threadId: string) => {
      setSelectedThread((currentThreadId: string | null) => {
        // Only update editor selection if thread is different
        if (currentThreadId !== threadId) {
          selectThreadInEditor(threadId);
        }
        return threadId;
      });
    },
    [selectThreadInEditor]
  );

  // Clear the selected thread (called when clicking on non-thread text)
  const clearSelectedThread = useCallback(() => {
    setSelectedThread(null);
    // Optionally deselect in editor as well
    getEditor()?.commands.unselectThread?.();
  }, [getEditor]);

  const onHoverThread = useCallback(
    (threadId: string) => {
      const editor = getEditor();
      if (!editor) return;
      hoverThread(editor, [Number(threadId)]);
    },
    [getEditor]
  );

  const onLeaveThread = useCallback(() => {
    const editor = getEditor();
    if (!editor) return;
    hoverOffThread(editor);
  }, [getEditor]);

  const providerValue = {
    threads,
    selectedThreads,
    selectedThread,
    provider,

    deleteThread,
    resolveThread,
    unresolveThread,
    onClickThread: handleThreadClick,
    onEditorClickThread,
    clearSelectedThread,
    onUpdateComment: updateComment,
    onDeleteComment: deleteComment,
    onAddComment: addComment,
    getThreadComments,
    onHoverThread,
    onLeaveThread,
    registerEditor,
  };

  return (
    <CommentsContext.Provider value={providerValue}>
      {children}
    </CommentsContext.Provider>
  );
};

export const useComments = () => {
  return useContext(CommentsContext);
};
