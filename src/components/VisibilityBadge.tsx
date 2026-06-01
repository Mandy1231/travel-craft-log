import { Globe, Lock, FileEdit } from "lucide-react";
import type { Visibility } from "@/lib/trips-store";

const MAP: Record<Visibility, { label: string; Icon: typeof Globe; className: string }> = {
  public: {
    label: "公开",
    Icon: Globe,
    className: "bg-mint/15 text-[oklch(0.4_0.14_165)] ring-1 ring-mint/30",
  },
  private: {
    label: "私人",
    Icon: Lock,
    className: "bg-primary/10 text-primary ring-1 ring-primary/20",
  },
  draft: {
    label: "草稿",
    Icon: FileEdit,
    className: "bg-sunset/15 text-[oklch(0.45_0.16_55)] ring-1 ring-sunset/30",
  },
};

export function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  const { label, Icon, className } = MAP[visibility];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
