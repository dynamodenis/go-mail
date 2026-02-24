import "@/features/tiptap-editor/components/ui/orbiter-box.scss";

interface OrbiterBoxProps {
  children: React.ReactNode;
  padding?: number;
  borderGradient?: string;
  filter?: string;
}

export default function OrbiterBox({
  children,
  padding = 0,
  borderGradient = "linear-gradient(180deg, rgba(96, 165, 250, 0.2) 0%, #fafafa 50%, rgba(96, 165, 250, 0.2) 100%)",
  filter,
}: OrbiterBoxProps) {
  return (
    <div className="tiptap-orbiter-box">
      <div
        className="tiptap-orbiter-box-content"
        style={{
          padding,
          ...(borderGradient
            ? { ["--border-gradient" as any]: borderGradient }
            : {}),
          ...(filter ? { ["--filter" as any]: filter } : {}),
        }}
      >
        {children}
      </div>
    </div>
  );
}
