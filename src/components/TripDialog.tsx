import { useEffect, useState } from "react";
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
  onSave: (data: { title: string; startDate?: string; endDate?: string; coverEmoji: string }) => void;
  initial?: Trip;
}

export function TripDialog({ open, onOpenChange, onSave, initial }: Props) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [emoji, setEmoji] = useState("✈️");

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setStartDate(initial?.startDate ?? "");
      setEndDate(initial?.endDate ?? "");
      setEmoji(initial?.coverEmoji ?? "✈️");
    }
  }, [open, initial]);

  const save = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
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
            {initial ? "编辑行程" : "创建新计划"}
          </DialogTitle>
          <DialogDescription>给这趟旅行一个名字和日期。</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>封面</Label>
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
            <Label htmlFor="trip-title">行程名称</Label>
            <Input
              id="trip-title"
              placeholder="例如:济州岛五天游"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="trip-start">出发日期</Label>
              <Input
                id="trip-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trip-end">返回日期</Label>
              <Input
                id="trip-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">留空日期会保存为草稿。</p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={save} disabled={!title.trim()}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
