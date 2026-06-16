import type { EmailThreadMessage } from "../../types";
import { ThreadMessageItem } from "./thread-message-item";

interface ThreadMessagesProps {
	messages: EmailThreadMessage[];
}

export function ThreadMessages({ messages }: ThreadMessagesProps) {
	if (messages.length === 0) {
		return (
			<div className="flex flex-1 items-center justify-center py-8 text-muted-foreground text-sm">
				No messages
			</div>
		);
	}

	const lastIndex = messages.length - 1;

	return (
		<div className="flex flex-col gap-2 border-t p-4">
			<h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
				Messages ({messages.length})
			</h3>
			<div className="flex flex-col gap-3">
				{messages.map((message, i) => (
					<ThreadMessageItem
						key={message.id}
						message={message}
						defaultExpanded={i === lastIndex}
					/>
				))}
			</div>
		</div>
	);
}
