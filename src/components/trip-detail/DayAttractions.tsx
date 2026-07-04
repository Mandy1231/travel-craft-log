import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { tripsApi, type Attraction, type Day, type Trip } from "@/lib/trips-store";
import { SortableSpot } from "./SortableSpot";

export function DayAttractions({
  trip,
  day,
  dayIndex,
  colorVar,
  onEdit,
  onAdd,
}: {
  trip: Trip;
  day: Day;
  dayIndex: number;
  colorVar: string;
  onEdit: (a: Attraction) => void;
  onAdd: () => void;
}) {
  const { t } = useTranslation();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const letterOffset = trip.days.slice(0, dayIndex).reduce((s, d) => s + d.attractions.length, 0);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = day.attractions.map((a) => a.id);
    const oldIdx = ids.indexOf(active.id as string);
    const newIdx = ids.indexOf(over.id as string);
    if (oldIdx < 0 || newIdx < 0) return;
    tripsApi.reorderAttractions(trip.id, day.id, arrayMove(ids, oldIdx, newIdx));
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
                onDelete={() => tripsApi.removeAttraction(trip.id, day.id, a.id)}
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
        {t("trips.addSpot")}
      </button>
    </div>
  );
}
