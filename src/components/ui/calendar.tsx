import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, ...props }: CalendarProps) {
	return (
		<DayPicker
			className={cn("p-3", className)}
			classNames={{
				months: "flex flex-col sm:flex-row gap-2",
				month: "flex flex-col gap-4",
				month_caption: "flex justify-center pt-1 relative items-center",
				caption_label: "text-sm font-medium",
				nav: "flex items-center gap-1",
				button_previous:
					"absolute left-1 top-0 inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-transparent p-0 text-muted-foreground opacity-50 hover:opacity-100",
				button_next:
					"absolute right-1 top-0 inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-transparent p-0 text-muted-foreground opacity-50 hover:opacity-100",
				month_grid: "w-full border-collapse",
				weekdays: "flex",
				weekday:
					"text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
				week: "flex w-full mt-2",
				day: "relative p-0 text-center text-sm",
				day_button:
					"inline-flex h-8 w-8 items-center justify-center rounded-md p-0 font-normal hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring aria-selected:opacity-100",
				selected:
					"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
				today: "bg-accent text-accent-foreground rounded-md",
				outside:
					"text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
				disabled: "text-muted-foreground opacity-50",
				hidden: "invisible",
				...classNames,
			}}
			components={{
				Chevron: ({ orientation }) =>
					orientation === "left" ? (
						<ChevronLeftIcon className="size-4" />
					) : (
						<ChevronRightIcon className="size-4" />
					),
			}}
			{...props}
		/>
	);
}
Calendar.displayName = "Calendar";

export { Calendar };
