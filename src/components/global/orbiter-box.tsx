import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

interface OrbiterBoxProps {
  className?: string;
  children: React.ReactNode;
  borderRadius?: number;
  borderRadiusTopLeft?: number;
  borderRadiusTopRight?: number;
  borderRadiusBottomLeft?: number;
  borderRadiusBottomRight?: number;
  borderWidth?: number;
}

const orbiterBoxVariants = cva(
  "bg-cover w-full bg-center relative after:content-[''] after:absolute after:pointer-events-none  after:inset-0 after:border after:border-transparent after:[mask:linear-gradient(hsl(0_0%_100%/0),hsl(0_0%_100%/0)),linear-gradient(hsl(0_0%_100%),hsl(0_0%_100%))] after:[mask-clip:padding-box,border-box]! after:mask-intersect! after:rounded-[inherit]! after:[border-width:var(--pseudo-border-width)]! after:w-[inherit] after:h-[inherit]",
  {
    variants: {
      variant: {
        default:
          "after:bg-linear-[180deg,rgba(96,165,250,0.2)_0%,#FAFAFA_50%,rgba(96,165,250,0.2)_100%]",
        "blue-horizontal":
          "after:bg-[radial-gradient(50%_110.18%_at_50%_50%,#456AA5_25%,#2B2B2B_100%)]",
        "blue-light-horizontal":
          "after:bg-[linear-gradient(270deg,rgba(96,165,250,0.05)_0%,rgb(96,165,250)_51.5%,rgba(96,165,250,0.05)_100%)]",
        "blue-light-vertical":
          "after:bg-[linear-gradient(180deg,rgba(96,165,250,0.05)_0%,rgb(96,165,250)_51.5%,rgba(96,165,250,0.05)_100%)]",
        "blue-vertical":
          "after:bg-[linear-gradient(180deg,rgba(96,165,250,0.05)_0%,#60A5FA_51.5%,rgba(96,165,250,0.05)_100%)]",
        "brown-horizontal":
          "after:bg-[linear-gradient(270deg,rgba(251,146,60,0.05)_0%,rgba(251,146,60,0.70)_51.5%,rgba(251,146,60,0.05)_100%)]",
        "purple-horizontal":
          "after:bg-[linear-gradient(270deg,rgba(232,121,249,0.05)_0%,rgba(232,121,249,0.70)_51.5%,rgba(232,121,249,0.05)_100%)]",
        "yellow-horizontal":
          "after:bg-[linear-gradient(270deg,rgba(250,204,21,0.05)_0%,rgba(250,204,21,0.70)_51.5%,rgba(250,204,21,0.05)_100%)]",
        "green-horizontal":
          "after:bg-[linear-gradient(270deg,rgba(34,197,94,0.05)_0%,rgba(34,197,94,0.70)_51.5%,rgba(34,197,94,0.05)_100%)]",
        gray: "after:bg-st-stroke-solid-base-outer",
        "activity-colors-travel":
          "after:bg-[linear-gradient(270deg,rgba(34,211,238,0.05)_0%,rgba(34,211,238,0.7)_51.5%,rgba(34,211,238,0.05)_100%)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export default function OrbiterBox({
  className,
  borderRadius,
  borderWidth,
  borderRadiusTopLeft = 0,
  borderRadiusTopRight = 0,
  borderRadiusBottomLeft = 0,
  borderRadiusBottomRight = 0,
  variant = "default",
  children,
}: OrbiterBoxProps & VariantProps<typeof orbiterBoxVariants>) {
  const containerStyles = {
    borderRadius: borderRadius
      ? `${borderRadius}px`
      : `${borderRadiusTopLeft}px ${borderRadiusTopRight}px ${borderRadiusBottomRight}px ${borderRadiusBottomLeft}px`,
    "--pseudo-border-width": borderWidth ? `${borderWidth}px` : "1px",
  } as React.CSSProperties;

  const backgroundStyles: React.CSSProperties = {
    borderRadius: borderRadius
      ? `${borderRadius}px`
      : `${borderRadiusTopLeft}px ${borderRadiusTopRight}px ${borderRadiusBottomRight}px ${borderRadiusBottomLeft}px`,
  };

  return (
    <div
      className={orbiterBoxVariants({ variant, className })}
      style={containerStyles}
    >
      {/* Background */}
      <div className={cn("bg-transparent", className)} style={backgroundStyles}>
        {children}
      </div>
    </div>
  );
}
