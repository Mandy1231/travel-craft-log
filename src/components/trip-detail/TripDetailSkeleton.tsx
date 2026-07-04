/**
 * Skeleton shown while a trip is being fetched. Mirrors the real trip-detail
 * layout — back button, hero, map block, day list — so the page doesn't
 * visually jump when data arrives.
 */
export function TripDetailSkeleton() {
  return (
    <main
      className="mx-auto max-w-7xl animate-pulse px-5 pb-24 pt-8 sm:px-8"
      aria-busy="true"
      aria-label="Loading trip"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="h-4 w-24 rounded bg-slate-200/80" />
        <div className="flex gap-2">
          <div className="h-8 w-20 rounded-md bg-slate-200/80" />
          <div className="h-8 w-20 rounded-md bg-slate-200/60" />
          <div className="h-8 w-20 rounded-md bg-slate-200/60" />
        </div>
      </div>

      <header className="mb-10 flex items-start gap-5">
        <div className="h-20 w-20 shrink-0 rounded-3xl bg-slate-200/80" />
        <div className="min-w-0 flex-1 pt-1">
          <div className="h-9 w-2/3 rounded bg-slate-200/80" />
          <div className="mt-4 h-4 w-1/2 rounded bg-slate-200/60" />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="h-[420px] rounded-3xl bg-slate-200/70" />
        <div className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-soft sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-6 w-32 rounded bg-slate-200/80" />
            <div className="h-8 w-24 rounded-md bg-slate-200/70" />
          </div>
          <ul className="space-y-4">
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white"
                style={{ borderLeft: "4px solid rgb(226 232 240)" }}
              >
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5">
                  <div className="h-7 w-7 rounded-full bg-slate-200/80" />
                  <div className="h-4 w-32 rounded bg-slate-200/70" />
                </div>
                <div className="space-y-2 p-3">
                  <div className="h-14 rounded-xl bg-slate-100" />
                  <div className="h-14 rounded-xl bg-slate-100" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
