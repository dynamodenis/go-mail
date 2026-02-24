import { createContext, useContext, useMemo } from "react";

export type EnvContextValue = {
  TIPTAP_COLLAB_DOC_PREFIX: string;
  TIPTAP_COLLAB_APP_ID: string;
  TIPTAP_COLLAB_TOKEN: string;
  TIPTAP_AI_APP_ID: string;
  TIPTAP_AI_TOKEN: string;
  PARENT_SELECTOR?: string;
};

export const EnvContext = createContext<EnvContextValue>({
  TIPTAP_COLLAB_DOC_PREFIX: "",
  TIPTAP_COLLAB_APP_ID: "",
  TIPTAP_COLLAB_TOKEN: "",
  TIPTAP_AI_APP_ID: "",
  TIPTAP_AI_TOKEN: "",
  PARENT_SELECTOR: undefined,
});

interface EnvProviderProps {
  children: React.ReactNode;
  parentSelector?: string;
  /** Tiptap collab JWT token from useCurrentUser */
  tiptapCollabToken?: string;
  /** Tiptap AI JWT token from useCurrentUser */
  tiptapAiToken?: string;
}

export function EnvProvider({
  children,
  parentSelector,
  tiptapCollabToken,
  tiptapAiToken,
}: EnvProviderProps) {
  const value = useMemo(
    () => ({
      TIPTAP_COLLAB_DOC_PREFIX: import.meta.env.VITE_TIPTAP_COLLAB_DOC_PREFIX ?? "",
      TIPTAP_COLLAB_APP_ID: import.meta.env.VITE_TIPTAP_COLLAB_APP_ID ?? "",
      TIPTAP_COLLAB_TOKEN: tiptapCollabToken ?? "",
      TIPTAP_AI_APP_ID: import.meta.env.VITE_TIPTAP_AI_APP_ID ?? "",
      TIPTAP_AI_TOKEN: tiptapAiToken ?? "",
      PARENT_SELECTOR: parentSelector,
    }),
    [parentSelector, tiptapCollabToken, tiptapAiToken],
  );

  return <EnvContext.Provider value={value}>{children}</EnvContext.Provider>;
}

export function useEnv() {
  const context = useContext(EnvContext);
  if (!context) {
    throw new Error("useEnv must be used within an EnvProvider");
  }
  return context;
}
