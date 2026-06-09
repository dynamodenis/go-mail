import { create } from "zustand";

/** Create-campaign wizard store — holds the multi-step builder's form values and
 *  current step while the user fills them in. This is ephemeral client/UI state
 *  only (no server data): it is reset when the wizard mounts and after a
 *  successful create. The persisted campaign lives in React Query once submitted. */

export const CAMPAIGN_BUILDER_STEPS = [
	"template",
	"recipients",
	"review",
] as const;
export type CampaignBuilderStep = (typeof CAMPAIGN_BUILDER_STEPS)[number];

const LAST_STEP_INDEX = CAMPAIGN_BUILDER_STEPS.length - 1;

interface CreateCampaignState {
	stepIndex: number;
	name: string;
	subject: string;
	templateId: string | null;
	collectionId: string | null;
	scheduledAt: string | null;
}

type CreateCampaignField = Exclude<keyof CreateCampaignState, "stepIndex">;

interface CreateCampaignActions {
	setField: <K extends CreateCampaignField>(
		key: K,
		value: CreateCampaignState[K],
	) => void;
	next: () => void;
	prev: () => void;
	goToStep: (index: number) => void;
	reset: () => void;
}

const INITIAL_STATE: CreateCampaignState = {
	stepIndex: 0,
	name: "",
	subject: "",
	templateId: null,
	collectionId: null,
	scheduledAt: null,
};

export const useCreateCampaignStore = create<
	CreateCampaignState & CreateCampaignActions
>()((set) => ({
	...INITIAL_STATE,
	setField: (key, value) =>
		set({ [key]: value } as Partial<CreateCampaignState>),
	next: () =>
		set((s) => ({ stepIndex: Math.min(s.stepIndex + 1, LAST_STEP_INDEX) })),
	prev: () => set((s) => ({ stepIndex: Math.max(s.stepIndex - 1, 0) })),
	goToStep: (index) =>
		set({ stepIndex: Math.max(0, Math.min(index, LAST_STEP_INDEX)) }),
	reset: () => set(INITIAL_STATE),
}));
