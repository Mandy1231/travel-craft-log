import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TripHero({
  title,
  subtitle,
  ctaLabel,
  onCreate,
}: {
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCreate: () => void;
}) {
  return (
    <section className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-white to-primary/10 p-8 sm:p-14">
      <div className="relative z-10 max-w-2xl">
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl">
          {title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {subtitle}
        </p>
        <Button
          size="lg"
          onClick={onCreate}
          className="mt-8 h-12 rounded-full bg-primary px-8 font-medium text-white shadow-lift hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          {ctaLabel}
        </Button>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 sm:-right-10 sm:-top-10 sm:h-80 sm:w-80"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -right-10 h-48 w-48 rounded-full bg-gradient-to-tr from-primary/5 to-primary/10 sm:-bottom-16 sm:right-20 sm:h-56 sm:w-56"
      />
    </section>
  );
}

export function TripSearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="mb-8">
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex h-12 w-full rounded-full border border-border bg-card pl-10 pr-4 text-base shadow-soft outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30"
        />
      </div>
    </div>
  );
}

export function TripListEmpty({
  hasNoTrips,
  t,
}: {
  hasNoTrips: boolean;
  t: (k: string) => string;
}) {
  return (
    <div className="grid place-items-center rounded-3xl border-2 border-dashed border-primary/20 bg-gradient-sky/40 px-6 py-24 text-center">
      <svg
        className="mb-3 h-10 w-10 text-primary/60"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      </svg>
      <p className="text-lg font-medium text-primary">
        {hasNoTrips ? t("trips.emptyNoTrips") : t("trips.emptyNoMatches")}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasNoTrips ? t("trips.emptyHintNew") : t("trips.emptyHintSearch")}
      </p>
    </div>
  );
}
