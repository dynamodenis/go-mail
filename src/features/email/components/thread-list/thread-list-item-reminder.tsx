import OrbiterBox from "@/components/global/orbiter-box";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import * as chrono from "chrono-node";
import {
	addDays,
	format,
	isToday,
	isTomorrow,
	nextMonday,
	nextSaturday,
	setHours,
	setMinutes,
	setSeconds,
} from "date-fns";
import {
	Calendar as CalendarIcon,
	ChevronLeft,
	ChevronRight,
	Clock,
	X,
} from "lucide-react";
import { Suspense, lazy, useCallback, useState } from "react";

// The calendar pulls in react-day-picker; load it only when the custom
// date/time dialog is actually opened.
const Calendar = lazy(() =>
	import("@/components/ui/calendar").then((m) => ({ default: m.Calendar })),
);

const CalendarSkeleton = () => (
	<div
		aria-hidden="true"
		className="h-[300px] w-[252px] animate-pulse bg-transparent p-2"
	/>
);

const DEFAULT_TIME = "08:00";

interface ThreadListItemReminderProps {
	/** Called with the chosen time to bring the thread back to the inbox. */
	onSetReminder: (date: Date) => void;
}

interface PresetOption {
	label: string;
	description: string;
	getDate: () => Date;
}

/** Builds the quick-pick options, hiding ones that have already passed today
 *  (e.g. "Later today" disappears after 5pm) and weekend/weekday-specific ones. */
function getPresets(): PresetOption[] {
	const now = new Date();
	const currentHour = now.getHours();
	const presets: PresetOption[] = [];

	if (currentHour < 17) {
		const laterToday = setSeconds(
			setMinutes(setHours(now, Math.min(currentHour + 3, 17)), 0),
			0,
		);
		presets.push({
			label: "Later today",
			description: format(laterToday, "h:mm a"),
			getDate: () => laterToday,
		});
	}

	if (currentHour < 18) {
		const evening = setSeconds(setMinutes(setHours(now, 20), 0), 0);
		presets.push({
			label: "This evening",
			description: format(evening, "h:mm a"),
			getDate: () => evening,
		});
	}

	const tomorrowMorning = setSeconds(
		setMinutes(setHours(addDays(now, 1), 8), 0),
		0,
	);
	presets.push({
		label: "Tomorrow",
		description: format(tomorrowMorning, "EEE, h:mm a"),
		getDate: () => tomorrowMorning,
	});

	const dayOfWeek = now.getDay();
	if (dayOfWeek >= 1 && dayOfWeek <= 5) {
		const weekend = setSeconds(
			setMinutes(setHours(nextSaturday(now), 9), 0),
			0,
		);
		presets.push({
			label: "This weekend",
			description: format(weekend, "EEE, h:mm a"),
			getDate: () => weekend,
		});
	}

	const nextWeek = setSeconds(setMinutes(setHours(nextMonday(now), 8), 0), 0);
	presets.push({
		label: "Next week",
		description: format(nextWeek, "EEE, h:mm a"),
		getDate: () => nextWeek,
	});

	return presets;
}

function formatParsedDate(date: Date): string {
	if (isToday(date)) return format(date, "'Today at' h:mm a");
	if (isTomorrow(date)) return format(date, "'Tomorrow at' h:mm a");
	return format(date, "EEE, MMM d 'at' h:mm a");
}

