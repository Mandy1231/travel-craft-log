import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus,
  Calendar,
  Pencil,
  Trash2,
  Eye,
  Compass,
  Search,
  Copy,
  Share2,
  Sparkles,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTrips, tripsApi, type Trip, type Visibility } from "@/lib/trips-store";
import { TripDialog } from "@/components/TripDialog";
import { VisibilityBadge } from "@/components/VisibilityBadge";
import { toast } from "sonner";
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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "我的旅行计划 · Wayfarer" },
      { name: "description", content: "管理你的所有旅行计划,从灵感到行程。" },
    ],
  }),
  component: Index,
});

function formatRange(t: Trip) {
  if (!t.startDate) return null;
  const fmt = (s: string) => s.replaceAll("-", "/");
  return `${fmt(t.startDate)}${t.endDate ? ` — ${fmt(t.endDate)}` : ""}`;
}

function dayCount(t: Trip) {
  if (t.startDate && t.endDate) {
    const d = Math.round(
      (new Date(t.endDate).getTime() - new Date(t.startDate).getTime()) / 86400000,
    ) + 1;
    return Math.max(d, t.days.length);
  }
  return t.days.length;
}

const FILTERS: { value: Visibility | "all"; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "private", label: "私人" },
  { value: "public", label: "公开" },
  { value: "draft", label: "草稿" },
];

function Index() {
  const trips = useTrips();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTrip, setEditTrip] = useState<Trip | null>(null);
  const [deleteTrip, setDeleteTrip] = useState<Trip | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Visibility | "all">("all");

  const filtered = useMemo(() => {
    return trips.filter((t) => {
      if (filter !== "all" && t.visibility !== filter) return false;
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        const hay = [
          t.title,
          t.description ?? "",
          ...t.days.flatMap((d) => d.attractions.map((a) => a.name)),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [trips, q, filter]);

  const handleShare = (t: Trip) => {
    const url = `${window.location.origin}/trips/${t.id}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("分享链接已复制"),
      () => toast.error("复制失败"),
    );
  };

  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1 text-xs font-medium text-primary shadow-soft backdrop-blur">
            <Compass className="h-3.5 w-3.5" />
            Wayfarer · 旅行规划器
          </div>
          <h1 className="bg-gradient-hero bg-clip-text text-5xl font-semibold tracking-tight text-transparent sm:text-6xl">
            🧳 我的旅行计划
          </h1>
          <p className="mt-3 max-w-lg text-base text-muted-foreground">
            把每一段旅程串成回忆。规划路线、收藏景点、与朋友分享。
          </p>
        </div>

        <Button size="lg" onClick={() => setCreateOpen(true)} className="shadow-lift">
          <Plus className="mr-1.5 h-4 w-4" />
          创建新计划
        </Button>
      </header>

      {/* Search + filter */}
      <div className="mb-8 flex flex-col gap-3 rounded-2xl border bg-card/70 p-3 shadow-soft backdrop-blur sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索计划、景点..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl bg-muted/60 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filter === f.value
                  ? "bg-card text-primary shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border-2 border-dashed border-primary/20 bg-gradient-sky/40 px-6 py-24 text-center">
          <Sparkles className="mb-3 h-10 w-10 text-primary/60" />
          <p className="text-lg font-medium text-primary">
            {trips.length === 0 ? "还没有计划。开启第一段旅程吧。" : "没有匹配的计划"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {trips.length === 0 ? "点击右上角创建新计划" : "试着调整搜索或筛选"}
          </p>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {filtered.map((trip) => {
            const range = formatRange(trip);
            const spotCount = trip.days.reduce((s, d) => s + d.attractions.length, 0);
            return (
              <li key={trip.id}>
                <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-primary/10 bg-card/90 shadow-soft backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift">
                  <Link
                    to="/trips/$tripId"
                    params={{ tripId: trip.id }}
                    className="flex items-start gap-4 p-5 pb-3"
                  >
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-hero text-3xl shadow-glow">
                      {trip.coverEmoji ?? "✈️"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <VisibilityBadge visibility={trip.visibility} />
                      </div>
                      <h2 className="truncate font-display text-2xl font-semibold text-foreground">
                        📍 {trip.title}
                      </h2>
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        {range ? (
                          <>
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{range}</span>
                          </>
                        ) : (
                          <span className="italic">计划中...</span>
                        )}
                      </div>
                      {(range || spotCount > 0) && (
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                          {range && <span>{dayCount(trip)} 天</span>}
                          {range && spotCount > 0 && <span>·</span>}
                          {spotCount > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {spotCount} 个景点
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex items-center gap-0.5 border-t border-primary/5 bg-muted/30 px-2 py-1.5">
                    <Link to="/trips/$tripId" params={{ tripId: trip.id }} className="flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-primary hover:bg-primary/10 hover:text-primary"
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        查看
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setEditTrip(trip)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        tripsApi.duplicate(trip.id);
                        toast.success("已复制计划");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    {trip.visibility === "public" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => handleShare(trip)}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTrip(trip)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      <TripDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={(data) => tripsApi.create(data)}
      />
      <TripDialog
        open={!!editTrip}
        onOpenChange={(v) => !v && setEditTrip(null)}
        initial={editTrip ?? undefined}
        onSave={(data) => {
          if (editTrip) tripsApi.update(editTrip.id, data);
        }}
      />

      <AlertDialog open={!!deleteTrip} onOpenChange={(v) => !v && setDeleteTrip(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除「{deleteTrip?.title}」?</AlertDialogTitle>
            <AlertDialogDescription>
              这个行程的所有日程和景点都会一并删除,操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTrip && tripsApi.remove(deleteTrip.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
