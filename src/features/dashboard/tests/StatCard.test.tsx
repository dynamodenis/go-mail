import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatCard } from "../components/StatCard";
import type { KpiCardData } from "../types";

function makeCard(overrides: Partial<KpiCardData> = {}): KpiCardData {
	return {
		label: "Total Sends",
		value: 1234,
		previousValue: 1000,
		changePercent: 23.4,
		format: "number",
		...overrides,
	};
}

describe("StatCard", () => {
	it("renders label and formatted number value", () => {
		render(<StatCard data={makeCard()} />);
		expect(screen.getByText("Total Sends")).toBeInTheDocument();
		expect(screen.getByText("1,234")).toBeInTheDocument();
	});

	it("formats rate values with percent sign", () => {
		render(<StatCard data={makeCard({ label: "Open Rate", value: 42.5, format: "rate" })} />);
		expect(screen.getByText("42.5%")).toBeInTheDocument();
	});

	it("formats percent values with percent sign", () => {
		render(<StatCard data={makeCard({ value: 80, format: "percent" })} />);
		expect(screen.getByText("80%")).toBeInTheDocument();
	});

	it("shows positive change with correct percentage", () => {
		render(<StatCard data={makeCard({ changePercent: 15.5 })} />);
		expect(screen.getByText("15.5%")).toBeInTheDocument();
	});

	it("shows negative change with absolute percentage", () => {
		render(<StatCard data={makeCard({ changePercent: -10 })} />);
		expect(screen.getByText("10%")).toBeInTheDocument();
	});

	it("shows zero change", () => {
		render(<StatCard data={makeCard({ changePercent: 0 })} />);
		expect(screen.getByText("0%")).toBeInTheDocument();
	});
});
