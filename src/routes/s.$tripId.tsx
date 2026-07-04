import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, Clock, MapPin, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MapPreview } from "@/components/MapPreview";
import { Button } from "@/components/ui/button";
import type { Trip, Day, Attraction } from "@/lib/trips-store";

export const Route = createFileRoute("/s/$tripId")({
  ssr: false,
  head: () => ({
    links: [
      {
        rel: "stylesheet",
        href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
        integrity: "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=",
        crossOrigin: "",
      },
    ],
  }),
  component: SharedTrip,
});

const DAY_VARS = ["--day-1", "--day-2", "--day-3", "--day-4", "--day-5", "--day-6", "--day-7"];

function mapAttraction(row: any): Attraction {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    openingHours: row.opening_hours ?? undefined,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
  };
}
function mapDay(row: any): Day {
  return {
    id: row.id,
    title: row.title ?? undefined,
    attractions: ((row.attractions ?? []) as any[])
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map(mapAttraction),
  };
}
function mapTrip(row: any): Trip {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    visibility: row.visibility,
    coverEmoji: row.cover_emoji ?? "✈️",
    days: ((row.days ?? []) as any[])
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map(mapDay),
    createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
  };
}

function SharedTrip() {
  const { t } = useTranslation();
  const { tripId } = Route.useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("trips")
      .select("*, days(*, attractions(*))")
      .eq("id", tripId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setTrip(data ? mapTrip(data) : null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl">{t("trips.notFound")}</h1>
        <p className="mt-2 text-muted-foreground">{t("trips.notFoundDesc")}</p>
        <Link to="/" className="mt-6 inline-block">
          <Button>{t("trips.goHome")}</Button>
        </Link>
      </div>
    );
  }

  const totalSpots = trip.days.reduce((s, d) => s + d.attractions.length, 0);
  const dayDate = (idx: number) => {
    if (!trip.startDate) return null;
    const d = new Date(trip.startDate);
    d.setDate(d.getDate() + idx);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <main className="mx-auto max-w-7xl px-5 pb-24 pt-8 sm:px-8">
      <Link
        to="/"
        className="group mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Wayfarer
      </Link>

      <header className="mb-8 flex items-start gap-5">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl border border-slate-200 bg-white text-5xl shadow-soft">
          {trip.coverEmoji}
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {trip.title}
          </h1>
          {trip.description && (
            <p className="mt-2 text-sm text-muted-foreground">{trip.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {trip.startDate ? (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {trip.startDate.replaceAll("-", "/")}
                {trip.endDate ? ` — ${trip.endDate.replaceAll("-", "/")}` : ""}
              </span>
            ) : (
              <span className="italic">{t("trips.noDates")}</span>
            )}
            <span>·</span>
            <span>
              {trip.days.length} {t("trips.daysSuffix")} · {totalSpots} {t("trips.spotsSuffix")}
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <section className="lg:sticky lg:top-6 lg:self-start">
          <MapPreview
            days={trip.days}
            selectedDayId={selectedDayId}
            onClearSelection={() => setSelectedDayId(null)}
          />
        </section>

        <section className="rounded-3xl border border-primary/10 bg-card/80 p-4 shadow-soft backdrop-blur sm:p-5">
          <h2 className="mb-4 font-display text-2xl">{t("trips.schedule")}</h2>
          <ol className="space-y-4">
            {trip.days.map((day, idx) => {
              const colorVar = DAY_VARS[idx % DAY_VARS.length];
              const isSelected = selectedDayId === day.id;
              const date = dayDate(idx);
              const letterOffset = trip.days
                .slice(0, idx)
                .reduce((s, d) => s + d.attractions.length, 0);
              return (
                <li
                  key={day.id}
                  className={`overflow-hidden rounded-2xl border bg-background/70 ${
                    isSelected ? "ring-2 ring-offset-2 ring-offset-background shadow-lift" : ""
                  }`}
                  style={{
                    borderLeft: `4px solid var(${colorVar})`,
                    ...(isSelected
                      ? ({ "--tw-ring-color": `var(${colorVar})` } as React.CSSProperties)
                      : {}),
                  }}
                >
                  <div className="flex items-center gap-2 bg-gradient-sky/50 px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedDayId((cur) => (cur === day.id ? null : day.id))
                      }
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white transition-transform hover:scale-110"
                      style={{ background: `var(${colorVar})` }}
                    >
                      {idx + 1}
                    </button>
                    <h3 className="truncate font-display text-base font-semibold">
                      {day.title || t("trips.dayN", { n: idx + 1 })}
                    </h3>
                    {date && (
                      <span className="text-xs text-muted-foreground">({date})</span>
                    )}
                  </div>
                  <ul className="space-y-2 p-3">
                    {day.attractions.length === 0 && (
                      <li className="text-center text-xs text-muted-foreground py-4">—</li>
                    )}
                    {day.attractions.map((a, i) => (
                      <li
                        key={a.id}
                        className="flex items-start gap-2 rounded-xl border bg-card px-3 py-2.5 shadow-soft"
                      >
                        <div
                          className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                          style={{ background: `var(${colorVar})` }}
                        >
                          {String.fromCharCode(65 + letterOffset + i)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-semibold text-foreground">
                              📍 {a.name}
                            </span>
                            {a.lat && a.lng && (
                              <MapPin className="h-3 w-3 shrink-0 text-mint" />
                            )}
                          </div>
                          {a.openingHours && (
                            <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {a.openingHours}
                            </div>
                          )}
                          {a.description && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {a.description}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </main>
  );
}
