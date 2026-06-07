import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Day } from "@/lib/trips-store";
import { MapPin, Route as RouteIcon, Loader2, Footprints, Car, Bike, Bus } from "lucide-react";

interface Props {
  days: Day[];
  selectedDayId?: string | null;
  onClearSelection?: () => void;
}

type TransitMode = "foot" | "driving" | "cycling";

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

interface OsrmRoute {
  coords: [number, number][];
  km: number;
  drivingMinutes: number;
}

// Public OSRM demo only reliably serves the "driving" profile.
// We fetch the geometry once and derive per-mode times from the distance.
async function fetchOsrmRoute(
  pts: [number, number][],
  signal: AbortSignal,
): Promise<OsrmRoute | null> {
  if (pts.length < 2) return null;
  const coordStr = pts.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const data = await res.json();
  const route = data?.routes?.[0];
  if (!route) return null;
  const coords: [number, number][] = route.geometry.coordinates.map(
    ([lng, lat]: [number, number]) => [lat, lng],
  );
  return {
    coords,
    km: route.distance / 1000,
    drivingMinutes: Math.round(route.duration / 60),
  };
}

// Average speeds (km/h) for non-driving modes.
const SPEED_KMH: Record<TransitMode, number> = {
  foot: 5,
  cycling: 15,
  driving: 40, // fallback if OSRM duration missing
};

function minutesForMode(km: number, mode: TransitMode, drivingMinutes?: number) {
  if (mode === "driving" && typeof drivingMinutes === "number") return drivingMinutes;
  return Math.max(1, Math.round((km / SPEED_KMH[mode]) * 60));
}

function recommendModeForDistance(km: number): TransitMode {
  if (km <= 2) return "foot";
  if (km <= 8) return "cycling";
  return "driving";
}

