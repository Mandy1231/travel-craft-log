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
import heroSuitcase from "@/assets/hero-suitcase.png";
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
      {/* Hero banner — soft blue with 3D suitcase illustration */}
      <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#EEF3FB] via-[#E4EDFA] to-[#DCE7F7] p-6 shadow-soft sm:p-10">
        {/* Mountain silhouettes */}
        <svg
          aria-hidden
          viewBox="0 0 800 300"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-full w-full opacity-60"
          preserveAspectRatio="xMidYMax slice"
        >
          <path d="M0,260 L120,180 L220,230 L340,140 L460,220 L600,160 L720,210 L800,180 L800,300 L0,300 Z" fill="#C8D7EC" />
          <path d="M0,280 L100,220 L240,260 L380,200 L520,250 L660,210 L800,240 L800,300 L0,300 Z" fill="#B8CBE6" opacity="0.7" />
        </svg>

        <div className="relative z-10 grid items-center gap-6 sm:grid-cols-[1.2fr_1fr]">
          <div className="max-w-md">
            <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              {t("trips.heroTitle")}
            </h1>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              {t("trips.heroSub")}
            </p>
            <Button
              size="lg"
              onClick={() => setCreateOpen(true)}
              className="mt-6 h-12 rounded-full bg-[#2563EB] px-6 font-semibold text-white shadow-lift hover:bg-[#1D4ED8]"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              {t("trips.create")}
            </Button>
          </div>
          <div className="relative hidden sm:block">
            <img
              src={heroSuitcase}
              alt=""
              width={512}
              height={512}
              className="mx-auto h-56 w-auto object-contain drop-shadow-2xl sm:h-72"
            />
          </div>
        </div>
      </section>

      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("trips.searchPlaceholder")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-12 rounded-full border-border bg-card pl-10 shadow-soft focus-visible:ring-primary/30"
          />
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-slate-900">{t("trips.myPlans")}</h2>

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
                <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift">
                  <Link
                    to="/trips/$tripId"
                    params={{ tripId: trip.id }}
                    className="grid grid-cols-[88px_minmax(0,1fr)_auto] items-start gap-4 p-4"
                  >
                    <div className="grid h-22 w-22 aspect-square shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-[#DCE7F7] to-[#B8CBE6] text-4xl">
                      {trip.coverEmoji ?? "✈️"}
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <h3 className="truncate text-lg font-bold text-slate-900">
                        {trip.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                        {range ? (
                          <>
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{range}</span>
                          </>
                        ) : (
                          <>
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="italic">{t("trips.planning")}</span>
                          </>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-500">
                        {range && <span>{dayCount(trip)} {t("trips.daysSuffix")}</span>}
                        {range && spotCount > 0 && <span>·</span>}
                        {spotCount > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {spotCount} {t("trips.spotsSuffix")}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        tripsApi.duplicate(trip.id);
                        toast.success(t("trips.duplicated"));
                      }}
                      className="-mt-1 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label="More"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </Link>

                  <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2">
                    <Link
                      to="/trips/$tripId"
                      params={{ tripId: trip.id }}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                    >
                      <Eye className="h-4 w-4" />
                      {t("common.view")}
                    </Link>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        onClick={() => handleShare(trip)}
                        aria-label="Share"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        onClick={() => setEditTrip(trip)}
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:bg-red-50 hover:text-destructive"
                        onClick={() => setDeleteTrip(trip)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
