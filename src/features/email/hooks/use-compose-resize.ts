import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { useRef, useState } from "react";

const COMPOSE_DEFAULT_SIZE = { width: 680, height: 560 };
const COMPOSE_MIN_SIZE = { width: 480, height: 400 };
/** Pixels added/removed per arrow-key press on the resize handle. */
const COMPOSE_RESIZE_STEP = 32;

const clampSize = (width: number, height: number) => ({
	// Upper bounds live in CSS (`min(…, calc(100vw/dvh - …))`) so the window
	// can never outgrow the viewport; only the floor is enforced here.
	width: Math.max(COMPOSE_MIN_SIZE.width, width),
	height: Math.max(COMPOSE_MIN_SIZE.height, height),
});

/** Drag/keyboard resizing for the centered compose window. The window stays
 *  centered, so each dragged pixel grows both sides — doubling the delta keeps
 *  the grabbed corner tracking the cursor. The chosen size survives
 *  close/reopen because the panel stays mounted in EmailView. */
export function useComposeResize() {
	const [size, setSize] = useState(COMPOSE_DEFAULT_SIZE);
	const origin = useRef<{
		x: number;
		y: number;
		width: number;
		height: number;
	} | null>(null);

	const startResize = (e: ReactPointerEvent<HTMLButtonElement>) => {
		e.currentTarget.setPointerCapture(e.pointerId);
		origin.current = { x: e.clientX, y: e.clientY, ...size };
	};

	const moveResize = (e: ReactPointerEvent<HTMLButtonElement>) => {
		const start = origin.current;
		if (!start) return;
		setSize(
			clampSize(
				start.width + (e.clientX - start.x) * 2,
				start.height + (e.clientY - start.y) * 2,
			),
		);
	};

	const endResize = () => {
		origin.current = null;
	};

	const resizeByKey = (e: KeyboardEvent<HTMLButtonElement>) => {
		const deltas: Record<string, [number, number]> = {
			ArrowLeft: [-COMPOSE_RESIZE_STEP, 0],
			ArrowRight: [COMPOSE_RESIZE_STEP, 0],
			ArrowUp: [0, -COMPOSE_RESIZE_STEP],
			ArrowDown: [0, COMPOSE_RESIZE_STEP],
		};
		const delta = deltas[e.key];
		if (!delta) return;
		e.preventDefault();
		setSize((s) => clampSize(s.width + delta[0], s.height + delta[1]));
	};

	return { size, startResize, moveResize, endResize, resizeByKey };
}
