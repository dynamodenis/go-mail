import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useDashboardUIStore } from "../api/store";
import type { DateRange } from "../types";

const OPTIONS: { value: DateRange; label: string }[] = [
	{ value: "7d", label: "Last 7 days" },
	{ value: "30d", label: "Last 30 days" },
	{ value: "90d", label: "Last 90 days" },
];

export function DashboardDateFilter() {
	const range = useDashboardUIStore((s) => s.selectedDateRange);
	const setRange = useDashboardUIStore((s) => s.setDateRange);

	return (
		<Select value={range} onValueChange={(v) => setRange(v as DateRange)}>
			<SelectTrigger className="w-[160px]">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{OPTIONS.map((opt) => (
					<SelectItem key={opt.value} value={opt.value}>
						{opt.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
