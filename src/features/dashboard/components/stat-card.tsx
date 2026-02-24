import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { KpiCardData } from "../types";

interface StatCardProps {
	data: KpiCardData;
}

function formatValue(value: number, format: KpiCardData["format"]): string {
	if (format === "percent" || format === "rate") {
		return `${value}%`;
	}
	return value.toLocaleString();
}

export function StatCard({ data }: StatCardProps) {
	const { label, value, changePercent, format } = data;
	const isPositive = changePercent > 0;
	const isNeutral = changePercent === 0;
	const isBounce = label === "Bounce Rate";

	// For bounce rate, going up is bad
	const trendColor = isNeutral
		? "text-muted-foreground"
		: (isPositive && !isBounce) || (!isPositive && isBounce)
			? "text-green-600"
			: "text-red-600";

	const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

	return (
		<Card>
			<CardContent className="p-5">
				<p className="text-sm font-medium text-muted-foreground">{label}</p>
				<div className="mt-2 flex items-baseline gap-2">
					<span className="text-2xl font-bold">
						{formatValue(value, format)}
					</span>
					<span
						className={`flex items-center gap-0.5 text-xs font-medium ${trendColor}`}
					>
						<TrendIcon className="h-3 w-3" />
						{Math.abs(changePercent)}%
					</span>
				</div>
			</CardContent>
		</Card>
	);
}
