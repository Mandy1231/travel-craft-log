import { Globe, Lock, FileEdit } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Visibility } from "@/lib/trips-store";

const MAP: Record<Visibility, { key: string; Icon: typeof Globe; className: string }> = {
  public: {
    key: "trips.public",
    Icon: Globe,
    className: "bg-mint/15 text-[oklch(0.4_0.14_165)] ring-1 ring-mint/30",
  },
  private: {
    key: "trips.private",
    Icon: Lock,
    className: "bg-primary/10 text-primary ring-1 ring-primary/20",
  },
  draft: {
    key: "trips.draft",
    Icon: FileEdit,
    className: "bg-sunset/15 text-[oklch(0.45_0.16_55)] ring-1 ring-sunset/30",
  },
};

export function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  const { t } = useTranslation();
  const { key, Icon, className } = MAP[visibility];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}
    >
      <Icon className="h-3 w-3" />
      {t(key)}
    </span>
  );
}
