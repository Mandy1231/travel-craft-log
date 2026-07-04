import { Clock, GripVertical, MapPin, Pencil, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Attraction } from "@/lib/trips-store";

export function SortableSpot({
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
