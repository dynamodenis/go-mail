import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { TemplateCard } from "../components/list/template-card";
import type { Template } from "../types";

const MOCK_TEMPLATE: Template = {
	id: "550e8400-e29b-41d4-a716-446655440000",
	name: "Welcome Email",
	subject: "Welcome to our platform!",
	bodyHtml: "<p>Hello</p>",
	bodyJson: {},
	category: "ONBOARDING",
	thumbnailUrl: null,
	timesUsed: 3,
	createdAt: "2025-01-01T00:00:00.000Z",
	updatedAt: "2025-02-01T00:00:00.000Z",
};

function renderWithRouter(template: Template, onDelete: (id: string) => void) {
	const rootRoute = createRootRoute();
	const indexRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/",
		component: () => <TemplateCard template={template} onDelete={onDelete} />,
	});
	rootRoute.addChildren([indexRoute]);
	const router = createRouter({
		routeTree: rootRoute,
		history: createMemoryHistory({ initialEntries: ["/"] }),
	});
	return render(<RouterProvider router={router} />);
}

describe("TemplateCard", () => {
	it("renders template name and subject", async () => {
		renderWithRouter(MOCK_TEMPLATE, vi.fn());
		await waitFor(() => {
			expect(screen.getByText("Welcome Email")).toBeInTheDocument();
		});
		expect(
			screen.getByText("Welcome to our platform!"),
		).toBeInTheDocument();
	});

	it("renders category badge", async () => {
		renderWithRouter(MOCK_TEMPLATE, vi.fn());
		await waitFor(() => {
			expect(screen.getByText("Onboarding")).toBeInTheDocument();
		});
	});

	it("calls onDelete with correct id when delete button is clicked", async () => {
		const onDelete = vi.fn();
		renderWithRouter(MOCK_TEMPLATE, onDelete);
		await waitFor(() => {
			expect(screen.getByLabelText("Delete Welcome Email")).toBeInTheDocument();
		});
		fireEvent.click(screen.getByLabelText("Delete Welcome Email"));
		expect(onDelete).toHaveBeenCalledWith(MOCK_TEMPLATE.id);
	});

	it("renders edit link with correct href", async () => {
		renderWithRouter(MOCK_TEMPLATE, vi.fn());
		await waitFor(() => {
			expect(screen.getByText("Edit")).toBeInTheDocument();
		});
		const editLink = screen.getByText("Edit");
		expect(editLink.closest("a")).toHaveAttribute(
			"href",
			`/outreach-composer/email-templates/${MOCK_TEMPLATE.id}/edit`,
		);
	});

	it("does not render attachment count when zero", async () => {
		renderWithRouter(MOCK_TEMPLATE, vi.fn());
		await waitFor(() => {
			expect(screen.getByText("Welcome Email")).toBeInTheDocument();
		});
		expect(screen.queryByText("0")).not.toBeInTheDocument();
	});

	it("renders attachment count when greater than zero", async () => {
		const templateWithAttachments: Template = {
			...MOCK_TEMPLATE,
			attachmentCount: 3,
		};
		renderWithRouter(templateWithAttachments, vi.fn());
		await waitFor(() => {
			expect(screen.getByText("3")).toBeInTheDocument();
		});
	});
});
