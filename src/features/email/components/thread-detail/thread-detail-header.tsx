import type { EmailParticipant } from "../../types";
import {
	avatarColor,
	emailInitials,
	participantLabel,
} from "../../utils/email-format";

interface ThreadDetailHeaderProps {
	participants: EmailParticipant[];
}

export function ThreadDetailHeader({ participants }: ThreadDetailHeaderProps) {
	return (
		<div className="flex gap-3 overflow-x-auto border-b px-4 py-3">
			{participants.map((p, i) => {
				const label = participantLabel(p);
				return (
					<div
						key={p.email}
						className="flex shrink-0 flex-col items-center gap-1"
						title={label}
					>
						<div
							className={`flex size-8 items-center justify-center rounded-full font-medium text-white text-xs ${avatarColor(i)}`}
						>
							{emailInitials(label)}
						</div>
						<span className="max-w-[72px] truncate text-center text-[10px] text-muted-foreground">
							{label}
						</span>
					</div>
				);
			})}
		</div>
	);
}
