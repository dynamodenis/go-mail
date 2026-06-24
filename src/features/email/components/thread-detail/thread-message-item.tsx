import { cn } from "@/lib/utils";
import DOMPurify from "isomorphic-dompurify";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import {
	emailInitials,
	formatMessageDate,
	participantLabel,
} from "../../utils/email-format";
import type { EmailThreadMessage } from "../../types";

interface ThreadMessageItemProps {
	message: EmailThreadMessage;
	/** The most recent message starts expanded. */
	defaultExpanded?: boolean;
}

export function ThreadMessageItem({
	message,
	defaultExpanded = false,
}: ThreadMessageItemProps) {
	const [isExpanded, setIsExpanded] = useState(defaultExpanded);
	const senderLabel = participantLabel(message.from);
	// Email bodies arrive as HTML — sanitize before rendering to prevent XSS.
	const sanitizedBody = useMemo(
		() => DOMPurify.sanitize(message.body),
		[message.body],
	);

	return (
		<div className="rounded-md border bg-card transition-colors hover:border-foreground/20">
			<button
				type="button"
				onClick={() => setIsExpanded((prev) => !prev)}
				className="flex w-full items-center gap-2 px-3 py-2 text-left"
			>
				<div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-xs">
					{emailInitials(senderLabel)}
				</div>
				<div className="min-w-0 flex-1">
					<p className="truncate font-medium text-sm">{senderLabel}</p>
					<p className="truncate text-muted-foreground text-xs">
						{message.snippet}
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-1">
					<span className="text-muted-foreground text-xs">
						{formatMessageDate(message.date)}
					</span>
					<ChevronDown
						className={cn(
							"size-4 text-muted-foreground transition-transform duration-200",
							isExpanded && "rotate-180",
						)}
					/>
				</div>
			</button>

			<div
				className={cn(
					"grid overflow-hidden transition-all duration-300",
					isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				)}
			>
				<div className="overflow-hidden">
					<div className="border-t px-3 py-3">
						<div className="mb-2 text-muted-foreground text-xs">
							To: {message.to.map((t) => t.email).join(", ")}
							{message.cc && message.cc.length > 0 && (
								<span className="ml-2">
									Cc: {message.cc.map((c) => c.email).join(", ")}
								</span>
							)}
						</div>
						<div
							className="max-w-none break-words text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_img]:max-w-full"
							// Sanitized above with DOMPurify — safe to render as HTML.
							// biome-ignore lint/security/noDangerouslySetInnerHtml: email body is sanitized with DOMPurify
							dangerouslySetInnerHTML={{ __html: sanitizedBody }}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
