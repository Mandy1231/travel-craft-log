import type { Attraction } from "@/lib/trips-store";
import { MapPin, Route as RouteIcon } from "lucide-react";

interface Props {
  attractions: Attraction[];
}

export function MapPreview({ attractions }: Props) {
  const labeled = attractions.map((a, i) => ({
    ...a,
    letter: String.fromCharCode(65 + i),
  }));

  // Generate pseudo-random but stable positions based on attraction id
  const positions = labeled.map((a, i) => {
    const seed = Array.from(a.id).reduce((s, c) => s + c.charCodeAt(0), 0);
    const x = 12 + ((seed * 13) % 76);
    const y = 14 + ((seed * 29 + i * 60) % 70);
    return { x, y };
  });

  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-2xl border bg-gradient-to-br from-[oklch(0.92_0.04_210)] to-[oklch(0.88_0.06_180)] shadow-soft">
      {/* topographic lines */}
      <svg className="absolute inset-0 h-full w-full opacity-40" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="oklch(0.5 0.08 200 / 0.18)" strokeWidth="0.2" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />
        <path d="M -5 30 Q 30 10 70 35 T 110 50" fill="none" stroke="oklch(0.55 0.1 180 / 0.4)" strokeWidth="0.6" />
        <path d="M -5 60 Q 25 50 60 65 T 110 75" fill="none" stroke="oklch(0.55 0.1 180 / 0.4)" strokeWidth="0.6" />
        <path d="M -5 80 Q 40 70 75 85 T 110 90" fill="none" stroke="oklch(0.55 0.1 180 / 0.4)" strokeWidth="0.6" />
      </svg>

      {/* route */}
      {positions.length > 1 && (
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <polyline
            points={positions.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="oklch(0.45 0.13 215)"
            strokeWidth="0.5"
            strokeDasharray="1.2 1"
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* markers */}
      {labeled.map((a, i) => (
        <div
          key={a.id}
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: `${positions[i].x}%`, top: `${positions[i].y}%` }}
        >
          <div className="flex flex-col items-center">
            <div className="rounded-md bg-card px-2 py-0.5 text-xs font-medium text-foreground shadow-soft mb-1 whitespace-nowrap">
              {a.name}
            </div>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-hero text-xs font-bold text-primary-foreground shadow-lift ring-2 ring-background">
              {a.letter}
            </div>
          </div>
        </div>
      ))}

      {/* empty state */}
      {labeled.length === 0 && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <MapPin className="h-8 w-8" />
            <p className="text-sm">添加景点后,这里会显示路线</p>
          </div>
        </div>
      )}

      {/* overlay info */}
      {labeled.length > 1 && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-xl bg-card/90 px-3 py-2 backdrop-blur-sm shadow-soft">
          <RouteIcon className="h-4 w-4 text-ocean" />
          <span className="text-xs font-medium text-foreground">
            路线优化建议 · 预计 {Math.max(1, Math.round(labeled.length * 1.2))} 小时
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            {labeled.map((a) => a.letter).join(" → ")}
          </span>
        </div>
      )}
    </div>
  );
}
