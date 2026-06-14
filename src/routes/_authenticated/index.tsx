import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Calendar,
  Pencil,
  Trash2,
  Eye,
  Compass,
  Search,
  Copy,
  Share2,
  Sparkles,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTrips, tripsApi, type Trip } from "@/lib/trips-store";
import { TripDialog } from "@/components/TripDialog";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/")({
  component: Index,
});

function formatRange(t: Trip) {
  if (!t.startDate) return null;
  const fmt = (s: string) => s.replaceAll("-", "/");
  return `${fmt(t.startDate)}${t.endDate ? ` — ${fmt(t.endDate)}` : ""}`;
}

function dayCount(t: Trip) {
  if (t.startDate && t.endDate) {
    const d = Math.round(
      (new Date(t.endDate).getTime() - new Date(t.startDate).getTime()) / 86400000,
    ) + 1;
    return Math.max(d, t.days.length);
  }
  return t.days.length;
}

function Index() {
  const { t } = useTranslation();
  const trips = useTrips();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTrip, setEditTrip] = useState<Trip | null>(null);
  const [deleteTrip, setDeleteTrip] = useState<Trip | null>(null);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return trips.filter((t) => {
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        const hay = [
          t.title,
          t.description ?? "",
          ...t.days.flatMap((d) => d.attractions.map((a) => a.name)),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [trips, q]);

  const handleShare = (trip: Trip) => {
    const url = `${window.location.origin}/s/${trip.id}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success(t("trips.linkCopied")),
      () => toast.error(t("trips.copyFailed")),
    );
  };

  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-8 sm:px-8 sm:pt-12">
      {/* Hero banner — gradient card with CTA, inspired by the reference */}
      <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-banner p-6 text-white shadow-lift sm:p-8">
        <div className="relative z-10 max-w-md">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Compass className="h-3.5 w-3.5" />
            {t("trips.heroTagline")}
          </div>
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {t("trips.heroTitle")}
          </h1>
          <p className="mt-2 text-sm text-white/85 sm:text-base">
            {t("trips.heroSub")}
          </p>
          <Button
            size="lg"
            onClick={() => setCreateOpen(true)}
            className="mt-5 h-11 rounded-full bg-white px-5 font-semibold text-primary shadow-soft hover:bg-white/95"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {t("trips.create")}
          </Button>
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </section>

      {/* Search + filter pills */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("trips.searchPlaceholder")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-12 rounded-full border-border bg-card pl-10 shadow-soft focus-visible:ring-primary/30"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                filter === f.value
                  ? "bg-gradient-cta text-white shadow-soft"
                  : "bg-card text-muted-foreground shadow-soft hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>


      {filtered.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border-2 border-dashed border-primary/20 bg-gradient-sky/40 px-6 py-24 text-center">
          <Sparkles className="mb-3 h-10 w-10 text-primary/60" />
          <p className="text-lg font-medium text-primary">
            {trips.length === 0 ? t("trips.emptyNoTrips") : t("trips.emptyNoMatches")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {trips.length === 0 ? t("trips.emptyHintNew") : t("trips.emptyHintSearch")}
          </p>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {filtered.map((trip) => {
            const range = formatRange(trip);
            const spotCount = trip.days.reduce((s, d) => s + d.attractions.length, 0);
            return (
              <li key={trip.id}>
                <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-primary/10 bg-card/90 shadow-soft backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift">
                  <Link
                    to="/trips/$tripId"
                    params={{ tripId: trip.id }}
                    className="flex items-start gap-4 p-5 pb-3"
                  >
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-hero text-3xl shadow-glow">
                      {trip.coverEmoji ?? "✈️"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <VisibilityBadge visibility={trip.visibility} />
                      </div>
                      <h2 className="truncate font-display text-2xl font-semibold text-foreground">
                        📍 {trip.title}
                      </h2>
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        {range ? (
                          <>
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{range}</span>
                          </>
                        ) : (
                          <span className="italic">{t("trips.planning")}</span>
                        )}
                      </div>
                      {(range || spotCount > 0) && (
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                          {range && <span>{dayCount(trip)} {t("trips.daysSuffix")}</span>}
                          {range && spotCount > 0 && <span>·</span>}
                          {spotCount > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {spotCount} {t("trips.spotsSuffix")}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex items-center gap-0.5 border-t border-primary/5 bg-muted/30 px-2 py-1.5">
                    <Link to="/trips/$tripId" params={{ tripId: trip.id }} className="flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-primary hover:bg-primary/10 hover:text-primary"
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        {t("common.view")}
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setEditTrip(trip)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        tripsApi.duplicate(trip.id);
                        toast.success(t("trips.duplicated"));
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    {trip.visibility === "public" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => handleShare(trip)}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTrip(trip)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </article>
              </li>
            );
          })}
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

      <AlertDialog open={!!deleteTrip} onOpenChange={(v) => !v && setDeleteTrip(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("trips.deleteTitle", { title: deleteTrip?.title ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("trips.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTrip && tripsApi.remove(deleteTrip.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
