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

  const BRAND = "#FF385C"; // Airbnb-inspired coral
  const BRAND_DARK = "#E11D48";

  return (
    <main
      className="relative min-h-dvh bg-white text-[#222222]"
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
    >
      <div className="grid min-h-dvh lg:grid-cols-2">
        {/* Left: hero photo (desktop only) — Airbnb-style edge-to-edge imagery */}
        <aside className="relative hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1400&q=80"
            alt="Traveler overlooking a mountain landscape"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/55 via-black/20 to-transparent" />

          {/* Top brand */}
          <div className="absolute left-10 top-8 flex items-center gap-2">
            <BrandMark color={BRAND} />
            <span className="text-[20px] font-semibold tracking-tight text-white" style={{ letterSpacing: "-0.02em" }}>
              Wayfarer
            </span>
          </div>

          {/* Bottom copy */}
          <div className="absolute inset-x-10 bottom-10 max-w-md text-white">
            <h2 className="text-[34px] font-semibold leading-[1.1] tracking-tight">
              Belong anywhere.<br />Plan everywhere.
            </h2>
            <p className="mt-3 text-[15px] text-white/85">
              Discover trips, save places, and travel with the people you love.
            </p>
          </div>
        </aside>

        {/* Right: form */}
        <section className="flex items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-[420px]">
            {/* Mobile brand */}
            <div className="mb-6 flex items-center justify-center gap-2 lg:hidden">
              <BrandMark color={BRAND} />
              <span className="text-[20px] font-semibold tracking-tight text-[#222222]" style={{ letterSpacing: "-0.02em" }}>
                Wayfarer
              </span>
            </div>

            <div className="rounded-2xl border border-[#EBEBEB] bg-white p-6 shadow-[0_6px_20px_rgba(0,0,0,0.04)] sm:p-8">
              <div className="mb-5 border-b border-[#EBEBEB] pb-4">
                <h1 className="text-[22px] font-semibold tracking-tight text-[#222222]">
                  {view === "forgot"
                    ? t("auth.forgotTitle")
                    : mode === "login"
                      ? t("auth.welcomeBack")
                      : t("auth.createAccount")}
                </h1>
                <p className="mt-1 text-[14px] text-[#717171]">
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
                    className="block w-full text-center text-sm font-semibold text-[#222222] underline underline-offset-4"
                  >
                    {t("auth.backToLogin")}
                  </button>
                </form>
              ) : (
                <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}>
                  <TabsList className="mb-5 grid w-full grid-cols-2 rounded-none border-b border-[#EBEBEB] bg-transparent p-0 h-auto">
                    <TabsTrigger
                      value="login"
                      className="rounded-none border-b-2 border-transparent bg-transparent pb-3 pt-1 text-sm font-semibold text-[#717171] shadow-none data-[state=active]:border-[#222222] data-[state=active]:bg-transparent data-[state=active]:text-[#222222] data-[state=active]:shadow-none"
                    >
                      {t("auth.login")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="rounded-none border-b-2 border-transparent bg-transparent pb-3 pt-1 text-sm font-semibold text-[#717171] shadow-none data-[state=active]:border-[#222222] data-[state=active]:bg-transparent data-[state=active]:text-[#222222] data-[state=active]:shadow-none"
                    >
                      {t("auth.signup")}
                    </TabsTrigger>
                  </TabsList>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <TabsContent value="signup" className="m-0 space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-[13px] font-medium text-[#222222]">
                          {t("auth.displayName")}
                        </Label>
                        <Input
                          id="name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder={t("auth.travelerPlaceholder")}
                          autoComplete="name"
                          className="h-12 rounded-lg border-[#B0B0B0] bg-white text-base focus-visible:ring-2 focus-visible:ring-[#222222]/15 focus-visible:border-[#222222]"
                        />
                      </div>
                    </TabsContent>

                    <FieldEmail value={email} onChange={setEmail} t={t} />

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-[13px] font-medium text-[#222222]">
                          {t("auth.password")}
                        </Label>
                        {mode === "login" && (
                          <button
                            type="button"
                            onClick={() => setView("forgot")}
                            className="text-[13px] font-semibold text-[#222222] underline underline-offset-4"
                          >
                            {t("auth.forgotPassword")}
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#717171]" />
                        <Input
                          id="password"
                          type={showPw ? "text" : "password"}
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t("auth.minChars")}
                          autoComplete={mode === "login" ? "current-password" : "new-password"}
                          className="h-12 rounded-lg border-[#B0B0B0] bg-white pl-10 pr-11 text-base focus-visible:ring-2 focus-visible:ring-[#222222]/15 focus-visible:border-[#222222]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((v) => !v)}
                          aria-label={showPw ? t("auth.hidePassword") : t("auth.showPassword")}
                          className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]"
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

              <p className="mt-6 text-center text-xs leading-relaxed text-[#94A3B8]">{t("auth.terms")}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function FieldEmail({ value, onChange, t }: { value: string; onChange: (v: string) => void; t: (k: string) => string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="email" className="text-sm font-medium text-[#1E293B]">
        {t("auth.email")}
      </Label>
      <div className="relative">
        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
        <Input
          id="email"
          type="email"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="h-12 rounded-xl border-[#E2E8F0] bg-white pl-10 text-base focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 focus-visible:border-[#2563EB]"
        />
      </div>
    </div>
  );
}

function PrimaryButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <Button
      type="submit"
      className="h-12 w-full rounded-xl bg-[#2563EB] text-base font-semibold text-white shadow-md shadow-[#2563EB]/25 hover:bg-[#1D4ED8] focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 focus-visible:ring-offset-2"
      disabled={loading}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
