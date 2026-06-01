import { useEffect, useRef, useState } from "react";
import type { Day } from "@/lib/trips-store";
import { MapPin, Route as RouteIcon } from "lucide-react";

interface Props {
  days: Day[];
}

const DAY_COLOR_VARS = [
  "--day-1",
  "--day-2",
  "--day-3",
  "--day-4",
  "--day-5",
  "--day-6",
  "--day-7",
];

function colorForDay(i: number) {
  return `oklch(from var(${DAY_COLOR_VARS[i % DAY_COLOR_VARS.length]}) l c h)`;
}

function haversine(a: [number, number], b: [number, number]) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function MapPreview({ days }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  // initialize map (client-only)
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current) return;

      if (!mapRef.current) {
        const map = L.map(containerRef.current, {
          center: [33.4, 126.55],
          zoom: 9,
          zoomControl: true,
          scrollWheelZoom: false,
        });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 19,
        }).addTo(map);
        mapRef.current = map;
        layerRef.current = L.layerGroup().addTo(map);
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
      }
    };
  }, []);

  // re-render markers
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    (async () => {
      const L = (await import("leaflet")).default;
      const layer = layerRef.current;
      layer.clearLayers();

      const bounds: [number, number][] = [];
      let globalIdx = 0;

      days.forEach((day, di) => {
        const color = colorForDay(di);
        const pts: [number, number][] = [];
        day.attractions.forEach((a) => {
          if (typeof a.lat !== "number" || typeof a.lng !== "number") {
            globalIdx++;
            return;
          }
          const letter = String.fromCharCode(65 + globalIdx);
          globalIdx++;
          const html = `<div class="day-marker" style="background:${color}">${letter}</div>`;
          const icon = L.divIcon({
            html,
            className: "",
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });
          const marker = L.marker([a.lat, a.lng], { icon }).bindPopup(
            `<strong>${a.name}</strong>${a.openingHours ? `<br/><small>${a.openingHours}</small>` : ""}`,
          );
          marker.addTo(layer);
          pts.push([a.lat, a.lng]);
          bounds.push([a.lat, a.lng]);
        });
        if (pts.length > 1) {
          L.polyline(pts, {
            color,
            weight: 3,
            opacity: 0.7,
            dashArray: "6 6",
          }).addTo(layer);
        }
      });

      if (bounds.length > 0) {
        mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
    })();
  }, [ready, days]);

  const allPoints = days.flatMap((d) =>
    d.attractions.filter((a) => typeof a.lat === "number" && typeof a.lng === "number"),
  );
  let distance = 0;
  days.forEach((d) => {
    const pts = d.attractions
      .filter((a) => typeof a.lat === "number" && typeof a.lng === "number")
      .map((a) => [a.lat!, a.lng!] as [number, number]);
    for (let i = 1; i < pts.length; i++) distance += haversine(pts[i - 1], pts[i]);
  });
  const minutes = Math.round(distance * 2.5 + allPoints.length * 30);

  return (
    <div className="relative h-full min-h-[460px] w-full overflow-hidden rounded-3xl border-2 border-primary/10 bg-gradient-sky shadow-lift">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {allPoints.length === 0 && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-gradient-sky">
          <div className="flex flex-col items-center gap-3 text-primary/70">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-card/80 backdrop-blur shadow-soft">
              <MapPin className="h-7 w-7" />
            </div>
            <p className="text-sm font-medium">
              添加带位置的景点,这里会显示地图路线
            </p>
          </div>
        </div>
      )}

      {allPoints.length > 1 && (
        <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 flex items-center gap-2 rounded-2xl bg-card/90 px-4 py-2.5 shadow-soft backdrop-blur">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-hero text-primary-foreground">
            <RouteIcon className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold text-foreground">
              约 {distance.toFixed(1)} km · {Math.floor(minutes / 60)} 小时 {minutes % 60} 分
            </span>
            <span className="text-[10px] text-muted-foreground">
              {allPoints.length} 个景点 · {days.filter((d) => d.attractions.length).length} 天行程
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