export function ThreadListItemReminder({
	onSetReminder,
}: ThreadListItemReminderProps) {
	const [presetsOpen, setPresetsOpen] = useState(false);
	const [calendarOpen, setCalendarOpen] = useState(false);
	const [inputValue, setInputValue] = useState("");
	const [parsedDate, setParsedDate] = useState<Date | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const [selectedTime, setSelectedTime] = useState(DEFAULT_TIME);
	const presets = getPresets();

	const handleInputChange = useCallback((value: string) => {
		setInputValue(value);
		setParsedDate(value.trim() ? chrono.parseDate(value) : null);
	}, []);

	const handleSelectPreset = useCallback(
		(preset: PresetOption) => {
			onSetReminder(preset.getDate());
			setPresetsOpen(false);
		},
		[onSetReminder],
	);

	const handleConfirmParsed = useCallback(() => {
		if (!parsedDate) return;
		onSetReminder(parsedDate);
		setPresetsOpen(false);
	}, [parsedDate, onSetReminder]);

	const handleConfirmCustom = useCallback(() => {
		if (!selectedDate) return;
		const [hours, minutes] = selectedTime.split(":").map(Number);
		onSetReminder(
			setSeconds(setMinutes(setHours(selectedDate, hours), minutes), 0),
		);
		setCalendarOpen(false);
	}, [selectedDate, selectedTime, onSetReminder]);

	function handlePresetsOpenChange(nextOpen: boolean) {
		setPresetsOpen(nextOpen);
		if (!nextOpen) {
			setInputValue("");
			setParsedDate(null);
		}
	}

	function handleCalendarOpenChange(nextOpen: boolean) {
		setCalendarOpen(nextOpen);
		if (!nextOpen) {
			setSelectedDate(undefined);
			setSelectedTime(DEFAULT_TIME);
		}
	}

	return (
		<>
			<button
				type="button"
				aria-label="Snooze"
				title="Snooze"
				onClick={(e) => {
					e.stopPropagation();
					setPresetsOpen(true);
				}}
				className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted-foreground/15 hover:text-foreground"
			>
				<Clock className="size-3.5" />
			</button>

			{/* Presets dialog */}
			<Dialog open={presetsOpen} onOpenChange={handlePresetsOpenChange}>
				<DialogContent
					className="overflow-hidden border-none p-0 sm:max-w-[300px] sm:rounded-lg"
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
				>
					<DialogTitle className="sr-only">Snooze until</DialogTitle>
					<OrbiterBox variant="blue-light-horizontal" borderRadius={8}>
						<div className="flex flex-col bg-background sm:rounded-lg">
							<div className="flex items-center justify-between gap-2 px-3 py-2.5">
								<div className="flex items-center gap-2">
									<Clock className="size-4 text-muted-foreground" />
									<span className="font-medium text-sm">Snooze until</span>
								</div>
								<HeaderCloseButton />
							</div>

							{/* Natural language input */}
							<div className="border-t px-3 py-2">
								<input
									type="text"
									placeholder="Try: 3pm, friday, 2 days…"
									aria-label="Custom snooze time"
									value={inputValue}
									onChange={(e) => handleInputChange(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") handleConfirmParsed();
									}}
									className="w-full rounded bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
								/>
								{parsedDate && (
									<button
										type="button"
										onClick={handleConfirmParsed}
										className="mt-1.5 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
									>
										<span className="text-foreground">
											{formatParsedDate(parsedDate)}
										</span>
										<span className="text-muted-foreground text-xs">
											{format(parsedDate, "MMM d, h:mm a")}
										</span>
									</button>
								)}
							</div>

							{/* Quick presets */}
							<div className="flex flex-col border-t py-1">
								{presets.map((preset) => (
									<button
										key={preset.label}
										type="button"
										onClick={() => handleSelectPreset(preset)}
										className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted"
									>
										<span className="flex-1 text-left text-foreground">
											{preset.label}
										</span>
										<span className="text-muted-foreground text-xs">
											{preset.description}
										</span>
									</button>
								))}
							</div>

							{/* Pick date & time */}
							<div className="border-t">
								<button
									type="button"
									onClick={() => {
										setPresetsOpen(false);
										setCalendarOpen(true);
									}}
									className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted"
								>
									<CalendarIcon className="size-4 text-muted-foreground" />
									<span className="text-foreground">Pick date & time</span>
								</button>
							</div>
						</div>
					</OrbiterBox>
				</DialogContent>
			</Dialog>

			{/* Custom date/time dialog */}
			<Dialog open={calendarOpen} onOpenChange={handleCalendarOpenChange}>
				<DialogContent
					className="overflow-hidden border-none p-0 sm:max-w-[340px] sm:rounded-lg"
					onClick={(e) => e.stopPropagation()}
				>
					<DialogTitle className="sr-only">Pick date & time</DialogTitle>
					<OrbiterBox variant="blue-light-horizontal" borderRadius={8}>
						<div className="bg-background sm:rounded-lg">
							<div className="flex items-center justify-between gap-2 px-4 py-3">
								<div className="flex items-center gap-2">
									<CalendarIcon className="size-4 text-muted-foreground" />
									<span className="font-medium text-sm">Pick date & time</span>
								</div>
								<HeaderCloseButton />
							</div>

							<div className="flex justify-center border-t px-2 py-2">
								<Suspense fallback={<CalendarSkeleton />}>
									<Calendar
										mode="single"
										selected={selectedDate}
										onSelect={setSelectedDate}
										disabled={{ before: new Date() }}
										className="relative"
										classNames={{
											// Lay the nav out as a full-width bar over the caption row so
											// the prev/next buttons sit on opposite edges and stay
											// clickable (the default absolute buttons could overlap).
											nav: "absolute inset-x-3 top-3 flex items-center justify-between",
											button_previous:
												"inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-30",
											button_next:
												"inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-30",
										}}
										components={{
											Chevron: ({ orientation }) =>
												orientation === "left" ? (
													<ChevronLeft className="size-4" strokeWidth={2.5} />
												) : (
													<ChevronRight className="size-4" strokeWidth={2.5} />
												),
										}}
									/>
								</Suspense>
							</div>

							<div className="flex items-center gap-2 border-t px-4 py-3">
								<Clock className="size-4 text-muted-foreground" />
								<input
									type="time"
									aria-label="Snooze time"
									value={selectedTime}
									onChange={(e) => setSelectedTime(e.target.value)}
									className="flex-1 rounded-md border bg-transparent px-2 py-1 text-sm outline-none focus:border-ring"
								/>
								<Button
									size="sm"
									disabled={!selectedDate}
									onClick={handleConfirmCustom}
								>
									Snooze
								</Button>
							</div>
						</div>
					</OrbiterBox>
				</DialogContent>
			</Dialog>
		</>
	);
}

/** Small X close button, rendered inline at the end of a dialog header row so it
 *  never overlaps content (e.g. the calendar's month/year nav chevrons). */
function HeaderCloseButton({ className }: { className?: string }) {
	return (
		<DialogClose
			className={cn(
				"flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
				className,
			)}
		>
			<X className="size-4" />
			<span className="sr-only">Close</span>
		</DialogClose>
	);
}
