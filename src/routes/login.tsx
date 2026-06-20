import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Compass, Eye, EyeOff, Loader2, Mail, Lock, MapPin, Briefcase, Camera } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || "/",
  }),
  head: () => ({
    meta: [
      { title: "Wayfarer · Sign in" },
      { name: "description", content: "Sign in to Wayfarer to manage your trips." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [view, setView] = useState<"auth" | "forgot">("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirect, replace: true });
    });
  }, [navigate, redirect]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t("auth.welcomeBack"));
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: displayName ? { display_name: displayName } : undefined,
          },
        });
        if (error) throw error;
        toast.success(t("auth.accountCreated"));
      }
      navigate({ to: redirect, replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("auth.operationFailed");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success(t("auth.resetEmailSent"));
      setView("auth");
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("auth.operationFailed");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-dvh font-sans text-foreground overflow-hidden">
      {/* Background: soft blue sky + mountain silhouettes */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/10 to-primary/15" />
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
        {/* Left promo (desktop only) */}
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

        {/* Right form */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:col-span-3 lg:px-12">
          <div className="w-full max-w-[460px]">
            <div className="rounded-3xl border border-white/60 bg-white/95 p-7 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.18)] backdrop-blur sm:p-9">
              {/* Brand inside card — travel-brand-inspired logo */}
              <div className="mb-6 flex items-center justify-center gap-2.5">
                <BrandMark />
                <span className="text-[22px] font-bold tracking-tight text-foreground">
                  Wayfarer
                </span>
              </div>

              <div className="mb-6 text-center">
                <h1 className="font-sans text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {view === "forgot"
                    ? t("auth.forgotTitle")
                    : mode === "login"
                      ? t("auth.welcomeBack")
                      : t("auth.createAccount")}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {view === "forgot" ? t("auth.forgotDesc") : t("auth.taglineSub")}
                </p>
              </div>

              {view === "forgot" ? (
                <form onSubmit={handleForgot} className="space-y-4">
                  <FieldEmail value={email} onChange={setEmail} t={t} />
                  <PrimaryButton loading={loading}>{t("auth.sendResetLink")}</PrimaryButton>
                  <button
                    type="button"
                    onClick={() => setView("auth")}
                    className="block w-full text-center text-sm font-medium text-primary hover:underline"
                  >
                    {t("auth.backToLogin")}
                  </button>
                </form>
              ) : (
                <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}>
                  <TabsList className="mb-6 grid w-full grid-cols-2 rounded-none border-b border-border bg-transparent p-0 h-auto">
                    <TabsTrigger
                      value="login"
                      className="rounded-none border-b-2 border-transparent bg-transparent pb-2.5 pt-1 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                    >
                      {t("auth.login")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="rounded-none border-b-2 border-transparent bg-transparent pb-2.5 pt-1 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                    >
                      {t("auth.signup")}
                    </TabsTrigger>
                  </TabsList>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <TabsContent value="signup" className="m-0 space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-sm font-medium text-foreground">
                          {t("auth.displayName")}
                        </Label>
                        <Input
                          id="name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder={t("auth.travelerPlaceholder")}
                          autoComplete="name"
                          className="h-12 rounded-xl border-border bg-white text-base focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                        />
                      </div>
                    </TabsContent>

                    <FieldEmail value={email} onChange={setEmail} t={t} />

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-medium text-foreground">
                          {t("auth.password")}
                        </Label>
                        {mode === "login" && (
                          <button
                            type="button"
                            onClick={() => setView("forgot")}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            {t("auth.forgotPassword")}
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPw ? "text" : "password"}
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t("auth.minChars")}
                          autoComplete={mode === "login" ? "current-password" : "new-password"}
                          className="h-12 rounded-xl border-border bg-white pl-10 pr-11 text-base focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((v) => !v)}
                          aria-label={showPw ? t("auth.hidePassword") : t("auth.showPassword")}
                          className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <PrimaryButton loading={loading}>
                      {mode === "login" ? t("auth.login") : t("auth.createAccount")}
                    </PrimaryButton>
                  </form>
                </Tabs>
              )}

              <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">{t("auth.terms")}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/**
 * Simple circle + leaf mark — clean, minimal, inspired by
 * modern travel brand logos (Trip.com, Booking style).
 */
function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8 text-primary" aria-hidden="true">
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        fill="currentColor"
        d="M20.5 11.5c-1.5 0-3.2 1.6-4.5 3.2-1.3-1.6-3-3.2-4.5-3.2-1.2 0-2.2.8-2.2 2.5 0 2.8 3.5 5.8 6.7 8.2 3.2-2.4 6.7-5.4 6.7-8.2 0-1.7-1-2.5-2.2-2.5Z"
      />
    </svg>
  );
}

function FieldEmail({ value, onChange, t }: { value: string; onChange: (v: string) => void; t: (k: string) => string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="email" className="text-sm font-medium text-foreground">
        {t("auth.email")}
      </Label>
      <div className="relative">
        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="email"
          type="email"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="h-12 rounded-xl border-border bg-white pl-10 text-base focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
        />
      </div>
    </div>
  );
}

function PrimaryButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <Button
      type="submit"
      className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-white shadow-md hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
      disabled={loading}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
