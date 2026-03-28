import { useCallback, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";

const AUTO_SAVE_DELAY_MS = 3000;

/**
 * Debounces editor content changes and fires a save callback 3 seconds
 * after the user stops typing. Returns a `trigger` function that should
 * be called from the editor's `onChange` handler.
 */
export function useDebouncedAutoSave(
	editor: Editor | null,
	onSave: (data: {
		bodyHtml: string;
		bodyJson: Record<string, unknown>;
	}) => void,
	enabled = true,
) {
	const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
	const onSaveRef = useRef(onSave);
	onSaveRef.current = onSave;

	useEffect(() => {
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, []);

	const trigger = useCallback(() => {
		if (!enabled || !editor) return;

		if (timerRef.current) clearTimeout(timerRef.current);

		timerRef.current = setTimeout(() => {
			if (!editor) return;
			onSaveRef.current({
				bodyHtml: editor.getHTML(),
				bodyJson: editor.getJSON() as Record<string, unknown>,
			});
		}, AUTO_SAVE_DELAY_MS);
	}, [editor, enabled]);

	return trigger;
}
