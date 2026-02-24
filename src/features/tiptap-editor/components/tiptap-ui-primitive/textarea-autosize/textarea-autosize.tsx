import { forwardRef, useState } from "react";
import type { TextareaAutosizeProps } from "react-textarea-autosize";
import ReactTextareaAutosize from "react-textarea-autosize";

// -- Hooks --
import { useIsomorphicLayoutEffect } from "@/features/tiptap-editor/hooks/use-isomorphic-layout-effect";

export const TextareaAutosize = forwardRef<
  HTMLTextAreaElement,
  TextareaAutosizeProps
>(function TextareaAutosize(props, ref) {
  const [isRerendered, setIsRerendered] = useState(false);

  useIsomorphicLayoutEffect(() => setIsRerendered(true), []);

  return isRerendered ? <ReactTextareaAutosize ref={ref} {...props} /> : null;
});
