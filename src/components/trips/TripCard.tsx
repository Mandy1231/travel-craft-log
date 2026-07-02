import { Link } from "@tanstack/react-router";
import { Calendar, Copy, Eye, MapPin, Pencil, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { tripsApi, type Trip } from "@/lib/trips-store";
import { formatTripRange, tripDayCount } from "@/services/trips-share";

interface Props {
  trip: Trip;
  onShare: (trip: Trip) => void;
  onEdit: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
  t: (k: string) => string;
}

export function TripCard({ trip, onShare, onEdit, onDelete, t }: Props) {
  const range = formatTripRange(trip);
  const spotCount = trip.days.reduce((s, d) => s + d.attractions.length, 0);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift">
      <Link
        to="/trips/$tripId"
        params={{ tripId: trip.id }}
        className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-start gap-3 p-3 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:gap-4 sm:p-4"
      >
        <div className="grid aspect-square h-[72px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-50 text-3xl ring-1 ring-slate-200/70 sm:h-[88px] sm:w-[88px] sm:text-4xl">
          {trip.coverEmoji ?? "✈️"}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="truncate text-base font-bold text-slate-900 sm:text-lg">
            {trip.title}
          </h3>
          <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            {range ? <span>{range}</span> : <span className="italic">{t("trips.planning")}</span>}
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-500">
            {range && <span>{tripDayCount(trip)} {t("trips.daysSuffix")}</span>}
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
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80"
        >
          <Eye className="h-4 w-4" />
          {t("common.view")}
        </Link>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={() => onShare(trip)}
            aria-label="Share"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={() => onEdit(trip)}
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:bg-red-50 hover:text-destructive"
            onClick={() => onDelete(trip)}
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
