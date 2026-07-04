import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MapPreview } from "@/components/MapPreview";
import { AddAttractionDialog } from "@/components/AddAttractionDialog";
import { TripDialog } from "@/components/TripDialog";
import { useTripQuery, tripsApi, type Attraction } from "@/lib/trips-store";
import { DayCard } from "@/components/trip-detail/DayCard";
import { TripDetailHeader } from "@/components/trip-detail/TripDetailHeader";
import { TripDetailSkeleton } from "@/components/trip-detail/TripDetailSkeleton";
import { useDayEditor } from "@/hooks/useDayEditor";

export const Route = createFileRoute("/_authenticated/trips/$tripId")({
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
  component: TripDetail,
});

const DAY_VARS = ["--day-1", "--day-2", "--day-3", "--day-4", "--day-5", "--day-6", "--day-7"];

function TripDetail() {
  const { t } = useTranslation();
  const { tripId } = Route.useParams();
  const { data: trip, isLoading, isFetching } = useTripQuery(tripId);

  const [editTripOpen, setEditTripOpen] = useState(false);
  const [addCtx, setAddCtx] = useState<{ dayId: string; attraction?: Attraction } | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  const totalSpots = useMemo(
    () => trip?.days.reduce((s, d) => s + d.attractions.length, 0) ?? 0,
    [trip],
  );

  const editor = useDayEditor(trip ?? ({ id: "", days: [] } as never));

  if (!trip) {
    if (isLoading || isFetching) {
      return <TripDetailSkeleton />;
    }
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

  const dayDate = (idx: number) => {
    if (!trip.startDate) return null;
    const d = new Date(trip.startDate);
    d.setDate(d.getDate() + idx);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <main className="mx-auto max-w-7xl px-5 pb-24 pt-8 sm:px-8">
      <TripDetailHeader
        trip={trip}
        totalSpots={totalSpots}
        onEdit={() => setEditTripOpen(true)}
      />

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <section className="lg:sticky lg:top-6 lg:self-start">
          <MapPreview
            days={trip.days}
            selectedDayId={selectedDayId}
            onClearSelection={() => setSelectedDayId(null)}
          />
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-soft sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
              {t("trips.schedule")}
            </h2>
            <Button size="sm" onClick={() => tripsApi.addDay(trip.id)} className="shadow-soft">
              <Plus className="mr-1 h-4 w-4" />
              {t("trips.addDay")}
            </Button>
          </div>

          <ol className="space-y-4">
            {trip.days.map((day, idx) => (
              <DayCard
                key={day.id}
                trip={trip}
                day={day}
                dayIndex={idx}
                colorVar={DAY_VARS[idx % DAY_VARS.length]}
                date={dayDate(idx)}
                selectedDayId={selectedDayId}
                editingDayId={editor.editingDayId}
                editingDayTitle={editor.editingDayTitle}
                onToggleMap={(id) => setSelectedDayId((cur) => (cur === id ? null : id))}
                onStartEdit={editor.startEditDay}
                onCommitEdit={editor.commitEditDay}
                onCancelEdit={editor.cancelEditDay}
                onTitleChange={editor.setEditingDayTitle}
                onOptimize={editor.handleOptimize}
                onAddCtx={setAddCtx}
              />
            ))}
          </ol>
        </section>
      </div>

      <TripDialog
        open={editTripOpen}
        onOpenChange={setEditTripOpen}
        initial={trip}
        onSave={(data) => tripsApi.update(trip.id, data)}
      />

      <AddAttractionDialog
        open={!!addCtx}
        onOpenChange={(v) => !v && setAddCtx(null)}
        initial={addCtx?.attraction}
        onSave={(data) => {
          if (!addCtx) return;
          if (addCtx.attraction) {
            tripsApi.updateAttraction(trip.id, addCtx.dayId, addCtx.attraction.id, data);
          } else {
            tripsApi.addAttraction(trip.id, addCtx.dayId, data);
          }
        }}
      />
    </main>
  );
}
