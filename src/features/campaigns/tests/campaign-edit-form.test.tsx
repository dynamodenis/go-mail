import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CampaignEditForm } from "../components/campaign-detail/campaign-edit-form";
import type { CampaignDetail } from "../types";

const h = vi.hoisted(() => ({
	mutate: vi.fn((_input: unknown, opts?: { onSuccess?: () => void }) =>
		opts?.onSuccess?.(),
	),
	isPending: false,
}));

vi.mock("../api/queries", () => ({
	useUpdateCampaign: () => ({ mutate: h.mutate, isPending: h.isPending }),
}));

vi.mock("@/features/email-templates/api/queries", () => ({
	useTemplates: () => ({
		data: { data: [{ id: "tpl-1", name: "Welcome", category: "ONBOARDING" }] },
	}),
}));

vi.mock("@/features/collections/api/queries", () => ({
	useCollections: () => ({
		data: { data: [{ id: "col-1", name: "VIPs", contactCount: 10 }] },
	}),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const campaign: CampaignDetail = {
	id: "camp-1",
	name: "June Newsletter",
	subject: "Hello June",
	status: "DRAFT",
	templateId: "tpl-1",
	templateName: "Welcome",
	collectionId: "col-1",
	collectionName: "VIPs",
	previewText: "",
	scheduledAt: null,
	sentAt: null,
	totalRecipients: 0,
	delivered: 0,
	opened: 0,
	clicked: 0,
	bounced: 0,
	unsubscribed: 0,
	createdAt: "2026-06-01T00:00:00.000Z",
	updatedAt: "2026-06-01T00:00:00.000Z",
};

describe("CampaignEditForm", () => {
	beforeEach(() => {
		h.mutate.mockClear();
		h.isPending = false;
	});

	it("prefills inputs from the campaign", () => {
		render(<CampaignEditForm campaign={campaign} onDone={vi.fn()} />);
		expect(screen.getByDisplayValue("June Newsletter")).toBeInTheDocument();
		expect(screen.getByDisplayValue("Hello June")).toBeInTheDocument();
	});

	it("submits the edited fields and calls onDone on success", () => {
		const onDone = vi.fn();
		render(<CampaignEditForm campaign={campaign} onDone={onDone} />);

		fireEvent.change(screen.getByDisplayValue("June Newsletter"), {
			target: { value: "July Newsletter" },
		});
		fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

		expect(h.mutate).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "camp-1",
				name: "July Newsletter",
				subject: "Hello June",
				templateId: "tpl-1",
				collectionId: "col-1",
				status: "DRAFT",
				scheduledAt: null,
			}),
			expect.objectContaining({ onSuccess: expect.any(Function) }),
		);
		expect(onDone).toHaveBeenCalled();
	});

	it("disables Save when a required field is cleared", () => {
		render(<CampaignEditForm campaign={campaign} onDone={vi.fn()} />);
		fireEvent.change(screen.getByDisplayValue("June Newsletter"), {
			target: { value: "" },
		});
		expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
	});
});
