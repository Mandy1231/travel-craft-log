import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Globe,
  Lock,
  Pencil,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MapPreview } from "@/components/MapPreview";
import { AddAttractionDialog } from "@/components/AddAttractionDialog";
import { TripDialog } from "@/components/TripDialog";
import { useTrip, tripsApi, type Attraction } from "@/lib/trips-store";
import { toast } from "sonner";

export const Route = createFileRoute("/trips/$tripId")({
  head: () => ({
    meta: [
      { title: "行程详情 · Wayfarer" },
      { name: "description", content: "查看行程的每一天和每一个景点。" },
    ],
  }),
  component: TripDetail,
});

function TripDetail() {
  const { tripId } = Route.useParams();
  const navigate = useNavigate();
  const trip = useTrip(tripId);

  const [editTripOpen, setEditTripOpen] = useState(false);
  const [addCtx, setAddCtx] = useState<{ dayId: string; attraction?: Attraction } | null>(null);

  const allAttractions = useMemo(
    () => trip?.days.flatMap((d) => d.attractions) ?? [],
    [trip],
  );

  if (!trip) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl">行程未找到</h1>
        <p className="mt-2 text-muted-foreground">这个行程可能已被删除。</p>
        <Link to="/" className="mt-6 inline-block">
          <Button>返回首页</Button>
        </Link>
      </div>
    );
  }

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("链接已复制到剪贴板");
    } catch {
      toast.error("复制失败");
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-6 pb-24 pt-10">
      {/* Top bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate({ to: "/" })}
          className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          全部行程
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-1.5 h-4 w-4" />
            分享
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditTripOpen(true)}>
            <Pencil className="mr-1.5 h-4 w-4" />
            编辑信息
          </Button>
          <Button
            variant={trip.isPublic ? "default" : "outline"}
            size="sm"
            onClick={() => {
              tripsApi.update(trip.id, { isPublic: !trip.isPublic });
              toast.success(trip.isPublic ? "已设为私密" : "已设为公开");
            }}
          >
            {trip.isPublic ? (
              <>
                <Globe className="mr-1.5 h-4 w-4" />
                公开
              </>
            ) : (
              <>
                <Lock className="mr-1.5 h-4 w-4" />
                设为公开
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Header */}
      <header className="mb-10 flex items-start gap-5">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-gradient-warm text-5xl shadow-lift">
          {trip.coverEmoji}
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {trip.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {trip.startDate ? (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {trip.startDate.replaceAll("-", "/")}
                {trip.endDate ? ` — ${trip.endDate.replaceAll("-", "/")}` : ""}
              </span>
            ) : (
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                草稿
              </span>
            )}
            <span>·</span>
            <span>
              {trip.days.length} 天 · {allAttractions.length} 个景点
            </span>
          </div>
        </div>
      </header>

      {/* Body grid */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="lg:sticky lg:top-6 lg:self-start">
          <MapPreview attractions={allAttractions} />
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl">行程安排</h2>
            <Button size="sm" variant="outline" onClick={() => tripsApi.addDay(trip.id)}>
              <Plus className="mr-1 h-4 w-4" />
              添加新一天
            </Button>
          </div>

          <ol className="space-y-5">
            {trip.days.map((day, idx) => (
              <li key={day.id} className="rounded-xl border bg-background/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold">第 {idx + 1} 天</h3>
                  {trip.days.length > 1 && (
                    <button
                      onClick={() => tripsApi.removeDay(trip.id, day.id)}
                      className="text-xs text-muted-foreground transition-colors hover:text-destructive"
                    >
                      移除这天
                    </button>
                  )}
                </div>

                <ul className="space-y-2">
                  {day.attractions.map((a, i) => (
                    <li
                      key={a.id}
                      className="group flex items-start gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:border-foreground/20"
                    >
                      <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-hero text-xs font-bold text-primary-foreground">
                        {String.fromCharCode(
                          65 +
                            trip.days
                              .slice(0, idx)
                              .reduce((s, d) => s + d.attractions.length, 0) +
                            i,
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-foreground">{a.name}</div>
                        {a.openingHours && (
                          <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {a.openingHours}
                          </div>
                        )}
                        {a.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {a.description}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          aria-label="编辑"
                          onClick={() => setAddCtx({ dayId: day.id, attraction: a })}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          aria-label="删除"
                          onClick={() => tripsApi.removeAttraction(trip.id, day.id, a.id)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                  <li>
                    <button
                      onClick={() => setAddCtx({ dayId: day.id })}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2.5 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                    >
                      <Plus className="h-4 w-4" />
                      添加景点
                    </button>
                  </li>
                </ul>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <TripDialog
        open={editTripOpen}
        onOpenChange={setEditTripOpen}
        initial={trip}
        onSave={(data) =>
          tripsApi.update(trip.id, { ...data, isDraft: !data.startDate })
        }
      />

      <AddAttractionDialog
        open={!!addCtx}
        onOpenChange={(v) => !v && setAddCtx(null)}
        initial={addCtx?.attraction}
        onSave={(data) => {
          if (!addCtx) return;
          if (addCtx.attraction) {
            tripsApi.updateAttraction(trip.id, addCtx.dayId, addCtx.attraction.id, data);
          } else {
            tripsApi.addAttraction(trip.id, addCtx.dayId, data);
          }
        }}
      />
    </main>
  );
}
