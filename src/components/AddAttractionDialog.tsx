import { useEffect, useRef, useState } from "react";
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
import { MapPin, Search, Loader2 } from "lucide-react";
import type { Attraction } from "@/lib/trips-store";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (data: Omit<Attraction, "id">) => void;
  initial?: Attraction;
}

interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
}

export function AddAttractionDialog({ open, onOpenChange, onSave, initial }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const [address, setAddress] = useState("");

  const [searchQ, setSearchQ] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setDescription(initial?.description ?? "");
      setOpeningHours(initial?.openingHours ?? "");
      setLat(initial?.lat);
      setLng(initial?.lng);
      setAddress("");
      setSearchQ("");
      setResults([]);
    }
  }, [open, initial]);

  useEffect(() => {
    if (!searchQ.trim() || searchQ.length < 2) {
      setResults([]);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(searchQ)}`,
          { headers: { Accept: "application/json" } },
        );
        const data = (await res.json()) as GeoResult[];
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [searchQ]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      openingHours: openingHours.trim() || undefined,
      lat,
      lng,
    });
    onOpenChange(false);
  };

  const pickResult = (r: GeoResult) => {
    setLat(parseFloat(r.lat));
    setLng(parseFloat(r.lon));
    setAddress(r.display_name);
    if (!name) setName(r.display_name.split(",")[0]);
    setResults([]);
    setSearchQ("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            ✨ {initial ? "编辑景点" : "添加新景点"}
          </DialogTitle>
          <DialogDescription>记录下你想要去的地方,以及它的故事。</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="att-name">景点名称 *</Label>
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
              placeholder="例如:9:00-17:00,周一闭馆"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="att-desc">详细描述</Label>
            <Textarea
              id="att-desc"
              placeholder="爬山看日出,记得带外套..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>📍 位置选择</Label>
            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索地点(例如:汉拿山)"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  className="pl-9"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>

              {results.length > 0 && (
                <ul className="mt-2 max-h-44 overflow-auto rounded-lg border bg-card text-sm shadow-soft">
                  {results.map((r, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => pickResult(r)}
                        className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-muted"
                      >
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="line-clamp-2">{r.display_name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {lat && lng && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground">已标记位置</div>
                    {address && (
                      <div className="line-clamp-2 text-muted-foreground">{address}</div>
                    )}
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {lat.toFixed(4)}, {lng.toFixed(4)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLat(undefined);
                      setLng(undefined);
                      setAddress("");
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    清除
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            保存景点
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
