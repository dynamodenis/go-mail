import { useState, useCallback, useMemo } from "react";
import * as chrono from "chrono-node";
import {
	addDays,
	format,
	nextSaturday,
	nextMonday,
	setHours,
	setMinutes,
	setSeconds,
	isToday,
	isTomorrow,
} from "date-fns";
import {
	ClockIcon,
	CalendarIcon,
	XIcon,
	UsersIcon,
	MailIcon,
	PaperclipIcon,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogClose,
	DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import type { Recipient } from "../../types";
import { useEmailComposerStore } from "../../api/store";
import type { BatchSource } from "@/features/email-schedule/types";
import Loader from "@/components/global/loader";
/** All data needed to send an email at a scheduled time */
export interface ScheduledEmailData {
	sources: BatchSource[];
	cc: string[];
	bcc: string[];
	subject: string;
	bodyHtml: string;
	templateId?: string;
	scheduledAt: Date;
	attachmentCount: number;
	estimatedRecipientCount: number;
}

interface EmailScheduleModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSchedule: (data: ScheduledEmailData) => void;
	toRecipients: Recipient[];
	ccEmails: string[];
	bccEmails: string[];
	subject: string;
	bodyHtml: string;
	templateId?: string;
	attachmentCount: number;
	isPending: boolean;
}

interface PresetOption {
	label: string;
	description: string;
	getDate: () => Date;
}

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
		label: "Tomorrow morning",
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

	const nextWeek = setSeconds(
		setMinutes(setHours(nextMonday(now), 8), 0),
		0,
	);
	presets.push({
		label: "Next week",
		description: format(nextWeek, "EEE, MMM d, h:mm a"),
		getDate: () => nextWeek,
	});

	return presets;
}

type ModalView = "presets" | "calendar" | "confirm";

