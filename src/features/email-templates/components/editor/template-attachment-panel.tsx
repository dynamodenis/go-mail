import { Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { TemplateAttachment } from "../../types";

interface TemplateAttachmentPanelProps {
	templateId?: string;
	attachments: TemplateAttachment[];
	onRemove: (attachmentId: string) => void;
}

const SIZE_UNITS = ["B", "KB", "MB", "GB"] as const;
const BYTES_PER_UNIT = 1024;

function formatFileSize(bytes: number): string {
	let unitIndex = 0;
	let size = bytes;
	while (size >= BYTES_PER_UNIT && unitIndex < SIZE_UNITS.length - 1) {
		size /= BYTES_PER_UNIT;
		unitIndex++;
	}
	return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${SIZE_UNITS[unitIndex]}`;
}

export function TemplateAttachmentPanel({
	templateId,
	attachments,
	onRemove,
}: TemplateAttachmentPanelProps) {
	if (!templateId) {
		return (
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm">Attachments</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-xs text-muted-foreground">
						Save template first to add attachments.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm">Attachments</CardTitle>
				</div>
			</CardHeader>
			<CardContent className="flex flex-col gap-2">
				{attachments.length === 0 ? (
					<p className="text-xs text-muted-foreground">
						No attachments yet.
					</p>
				) : (
					attachments.map((att) => (
						<div
							key={att.id}
							className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5"
						>
							<div className="flex items-center gap-2 overflow-hidden">
								<Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
								<div className="overflow-hidden">
									<p className="truncate text-xs font-medium">
										{att.fileName}
									</p>
									<p className="text-xs text-muted-foreground">
										{formatFileSize(att.fileSize)}
									</p>
								</div>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="h-6 w-6 shrink-0 p-0 text-muted-foreground hover:text-destructive"
								onClick={() => onRemove(att.id)}
							>
								<Trash2 className="h-3 w-3" />
							</Button>
						</div>
					))
				)}
			</CardContent>
		</Card>
	);
}
