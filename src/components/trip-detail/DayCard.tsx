import { useTranslation } from "react-i18next";
import { Check, Pencil, Trash2, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { tripsApi, type Attraction, type Day, type Trip } from "@/lib/trips-store";
import { DayAttractions } from "./DayAttractions";

export interface DayCardProps {
  trip: Trip;
  day: Day;
  dayIndex: number;
  colorVar: string;
  date: string | null;
  selectedDayId: string | null;
  editingDayId: string | null;
  editingDayTitle: string;
  onToggleMap: (id: string) => void;
  onStartEdit: (day: Day, idx: number) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onTitleChange: (title: string) => void;
  onOptimize: (day: Day) => void;
  onAddCtx: (ctx: { dayId: string; attraction?: Attraction } | null) => void;
}

export function DayCard({
  trip,
  day,
  dayIndex,
  colorVar,
  date,
  selectedDayId,
  editingDayId,
  editingDayTitle,
  onToggleMap,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onTitleChange,
  onOptimize,
  onAddCtx,
}: DayCardProps) {
  const { t } = useTranslation();
  const isSelected = selectedDayId === day.id;
  const isEditing = editingDayId === day.id;

  const handleDelete = () => {
    const dayName = day.title || t("trips.dayN", { n: dayIndex + 1 });
    if (window.confirm(t("trips.confirmDeleteDay", { name: dayName }))) {
      tripsApi.removeDay(trip.id, day.id);
    }
  };

  return (
    <li
      className={`overflow-hidden rounded-2xl border border-slate-200/70 bg-white transition-shadow ${
        isSelected ? "ring-2 ring-offset-2 ring-offset-background shadow-lift" : ""
      }`}
      style={{
        borderLeft: `4px solid var(${colorVar})`,
        ...(isSelected
          ? ({ "--tw-ring-color": `var(${colorVar})` } as React.CSSProperties)
          : {}),
      }}
    >
      <div className="flex items-center justify-between gap-2 bg-slate-50 px-4 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleMap(day.id)}
            title={isSelected ? t("trips.showingOnMap") : t("trips.showOnMap")}
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white transition-transform hover:scale-110 ${
              isSelected ? "ring-2 ring-offset-1 ring-offset-background" : ""
            }`}
            style={{
              background: `var(${colorVar})`,
              ...(isSelected
                ? ({ "--tw-ring-color": `var(${colorVar})` } as React.CSSProperties)
                : {}),
            }}
          >
            {dayIndex + 1}
          </button>
          {isEditing ? (
            <div className="flex flex-1 items-center gap-1">
              <Input
                value={editingDayTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onCommitEdit();
                  if (e.key === "Escape") onCancelEdit();
                }}
                autoFocus
                className="h-8"
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onCommitEdit}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onCancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => onStartEdit(day, dayIndex)}
              className="group flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <h3 className="truncate font-display text-base font-semibold">
                {day.title || t("trips.dayN", { n: dayIndex + 1 })}
              </h3>
              {date && (
                <span className="shrink-0 text-xs text-muted-foreground">({date})</span>
              )}
              <Pencil className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
            </button>
          )}
        </div>
        {!isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7">
                ⋮
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOptimize(day)}>
                <Wand2 className="mr-2 h-3.5 w-3.5" />
                {t("trips.optimize")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStartEdit(day, dayIndex)}>
                <Pencil className="mr-2 h-3.5 w-3.5" />
                {t("trips.editTitle")}
              </DropdownMenuItem>
              {trip.days.length > 1 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
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
        dayIndex={dayIndex}
        colorVar={colorVar}
        onEdit={(a) => onAddCtx({ dayId: day.id, attraction: a })}
        onAdd={() => onAddCtx({ dayId: day.id })}
      />
    </li>
  );
}