export default function EmailScheduleModal({
	open,
	onOpenChange,
	onSchedule,
	toRecipients,
	ccEmails,
	bccEmails,
	subject,
	bodyHtml,
	templateId,
	attachmentCount,
	isPending,
}: EmailScheduleModalProps) {
	const [view, setView] = useState<ModalView>("presets");
	const [inputValue, setInputValue] = useState("");
	const [parsedDate, setParsedDate] = useState<Date | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(
		undefined,
	);
	const [selectedTime, setSelectedTime] = useState("08:00");
	const [pendingDate, setPendingDate] = useState<Date | null>(null);
	const presets = useMemo(() => getPresets(), []);
	const getBatchSources = useEmailComposerStore((s) => s.getBatchSources);
	const getEstimatedRecipientCount = useEmailComposerStore(
		(s) => s.getEstimatedRecipientCount,
	);

	function buildScheduleData(scheduledAt: Date): ScheduledEmailData {
		return {
			sources: getBatchSources(),
			cc: ccEmails,
			bcc: bccEmails,
			subject,
			bodyHtml,
			templateId,
			scheduledAt,
			attachmentCount,
			estimatedRecipientCount: getEstimatedRecipientCount(),
		};
	}

	const resetState = useCallback(() => {
		setView("presets");
		setInputValue("");
		setParsedDate(null);
		setSelectedDate(undefined);
		setSelectedTime("08:00");
		setPendingDate(null);
	}, []);

	const handleOpenChange = useCallback(
		(nextOpen: boolean) => {
			onOpenChange(nextOpen);
			if (!nextOpen) resetState();
		},
		[onOpenChange, resetState],
	);

	const handleInputChange = useCallback((value: string) => {
		setInputValue(value);
		if (!value.trim()) {
			setParsedDate(null);
			return;
		}
		setParsedDate(chrono.parseDate(value));
	}, []);

	const goToConfirm = useCallback((date: Date) => {
		setPendingDate(date);
		setView("confirm");
	}, []);

	const handleSelectPreset = useCallback(
		(preset: PresetOption) => {
			goToConfirm(preset.getDate());
		},
		[goToConfirm],
	);

	const handleConfirmParsed = useCallback(() => {
		if (!parsedDate) return;
		goToConfirm(parsedDate);
	}, [parsedDate, goToConfirm]);

	const handleConfirmCustom = useCallback(() => {
		if (!selectedDate) return;
		const [hours, minutes] = selectedTime.split(":").map(Number);
		const finalDate = setSeconds(
			setMinutes(setHours(selectedDate, hours), minutes),
			0,
		);
		goToConfirm(finalDate);
	}, [selectedDate, selectedTime, goToConfirm]);

	const handleFinalConfirm = useCallback(() => {
		if (!pendingDate) return;
		onSchedule(buildScheduleData(pendingDate));
		handleOpenChange(false);
	}, [pendingDate, ccEmails, bccEmails, subject, bodyHtml, templateId, attachmentCount, onSchedule, handleOpenChange]);

	function formatParsedDate(date: Date): string {
		if (isToday(date)) return format(date, "'Today at' h:mm a");
		if (isTomorrow(date)) return format(date, "'Tomorrow at' h:mm a");
		return format(date, "EEE, MMM d 'at' h:mm a");
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				className="border bg-background p-0 shadow-xl sm:max-w-[420px] sm:rounded-xl"
				aria-describedby={undefined}
			>
				<DialogTitle className="sr-only">Schedule Email</DialogTitle>

				{/* Header */}
				<div className="flex items-center justify-between border-b px-4 py-3">
					<div className="flex items-center gap-2">
						<ClockIcon className="size-4 text-primary" />
						<span className="text-sm font-semibold">Schedule Send</span>
					</div>
					<DialogClose>
						<button
							type="button"
							className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
						>
							<XIcon className="size-4" />
						</button>
					</DialogClose>
				</div>

				{/* Summary strip */}
				<div className="flex flex-wrap items-center gap-3 border-b bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
					<span className="flex items-center gap-1">
						<UsersIcon className="size-3" />
						{getEstimatedRecipientCount().toLocaleString()} recipient
						{getEstimatedRecipientCount() !== 1 ? "s" : ""}
					</span>
					{subject && (
						<span className="flex items-center gap-1 truncate max-w-[180px]">
							<MailIcon className="size-3" />
							{subject}
						</span>
					)}
					{attachmentCount > 0 && (
						<span className="flex items-center gap-1">
							<PaperclipIcon className="size-3" />
							{attachmentCount} file{attachmentCount !== 1 ? "s" : ""}
						</span>
					)}
				</div>

				{view === "presets" && (
					<div className="flex flex-col">
						{/* Natural language input */}
						<div className="px-4 py-3">
							<input
								type="text"
								placeholder='Try "3pm", "friday", "in 2 days"...'
								value={inputValue}
								onChange={(e) => handleInputChange(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleConfirmParsed();
								}}
								className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary"
							/>
							{parsedDate && (
								<button
									type="button"
									onClick={handleConfirmParsed}
									className="mt-2 flex w-full items-center justify-between rounded-md bg-primary/5 px-3 py-2 text-sm hover:bg-primary/10"
								>
									<span className="font-medium text-foreground">
										{formatParsedDate(parsedDate)}
									</span>
									<span className="text-xs text-muted-foreground">
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
									className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent"
								>
									<ClockIcon className="size-3.5 text-muted-foreground" />
									<span className="flex-1 text-left font-medium text-foreground">
										{preset.label}
									</span>
									<span className="text-xs text-muted-foreground">
										{preset.description}
									</span>
								</button>
							))}
						</div>

						{/* Pick date & time link */}
						<div className="border-t">
							<button
								type="button"
								onClick={() => setView("calendar")}
								className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-accent"
							>
								<CalendarIcon className="size-3.5 text-muted-foreground" />
								<span className="font-medium text-foreground">
									Pick date & time
								</span>
							</button>
						</div>
					</div>
				)}

				{view === "calendar" && (
					<div className="flex flex-col">
						{/* Back button */}
						<div className="px-4 pt-2">
							<button
								type="button"
								onClick={() => setView("presets")}
								className="text-xs text-muted-foreground hover:text-foreground"
							>
								&larr; Back to presets
							</button>
						</div>

						{/* Calendar */}
						<div className="flex justify-center px-2 py-2">
							<Calendar
								mode="single"
								selected={selectedDate}
								onSelect={setSelectedDate}
								disabled={{ before: new Date() }}
							/>
						</div>

						{/* Time picker + confirm */}
						<div className="flex items-center gap-2 border-t px-4 py-3">
							<ClockIcon className="size-4 text-muted-foreground" />
							<input
								type="time"
								value={selectedTime}
								onChange={(e) => setSelectedTime(e.target.value)}
								className="flex-1 rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
							/>
							<Button
								size="sm"
								disabled={!selectedDate}
								onClick={handleConfirmCustom}
							>
								Schedule
							</Button>
						</div>

						{selectedDate && (
							<div className="border-t px-4 py-2 text-center text-xs text-muted-foreground">
								{format(selectedDate, "EEEE, MMMM d, yyyy")} at{" "}
								{selectedTime}
							</div>
						)}
					</div>
				)}

				{view === "confirm" && pendingDate && (
					<div className="flex flex-col items-center px-6 py-6">
						<div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
							<CalendarIcon className="size-6 text-primary" />
						</div>

						<p className="text-sm font-semibold text-foreground">
							{isToday(pendingDate)
								? "Today"
								: isTomorrow(pendingDate)
									? "Tomorrow"
									: format(pendingDate, "EEEE, MMMM d, yyyy")}
						</p>
						<p className="text-lg font-bold text-primary">
							{format(pendingDate, "h:mm a")}
						</p>

						<div className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
							<UsersIcon className="size-3.5" />
							<span>
								{getEstimatedRecipientCount().toLocaleString()} recipient
								{getEstimatedRecipientCount() !== 1 ? "s" : ""}
							</span>
							{(ccEmails.length > 0 || bccEmails.length > 0) && (
								<span className="text-xs">
									({ccEmails.length > 0 ? `${ccEmails.length} cc` : ""}
									{ccEmails.length > 0 && bccEmails.length > 0 ? ", " : ""}
									{bccEmails.length > 0 ? `${bccEmails.length} bcc` : ""})
								</span>
							)}
						</div>

						{attachmentCount > 0 && (
							<div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
								<PaperclipIcon className="size-3" />
								{attachmentCount} attachment{attachmentCount !== 1 ? "s" : ""}
							</div>
						)}

						<div className="mt-6 flex w-full gap-2">
							<Button
								variant="outline"
								className="flex-1"
								onClick={() => setView("presets")}
							>
								Change time
							</Button>
							<Button
								className="flex-1"
								onClick={handleFinalConfirm}
								disabled={isPending}
							>
								{isPending ? <Loader size={16} /> : "Confirm Schedule"}
							</Button>
						</div>
					</div>
				)}

			</DialogContent>
		</Dialog>
	);
}
