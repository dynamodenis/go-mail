import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ContactStatus } from "../../types";

const STATUS_CONFIG: Record<
  ContactStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Active",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  },
  UNSUBSCRIBED: {
    label: "Unsubscribed",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  },
  BOUNCED: {
    label: "Bounced",
    className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  },
  CLEANED: {
    label: "Cleaned",
    className:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  },
};

interface ContactStatusBadgeProps {
  status: ContactStatus;
}

export function ContactStatusBadge({ status }: ContactStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={cn("border-0", config.className)}>
      {config.label}
    </Badge>
  );
}
