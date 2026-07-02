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
import type { Trip } from "@/lib/trips-store";

interface Props {
  trip: Trip | null;
  onClose: () => void;
  onConfirm: (trip: Trip) => void;
  t: (k: string, opts?: Record<string, unknown>) => string;
}

export function DeleteTripDialog({ trip, onClose, onConfirm, t }: Props) {
  return (
    <AlertDialog open={!!trip} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("trips.deleteTitle", { title: trip?.title ?? "" })}
          </AlertDialogTitle>
          <AlertDialogDescription>{t("trips.deleteDesc")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => trip && onConfirm(trip)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
