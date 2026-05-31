import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin } from "lucide-react";
import type { Attraction } from "@/lib/trips-store";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (data: Omit<Attraction, "id">) => void;
  initial?: Attraction;
}

export function AddAttractionDialog({ open, onOpenChange, onSave, initial }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setDescription(initial?.description ?? "");
      setOpeningHours(initial?.openingHours ?? "");
      setPinned(!!initial?.lat);
    }
  }, [open, initial]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      openingHours: openingHours.trim() || undefined,
      lat: pinned ? 33.4 + Math.random() * 0.3 : undefined,
      lng: pinned ? 126.5 + Math.random() * 0.3 : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {initial ? "编辑景点" : "添加新景点"}
          </DialogTitle>
          <DialogDescription>记录下你想要去的地方,以及它的故事。</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="att-name">景点名称</Label>
            <Input
              id="att-name"
              placeholder="例如:汉拿山"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="att-hours">开放时间</Label>
            <Input
              id="att-hours"
              placeholder="例如:9:00 开放"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="att-desc">描述信息</Label>
            <Textarea
              id="att-desc"
              placeholder="一些你想记下的细节..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <button
            type="button"
            onClick={() => setPinned((p) => !p)}
            className={`flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm transition-colors ${
              pinned
                ? "border-ocean bg-ocean/10 text-ocean"
                : "border-border text-muted-foreground hover:border-foreground/30"
            }`}
          >
            <MapPin className="h-4 w-4" />
            {pinned ? "已在地图上标记位置" : "在地图上选择位置(可选)"}
          </button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
