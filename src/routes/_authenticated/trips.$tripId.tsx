import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Copy,
  GripVertical,
  Pencil,
  Plus,
  Share2,
  Trash2,
  Check,
  X,
  MapPin,
  Wand2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPreview } from "@/components/MapPreview";
import { AddAttractionDialog } from "@/components/AddAttractionDialog";
import { TripDialog } from "@/components/TripDialog";
import { VisibilityBadge } from "@/components/VisibilityBadge";
import { useTrip, tripsApi, type Attraction, type Day } from "@/lib/trips-store";
import { optimizeDayOrder } from "@/lib/route-optimize";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated/trips/$tripId")({
  component: TripDetail,
});

const DAY_VARS = ["--day-1", "--day-2", "--day-3", "--day-4", "--day-5", "--day-6", "--day-7"];

function TripDetail() {
  const { t } = useTranslation();
  const { tripId } = Route.useParams();
  const navigate = useNavigate();
  const trip = useTrip(tripId);

  const [editTripOpen, setEditTripOpen] = useState(false);
  const [addCtx, setAddCtx] = useState<{ dayId: string; attraction?: Attraction } | null>(null);
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editingDayTitle, setEditingDayTitle] = useState("");
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  const totalSpots = useMemo(
    () => trip?.days.reduce((s, d) => s + d.attractions.length, 0) ?? 0,
    [trip],
  );

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

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("trips.linkCopied"));
    } catch {
      toast.error(t("trips.copyFailed"));
    }
  };

  const dayDate = (idx: number) => {
    if (!trip.startDate) return null;
    const d = new Date(trip.startDate);
    d.setDate(d.getDate() + idx);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const startEditDay = (day: Day, idx: number) => {
    setEditingDayId(day.id);
    setEditingDayTitle(day.title ?? t("trips.dayN", { n: idx + 1 }));
  };
  const commitEditDay = () => {
    if (editingDayId) {
      tripsApi.updateDay(trip.id, editingDayId, { title: editingDayTitle.trim() || undefined });
    }
    setEditingDayId(null);
  };

  const handleOptimize = (day: Day) => {
    const result = optimizeDayOrder(day.attractions);
    if (!result) {
      toast.error(t("trips.optimizeNeedsPins"));
      return;
    }
    const sameOrder = result.orderedIds.every((id, i) => id === day.attractions[i]?.id);
    if (sameOrder || result.afterKm >= result.beforeKm - 0.01) {
      toast(t("trips.optimizeNoGain"));
      return;
    }
    tripsApi.reorderAttractions(trip.id, day.id, result.orderedIds);
    toast.success(
      t("trips.optimizeToast", {
        before: result.beforeKm.toFixed(1),
        after: result.afterKm.toFixed(1),
      }),
    );
  };

  return (
    <main className="mx-auto max-w-7xl px-5 pb-24 pt-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate({ to: "/" })}
          className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          {t("trips.allTrips")}
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-1.5 h-4 w-4" />
            {t("common.share")}
          </Button>
          <Button
            variant={trip.visibility === "public" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              const next = trip.visibility === "public" ? "private" : "public";
              tripsApi.update(trip.id, { visibility: next });
              toast.success(next === "public" ? t("trips.setPublicToast") : t("trips.setPrivateToast"));
            }}
          >
            👥 {trip.visibility === "public" ? t("trips.public") : t("trips.setPublic")}
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
          <Button variant="outline" size="sm" onClick={() => setEditTripOpen(true)}>
            <Pencil className="mr-1.5 h-4 w-4" />
            {t("common.edit")}
          </Button>
        </div>
      </div>

      <header className="mb-8 flex items-start gap-5">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-gradient-hero text-5xl shadow-lift">
          {trip.coverEmoji}
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <div className="mb-2">
            <VisibilityBadge visibility={trip.visibility} />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {trip.title}
          </h1>
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl">{t("trips.schedule")}</h2>
            <Button size="sm" onClick={() => tripsApi.addDay(trip.id)} className="shadow-soft">
              <Plus className="mr-1 h-4 w-4" />
              {t("trips.addDay")}
            </Button>
          </div>

          <ol className="space-y-4">
            {trip.days.map((day, idx) => {
              const colorVar = DAY_VARS[idx % DAY_VARS.length];
              const date = dayDate(idx);
              return (
                <li
                  key={day.id}
                  className={`overflow-hidden rounded-2xl border bg-background/70 transition-shadow ${
                    selectedDayId === day.id ? "ring-2 ring-offset-2 ring-offset-background shadow-lift" : ""
                  }`}
                  style={{
                    borderLeft: `4px solid var(${colorVar})`,
                    ...(selectedDayId === day.id
                      ? ({ "--tw-ring-color": `var(${colorVar})` } as React.CSSProperties)
                      : {}),
                  }}
                >
                  <div className="flex items-center justify-between gap-2 bg-gradient-sky/50 px-4 py-2.5">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDayId((cur) => (cur === day.id ? null : day.id))
                        }
                        title={
                          selectedDayId === day.id
                            ? t("trips.showingOnMap")
                            : t("trips.showOnMap")
                        }
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white transition-transform hover:scale-110 ${
                          selectedDayId === day.id ? "ring-2 ring-offset-1 ring-offset-background" : ""
                        }`}
                        style={{
                          background: `var(${colorVar})`,
                          ...(selectedDayId === day.id
                            ? ({ "--tw-ring-color": `var(${colorVar})` } as React.CSSProperties)
                            : {}),
                        }}
                      >
                        {idx + 1}
                      </button>
                      {editingDayId === day.id ? (
                        <div className="flex flex-1 items-center gap-1">
                          <Input
                            value={editingDayTitle}
                            onChange={(e) => setEditingDayTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEditDay();
                              if (e.key === "Escape") setEditingDayId(null);
                            }}
                            autoFocus
                            className="h-8"
                          />
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={commitEditDay}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => setEditingDayId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditDay(day, idx)}
                          className="group flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <h3 className="truncate font-display text-base font-semibold">
                            {day.title || t("trips.dayN", { n: idx + 1 })}
                          </h3>
                          {date && (
                            <span className="shrink-0 text-xs text-muted-foreground">
                              ({date})
                            </span>
                          )}
                          <Pencil className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
                        </button>
                      )}
                    </div>
                    {editingDayId !== day.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7">
                            ⋮
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOptimize(day)}>
                            <Wand2 className="mr-2 h-3.5 w-3.5" />
                            {t("trips.optimize")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => startEditDay(day, idx)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            {t("trips.editTitle")}
                          </DropdownMenuItem>
                          {trip.days.length > 1 && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => tripsApi.removeDay(trip.id, day.id)}
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                {t("trips.deleteDay")}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <DayAttractions
                    trip={trip}
                    day={day}
                    dayIndex={idx}
                    colorVar={colorVar}
                    onEdit={(a) => setAddCtx({ dayId: day.id, attraction: a })}
                    onAdd={() => setAddCtx({ dayId: day.id })}
                  />
                </li>
              );
            })}
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

function DayAttractions({
  trip,
  day,
  dayIndex,
  colorVar,
  onEdit,
  onAdd,
}: {
  trip: ReturnType<typeof useTrip> & {};
  day: Day;
  dayIndex: number;
  colorVar: string;
  onEdit: (a: Attraction) => void;
  onAdd: () => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const letterOffset = trip!.days.slice(0, dayIndex).reduce((s, d) => s + d.attractions.length, 0);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = day.attractions.map((a) => a.id);
    const oldIdx = ids.indexOf(active.id as string);
    const newIdx = ids.indexOf(over.id as string);
    if (oldIdx < 0 || newIdx < 0) return;
    tripsApi.reorderAttractions(trip!.id, day.id, arrayMove(ids, oldIdx, newIdx));
  };

  return (
    <div className="space-y-2 p-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={day.attractions.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {day.attractions.map((a, i) => (
              <SortableSpot
                key={a.id}
                attraction={a}
                letter={String.fromCharCode(65 + letterOffset + i)}
                colorVar={colorVar}
                onEdit={() => onEdit(a)}
                onDelete={() => tripsApi.removeAttraction(trip!.id, day.id, a.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <button
        onClick={onAdd}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-primary/20 py-2.5 text-sm font-medium text-primary/70 transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
      >
        <Plus className="h-4 w-4" />
        添加景点
      </button>
    </div>
  );
}

function SortableSpot({
  attraction: a,
  letter,
  colorVar,
  onEdit,
  onDelete,
}: {
  attraction: Attraction;
  letter: string;
  colorVar: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: a.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="group flex items-start gap-2 rounded-xl border bg-card px-3 py-2.5 shadow-soft transition-all hover:border-primary/30"
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
        aria-label="拖拽排序"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div
        className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
        style={{ background: `var(${colorVar})` }}
      >
        {letter}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-semibold text-foreground">📍 {a.name}</span>
          {a.lat && a.lng && <MapPin className="h-3 w-3 shrink-0 text-mint" />}
        </div>
        {a.openingHours && (
          <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {a.openingHours}
          </div>
        )}
        {a.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          aria-label="编辑"
          onClick={onEdit}
          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          aria-label="删除"
          onClick={onDelete}
          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}
