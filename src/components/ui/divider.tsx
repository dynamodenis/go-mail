import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const dividerVariants = cva("h-px w-full", {
  variants: {
    variant: {
      default:
        "bg-[radial-gradient(36.95%_629.2%_at_50%_50%,rgba(255,255,255,0.25)_41.5%,rgba(94,94,94,0.25)_100%)]",
      yellow:
        "bg-[linear-gradient(270deg,rgba(250,204,21,0.05)_0%,rgba(250,204,21,0.70)_51.5%,rgba(250,204,21,0.05)_100%)]",
    "blue-light-horizontal":
          "bg-[linear-gradient(270deg,rgba(96,165,250,0.05)_0%,rgb(96,165,250)_51.5%,rgba(96,165,250,0.05)_100%)]",
      "activity-colors-travel":
        "bg-[linear-gradient(270deg,rgba(34,211,238,0.05)_0%,rgba(34,211,238,0.7)_51.5%,rgba(34,211,238,0.05)_100%)]"
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface DividerProps extends VariantProps<typeof dividerVariants> {
  className?: string;
}

export default function Divider({ className, variant }: DividerProps) {
  return <div className={cn(dividerVariants({ variant }), className)} />;
}
