import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Calendar, Pencil, Trash2, Eye, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTrips, tripsApi, type Trip } from "@/lib/trips-store";
import { TripDialog } from "@/components/TripDialog";
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

function Index() {
  const trips = useTrips();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTrip, setEditTrip] = useState<Trip | null>(null);
  const [deleteTrip, setDeleteTrip] = useState<Trip | null>(null);

  return (
    <main className="mx-auto max-w-5xl px-6 pb-24 pt-16">
      <header className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur">
            <Compass className="h-3.5 w-3.5 text-ocean" />
            Wayfarer
          </div>
          <h1 className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
            我的旅行计划
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

      {trips.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-dashed bg-card/50 px-6 py-24 text-center">
          <p className="text-lg text-muted-foreground">还没有计划。开启第一段旅程吧。</p>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {trips.map((trip) => {
            const range = formatRange(trip);
            return (
              <li key={trip.id}>
                <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
                  <Link
                    to="/trips/$tripId"
                    params={{ tripId: trip.id }}
                    className="flex items-center gap-4 p-5 pb-3"
                  >
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-warm text-3xl shadow-soft">
                      {trip.coverEmoji ?? "✈️"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-display text-2xl font-semibold text-foreground">
                        {trip.title}
                      </h2>
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        {range ? (
                          <>
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{range}</span>
                          </>
                        ) : (
                          <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                            草稿
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center gap-1 border-t bg-muted/40 px-3 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setEditTrip(trip)}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTrip(trip)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      删除
                    </Button>
                    <Link
                      to="/trips/$tripId"
                      params={{ tripId: trip.id }}
                      className="ml-auto"
                    >
                      <Button variant="ghost" size="sm" className="text-ocean hover:text-ocean">
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        查看
                      </Button>
                    </Link>
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
          if (editTrip) {
            tripsApi.update(editTrip.id, {
              ...data,
              isDraft: !data.startDate,
            });
          }
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
