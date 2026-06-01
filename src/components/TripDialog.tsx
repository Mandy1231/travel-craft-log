import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Trip } from "@/lib/trips-store";

const EMOJIS = ["✈️", "🏝️", "🌸", "🗼", "🏔️", "🌋", "🏛️", "🏖️", "🚞", "🌅"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (data: {
    title: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    coverEmoji: string;
  }) => void;
  initial?: Trip;
}

export function TripDialog({ open, onOpenChange, onSave, initial }: Props) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [emoji, setEmoji] = useState("✈️");

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setDescription(initial?.description ?? "");
      setStartDate(initial?.startDate ?? "");
      setEndDate(initial?.endDate ?? "");
      setEmoji(initial?.coverEmoji ?? "✈️");
    }
  }, [open, initial]);

  const save = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      coverEmoji: emoji,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {initial ? t("tripDialog.editTitle") : t("tripDialog.createTitle")}
          </DialogTitle>
          <DialogDescription>{t("tripDialog.desc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t("tripDialog.cover")}</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`grid h-10 w-10 place-items-center rounded-lg border text-xl transition-all ${
                    emoji === e
                      ? "border-primary bg-primary/10 scale-110"
                      : "border-border hover:border-foreground/30"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trip-title">{t("tripDialog.name")}</Label>
            <Input
              id="trip-title"
              placeholder={t("tripDialog.namePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="trip-start">{t("tripDialog.startDate")}</Label>
              <Input
                id="trip-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trip-end">{t("tripDialog.endDate")}</Label>
              <Input
                id="trip-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("tripDialog.draftHint")}</p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={save} disabled={!title.trim()}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
