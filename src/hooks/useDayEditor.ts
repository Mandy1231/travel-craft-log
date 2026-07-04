import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { tripsApi, type Day, type Trip } from "@/lib/trips-store";
import { optimizeDayOrder } from "@/lib/route-optimize";

/**
 * Owns day-title inline editing and the "optimize day route" action for a trip.
 * Keeps the route file free of local state plumbing.
 */
export function useDayEditor(trip: Trip) {
  const { t } = useTranslation();
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editingDayTitle, setEditingDayTitle] = useState("");

  const startEditDay = (day: Day, idx: number) => {
    setEditingDayId(day.id);
    setEditingDayTitle(day.title ?? t("trips.dayN", { n: idx + 1 }));
  };
  const commitEditDay = () => {
    if (editingDayId) {
      tripsApi.updateDay(trip.id, editingDayId, {
        title: editingDayTitle.trim() || undefined,
      });
    }
    setEditingDayId(null);
  };
  const cancelEditDay = () => setEditingDayId(null);

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

  return {
    editingDayId,
    editingDayTitle,
    setEditingDayTitle,
    startEditDay,
    commitEditDay,
    cancelEditDay,
    handleOptimize,
  };
}
