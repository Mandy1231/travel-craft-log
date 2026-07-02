import { Briefcase, Camera, Compass, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

export function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-dvh font-sans text-foreground overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/80" />
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-x-0 bottom-0 h-[55%] w-full text-primary/20"
      >
        <path fill="currentColor" fillOpacity="0.35" d="M0 620 L160 460 L300 540 L460 380 L620 520 L780 420 L940 540 L1120 440 L1280 520 L1440 460 L1440 900 L0 900 Z" />
        <path fill="currentColor" fillOpacity="0.55" d="M0 720 L140 600 L280 660 L440 540 L600 640 L760 580 L920 660 L1100 580 L1260 660 L1440 600 L1440 900 L0 900 Z" />
        <path fill="currentColor" fillOpacity="0.85" d="M0 800 L180 720 L360 770 L540 700 L720 760 L900 710 L1080 770 L1260 720 L1440 780 L1440 900 L0 900 Z" />
      </svg>

      <div className="relative grid min-h-dvh lg:grid-cols-5">
        <aside className="relative hidden lg:col-span-2 lg:flex lg:flex-col lg:justify-center px-12">
          <div className="max-w-sm">
            <div className="mb-6 grid h-12 w-12 place-items-center rounded-xl bg-white/70 ring-1 ring-primary/20 backdrop-blur">
              <Compass className="h-6 w-6 text-primary" strokeWidth={2.25} />
            </div>
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-foreground">
              Plan smarter.<br />Travel better.
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Your journey begins<br />with a single plan.
            </p>
          </div>
          <div className="absolute bottom-12 left-12 flex items-center gap-5 text-primary/70">
            <MapPin className="h-5 w-5" />
            <Briefcase className="h-5 w-5" />
            <Camera className="h-5 w-5" />
            <Compass className="h-5 w-5" />
          </div>
        </aside>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:col-span-3 lg:px-12">
          <div className="w-full max-w-[460px]">
            <div className="rounded-3xl border border-white/60 bg-white p-7 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.18)] backdrop-blur sm:p-9">
              <div className="mb-6 flex items-center justify-center gap-2.5">
                <Logo className="h-8 w-8 text-primary" />
                <span className="text-[22px] font-bold tracking-tight text-foreground">
                  Wayfarer
                </span>
              </div>
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
