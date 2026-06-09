import { describe, it, expect, beforeEach } from "vitest";
import {
	CAMPAIGN_BUILDER_STEPS,
	useCreateCampaignStore,
} from "../api/create-campaign-store";

describe("useCreateCampaignStore", () => {
	beforeEach(() => {
		useCreateCampaignStore.getState().reset();
	});

	it("has correct initial state", () => {
		const state = useCreateCampaignStore.getState();
		expect(state.stepIndex).toBe(0);
		expect(state.name).toBe("");
		expect(state.subject).toBe("");
		expect(state.templateId).toBeNull();
		expect(state.collectionId).toBeNull();
		expect(state.scheduledAt).toBeNull();
	});

	it("setField updates a single field", () => {
		useCreateCampaignStore.getState().setField("name", "Launch");
		useCreateCampaignStore.getState().setField("templateId", "tpl-1");
		expect(useCreateCampaignStore.getState().name).toBe("Launch");
		expect(useCreateCampaignStore.getState().templateId).toBe("tpl-1");
	});

	it("next advances but clamps at the last step", () => {
		const { next } = useCreateCampaignStore.getState();
		next();
		expect(useCreateCampaignStore.getState().stepIndex).toBe(1);
		// Walk past the end — should clamp, not overflow.
		next();
		next();
		next();
		expect(useCreateCampaignStore.getState().stepIndex).toBe(
			CAMPAIGN_BUILDER_STEPS.length - 1,
		);
	});

	it("prev goes back but clamps at zero", () => {
		const store = useCreateCampaignStore.getState();
		store.goToStep(1);
		store.prev();
		expect(useCreateCampaignStore.getState().stepIndex).toBe(0);
		store.prev();
		expect(useCreateCampaignStore.getState().stepIndex).toBe(0);
	});

	it("goToStep clamps to valid bounds", () => {
		const store = useCreateCampaignStore.getState();
		store.goToStep(99);
		expect(useCreateCampaignStore.getState().stepIndex).toBe(
			CAMPAIGN_BUILDER_STEPS.length - 1,
		);
		store.goToStep(-5);
		expect(useCreateCampaignStore.getState().stepIndex).toBe(0);
	});

	it("reset restores initial state", () => {
		const store = useCreateCampaignStore.getState();
		store.setField("name", "Temp");
		store.setField("collectionId", "col-1");
		store.next();
		store.reset();
		const state = useCreateCampaignStore.getState();
		expect(state.name).toBe("");
		expect(state.collectionId).toBeNull();
		expect(state.stepIndex).toBe(0);
	});
});
