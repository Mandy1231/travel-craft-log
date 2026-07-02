import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTrips, tripsApi, type Trip } from "@/lib/trips-store";
import { TripDialog } from "@/components/TripDialog";
import { TripHero, TripSearchBar, TripListEmpty } from "@/components/trips/TripHero";
import { TripCard } from "@/components/trips/TripCard";
import { DeleteTripDialog } from "@/components/trips/DeleteTripDialog";
import { useTripSearch } from "@/hooks/useTripSearch";
import { copyTripShareLink } from "@/services/trips-share";

export const Route = createFileRoute("/_authenticated/")({
  component: Index,
});

function Index() {
  const { t } = useTranslation();
  const trips = useTrips();
  const { q, setQ, filtered } = useTripSearch(trips);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTrip, setEditTrip] = useState<Trip | null>(null);
  const [deleteTrip, setDeleteTrip] = useState<Trip | null>(null);

  const handleShare = (trip: Trip) =>
    copyTripShareLink(trip, {
      success: t("trips.linkCopied"),
      error: t("trips.copyFailed"),
    });

  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-8 sm:px-8 sm:pt-12">
      <TripHero
        title={t("trips.heroTitle")}
        subtitle={t("trips.heroSub")}
        ctaLabel={t("trips.create")}
        onCreate={() => setCreateOpen(true)}
      />

      <TripSearchBar value={q} onChange={setQ} placeholder={t("trips.searchPlaceholder")} />

      <h2 className="mb-4 text-lg font-semibold text-slate-900">{t("trips.myPlans")}</h2>

      {filtered.length === 0 ? (
        <TripListEmpty hasNoTrips={trips.length === 0} t={t} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 md:gap-5">
          {filtered.map((trip) => (
            <li key={trip.id}>
              <TripCard
                trip={trip}
                onShare={handleShare}
                onEdit={setEditTrip}
                onDelete={setDeleteTrip}
                t={t}
              />
            </li>
          ))}
        </ul>
      )}

      <TripDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={(data) => tripsApi.create(data)}
      />
      <TripDialog
        open={!!editTrip}
        onOpenChange={(v) => !v && setEditTrip(null)}
        initial={editTrip ?? undefined}
        onSave={(data) => {
          if (editTrip) tripsApi.update(editTrip.id, data);
        }}
      />
      <DeleteTripDialog
        trip={deleteTrip}
        onClose={() => setDeleteTrip(null)}
        onConfirm={(trip) => tripsApi.remove(trip.id)}
        t={t}
      />
    </main>
  );
}