export function MapPreview({ days, selectedDayId, onClearSelection }: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<TransitMode>("driving");
  const [osrmRoute, setOsrmRoute] = useState<OsrmRoute | null>(null);
  const [routeStatus, setRouteStatus] = useState<"idle" | "loading" | "error">("idle");

  const isFiltered = !!selectedDayId;
  const visibleDays = useMemo(
    () => (isFiltered ? days.filter((d) => d.id === selectedDayId) : days),
    [days, selectedDayId, isFiltered],
  );
  const selectedDay = isFiltered ? visibleDays[0] : null;

  const selectedPts = useMemo<[number, number][]>(() => {
    if (!selectedDay) return [];
    return selectedDay.attractions
      .filter((a) => typeof a.lat === "number" && typeof a.lng === "number")
      .map((a) => [a.lat!, a.lng!] as [number, number]);
  }, [selectedDay]);

  // init map
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
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

  // Fetch the geometry once per day selection (driving profile only).
  useEffect(() => {
    if (!isFiltered || selectedPts.length < 2) {
      setOsrmRoute(null);
      setRouteStatus("idle");
      return;
    }
    const ctrl = new AbortController();
    setRouteStatus("loading");
    fetchOsrmRoute(selectedPts, ctrl.signal)
      .then((r) => {
        if (ctrl.signal.aborted) return;
        setOsrmRoute(r);
        setRouteStatus(r ? "idle" : "error");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setOsrmRoute(null);
        setRouteStatus("error");
      });
    return () => ctrl.abort();
  }, [isFiltered, selectedPts]);

  // Straight-line distance fallback (used when OSRM hasn't returned yet or failed).
  const straightKm = useMemo(() => {
    let d = 0;
    for (let i = 1; i < selectedPts.length; i++) d += haversine(selectedPts[i - 1], selectedPts[i]);
    return d;
  }, [selectedPts]);

  const routeKm = osrmRoute?.km ?? straightKm;
  const recommendedMode = useMemo<TransitMode>(
    () => recommendModeForDistance(routeKm),
    [routeKm],
  );

  // Reset selection to the recommended mode whenever the day or distance changes.
  useEffect(() => {
    if (isFiltered) setMode(recommendedMode);
  }, [isFiltered, selectedDayId, recommendedMode]);

  // render markers + polylines
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    (async () => {
      const L = (await import("leaflet")).default;
      const layer = layerRef.current;
      layer.clearLayers();

      const bounds: [number, number][] = [];

      // Letter index continues across days when showing all; per-day when filtered.
      let baseIdx = 0;
      if (isFiltered && selectedDay) {
        const before = days.findIndex((d) => d.id === selectedDay.id);
        baseIdx = days.slice(0, before).reduce((s, d) => s + d.attractions.length, 0);
      }

      let globalIdx = baseIdx;
      visibleDays.forEach((day) => {
        const di = days.indexOf(day);
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
          if (isFiltered && osrmRoute && osrmRoute.coords.length > 1) {
            L.polyline(osrmRoute.coords, {
              color,
              weight: 5,
              opacity: 0.85,
            }).addTo(layer);
          } else {
            L.polyline(pts, {
              color,
              weight: 3,
              opacity: 0.7,
              dashArray: "6 6",
            }).addTo(layer);
          }
        }
      });

      if (bounds.length > 0) {
        mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    })();
  }, [ready, days, visibleDays, isFiltered, selectedDay, osrmRoute]);

  // metrics for the badge
  const allPoints = visibleDays.flatMap((d) =>
    d.attractions.filter((a) => typeof a.lat === "number" && typeof a.lng === "number"),
  );

  let distance = 0;
  let minutes = 0;
  if (isFiltered) {
    distance = routeKm;
    minutes = minutesForMode(routeKm, mode, osrmRoute?.drivingMinutes);
  } else {
    visibleDays.forEach((d) => {
      const pts = d.attractions
        .filter((a) => typeof a.lat === "number" && typeof a.lng === "number")
        .map((a) => [a.lat!, a.lng!] as [number, number]);
      for (let i = 1; i < pts.length; i++) distance += haversine(pts[i - 1], pts[i]);
    });
    minutes = Math.round(distance * 2.5 + allPoints.length * 30);
  }

  const dayIdx = selectedDay ? days.indexOf(selectedDay) : -1;
  const dayLabel = selectedDay
    ? selectedDay.title || t("trips.dayN", { n: dayIdx + 1 })
    : "";

  return (
    <div className="relative h-full min-h-[460px] w-full overflow-hidden rounded-3xl border-2 border-primary/10 bg-gradient-sky shadow-lift">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Filter indicator + clear */}
      {isFiltered && selectedDay && (
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-full bg-card/95 px-3 py-1.5 text-xs font-medium shadow-soft backdrop-blur"
          >
            <span
              className="grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold text-white"
              style={{ background: `var(${DAY_COLOR_VARS[dayIdx % DAY_COLOR_VARS.length]})` }}
            >
              {dayIdx + 1}
            </span>
            <span className="text-foreground">{t("trips.viewingDay", { name: dayLabel })}</span>
            {onClearSelection && (
              <button
                onClick={onClearSelection}
                className="ml-1 rounded-full px-2 py-0.5 text-[11px] text-primary hover:bg-primary/10"
              >
                {t("trips.viewAllDays")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Transit mode selector */}
      {isFiltered && selectedPts.length > 1 && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-card/95 p-1 shadow-soft backdrop-blur">
          {([
            { id: "foot" as const, Icon: Footprints, label: t("trips.transitWalking") },
            { id: "driving" as const, Icon: Car, label: t("trips.transitDriving") },
            { id: "cycling" as const, Icon: Bike, label: t("trips.transitCycling") },
          ]).map(({ id, Icon, label }) => {
            const isRecommended = id === recommendedMode;
            const isActive = mode === id;
            return (
              <button
                key={id}
                onClick={() => setMode(id)}
                title={isRecommended ? `${label} · ${t("trips.recommendedBadge")}` : label}
                className={`relative grid h-7 w-7 place-items-center rounded-full transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {isRecommended && (
                  <span
                    aria-hidden
                    className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-card"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

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
        <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 flex items-center gap-2 rounded-2xl bg-card/95 px-4 py-2.5 shadow-soft backdrop-blur">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-hero text-primary-foreground">
            {routeStatus === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RouteIcon className="h-4 w-4" />
            )}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold text-foreground">
              {routeStatus === "loading"
                ? t("trips.routeLoading")
                : t("trips.routeSummary", {
                    km: distance.toFixed(1),
                    min: minutes,
                  })}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {isFiltered
                ? mode === recommendedMode
                  ? t(`trips.recommendedMode_${recommendedMode}` as const)
                  : `${t(`trips.transit${mode === "foot" ? "Walking" : mode === "driving" ? "Driving" : "Cycling"}` as const)} · ${t(`trips.recommendedMode_${recommendedMode}` as const)}`
                : routeStatus === "error"
                  ? t("trips.routeFailed")
                  : `${allPoints.length} ${t("trips.spotsSuffix")} · ${visibleDays.filter((d) => d.attractions.length).length} ${t("trips.daysSuffix")}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
