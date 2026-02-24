import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { TiptapCollabProvider } from "@tiptap-pro/provider";
import { Doc as YDoc } from "yjs";
import {
  fetchCollabToken,
  getUrlParam,
} from "@/features/tiptap-editor/lib/tiptap-collab-utils";
import { useEnv } from "./env-context";

export type CollabContextValue = {
  provider: TiptapCollabProvider | null;
  ydoc: YDoc;
  hasCollab: boolean;
};

export const CollabContext = createContext<CollabContextValue>({
  hasCollab: false,
  provider: null,
  ydoc: new YDoc(),
});

export const CollabConsumer = CollabContext.Consumer;
export const useCollab = (): CollabContextValue => {
  const context = useContext(CollabContext);
  if (!context) {
    throw new Error("useCollab must be used within an CollabProvider");
  }
  return context;
};

export const useCollaboration = (room: string) => {
  const [provider, setProvider] = useState<TiptapCollabProvider | null>(null);
  const [collabToken, setCollabToken] = useState<string | null>(null);
  const ydoc = useMemo(() => new YDoc(), []);
  const {
    TIPTAP_COLLAB_DOC_PREFIX,
    TIPTAP_COLLAB_APP_ID,
    TIPTAP_COLLAB_TOKEN,
  } = useEnv();

  // Determine if collaboration should be enabled
  const hasCollab = useMemo(() => {
    const noCollabParam = getUrlParam("noCollab");
    const isDisabledByParam = parseInt(noCollabParam || "0") === 1;
    const hasRoom = !!room && room.trim() !== "";
    const hasPrefix =
      !!TIPTAP_COLLAB_DOC_PREFIX && TIPTAP_COLLAB_DOC_PREFIX.trim() !== "";

    return !isDisabledByParam && hasRoom && hasPrefix;
  }, [room, TIPTAP_COLLAB_DOC_PREFIX]);

  useEffect(() => {
    if (!hasCollab) return;

    const getToken = async () => {
      const token = await fetchCollabToken(TIPTAP_COLLAB_TOKEN);
      setCollabToken(token);
    };

    getToken();
  }, [hasCollab, TIPTAP_COLLAB_TOKEN]);

  useEffect(() => {
    if (!hasCollab || !collabToken) return;

    const docPrefix = TIPTAP_COLLAB_DOC_PREFIX;
    const documentName = `${docPrefix}${room}`;
    const appId = TIPTAP_COLLAB_APP_ID;

    const newProvider = new TiptapCollabProvider({
      name: documentName,
      appId,
      token: collabToken,
      document: ydoc,
    });

    setProvider(newProvider);

    return () => {
      newProvider.destroy();
    };
  }, [
    collabToken,
    ydoc,
    room,
    hasCollab,
    TIPTAP_COLLAB_DOC_PREFIX,
    TIPTAP_COLLAB_APP_ID,
  ]);

  return { provider, ydoc, hasCollab };
};

export function CollabProvider({
  children,
  room,
}: Readonly<{
  children: React.ReactNode;
  room: string;
}>) {
  const { hasCollab, provider, ydoc } = useCollaboration(room);

  const value = useMemo<CollabContextValue>(
    () => ({
      hasCollab,
      provider,
      ydoc,
    }),
    [hasCollab, provider, ydoc]
  );

  return (
    <CollabContext.Provider value={value}>{children}</CollabContext.Provider>
  );
}
