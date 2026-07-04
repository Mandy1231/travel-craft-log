import { useTranslation } from "react-i18next";
import { ArrowLeft, Calendar, Copy, Pencil, Share2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { tripsApi, type Trip } from "@/lib/trips-store";
import { toast } from "sonner";

export function TripDetailHeader({
  trip,
  totalSpots,
  onEdit,
}: {
  trip: Trip;
  totalSpots: number;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleShare = async () => {
    const url = `${window.location.origin}/s/${trip.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("trips.linkCopied"));
    } catch {
      toast.error(t("trips.copyFailed"));
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate({ to: "/" })}
          className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          {t("trips.allTrips")}
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="default" size="sm" onClick={handleShare}>
            <Share2 className="mr-1.5 h-4 w-4" />
            {t("common.share")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              tripsApi.duplicate(trip.id);
              toast.success(t("trips.duplicateToast"));
            }}
          >
            <Copy className="mr-1.5 h-4 w-4" />
            {t("common.copy")}
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-1.5 h-4 w-4" />
            {t("common.edit")}
          </Button>
        </div>
      </div>

      <header className="mb-10 flex items-start gap-5">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl border border-slate-200 bg-white text-5xl shadow-soft">
          {trip.coverEmoji}
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            {trip.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
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
    </>
  );
}
