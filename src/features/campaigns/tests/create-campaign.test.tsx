import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateCampaign from "../components/create-campaign";
import { useCreateCampaignStore } from "../api/create-campaign-store";

// Shared refs reachable from inside the hoisted mock factories.
const h = vi.hoisted(() => ({
	navigate: vi.fn(),
	mutate: vi.fn(),
	isPending: false,
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => h.navigate,
}));

vi.mock("../api/queries", () => ({
	useCreateCampaign: () => ({ mutate: h.mutate, isPending: h.isPending }),
}));

// The step bodies fetch templates/collections via React Query; stub them so the
// orchestrator test stays focused on navigation + the submit contract.
vi.mock("../components/campaign-builder/campaign-template-step", () => ({
	CampaignTemplateStep: () => <div>template step</div>,
}));
vi.mock("../components/campaign-builder/campaign-recipients-step", () => ({
	CampaignRecipientsStep: () => <div>recipients step</div>,
}));
vi.mock("../components/campaign-builder/campaign-review-step", () => ({
	CampaignReviewStep: () => <div>review step</div>,
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

describe("CreateCampaign orchestrator", () => {
	beforeEach(() => {
		h.navigate.mockClear();
		h.mutate.mockClear();
		h.isPending = false;
		useCreateCampaignStore.getState().reset();
	});

	it("starts on the template step with Next disabled until required fields are set", () => {
		render(<CreateCampaign />);
		expect(screen.getByText("template step")).toBeInTheDocument();
		const next = screen.getByRole("button", { name: /next/i });
		expect(next).toBeDisabled();
	});

	it("enables Next and advances once the template step is valid", () => {
		render(<CreateCampaign />);
		// The component resets the store on mount, so populate after render and
		// wrap in act() to flush the resulting re-render.
		act(() => {
			const store = useCreateCampaignStore.getState();
			store.setField("name", "Launch");
			store.setField("subject", "Hello");
			store.setField("templateId", "tpl-1");
		});

		const next = screen.getByRole("button", { name: /next/i });
		expect(next).toBeEnabled();
		fireEvent.click(next);
		expect(screen.getByText("recipients step")).toBeInTheDocument();
	});

	it("submits the collected input on the final step", () => {
		render(<CreateCampaign />);
		// Reset-on-mount runs first; seed the completed wizard after mount (in act
		// so the jump to the review step flushes).
		act(() => {
			useCreateCampaignStore.setState({
				stepIndex: 2,
				name: "Launch",
				subject: "Hello",
				templateId: "tpl-1",
				collectionId: "col-1",
				scheduledAt: null,
			});
		});

		const create = screen.getByRole("button", { name: /create campaign/i });
		fireEvent.click(create);
		expect(h.mutate).toHaveBeenCalledWith(
			{
				name: "Launch",
				subject: "Hello",
				templateId: "tpl-1",
				collectionId: "col-1",
				scheduledAt: undefined,
			},
			expect.objectContaining({ onSuccess: expect.any(Function) }),
		);
	});

	it("navigates back to the list when cancelling from step one", () => {
		render(<CreateCampaign />);
		fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
		expect(h.navigate).toHaveBeenCalledWith({ to: "/campaigns" });
	});
});
