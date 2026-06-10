import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Compass, Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
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
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);

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

  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthLoading(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message || t("auth.operationFailed"));
        setOauthLoading(null);
        return;
      }
      if (result.redirected) return;
      navigate({ to: redirect, replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("auth.operationFailed");
      toast.error(msg);
      setOauthLoading(null);
    }
  };

  return (
    <main className="min-h-dvh bg-[#F8FAFC] font-sans text-[#1E293B]">
      <div className="grid min-h-dvh lg:grid-cols-5">
        {/* Left promo (desktop only) */}
        <aside className="relative hidden lg:col-span-2 lg:flex lg:flex-col lg:justify-between overflow-hidden bg-gradient-to-br from-[#EFF6FF] via-[#DBEAFE] to-[#BFDBFE] p-12">
          {/* Mountains SVG */}
          <svg
            aria-hidden="true"
            viewBox="0 0 600 400"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 w-full text-[#2563EB]/15"
            preserveAspectRatio="xMidYMax slice"
          >
            <path fill="currentColor" d="M0 320 L120 200 L210 270 L320 140 L430 250 L520 190 L600 260 L600 400 L0 400 Z" />
            <path fill="currentColor" fillOpacity="0.6" d="M0 360 L90 290 L180 330 L280 250 L380 320 L490 270 L600 330 L600 400 L0 400 Z" />
          </svg>
          {/* Sun */}
          <div className="absolute right-16 top-20 h-24 w-24 rounded-full bg-white/60 blur-2xl" />

          <div className="relative flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/30">
              <Compass className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <span className="text-lg font-semibold tracking-tight text-[#0F172A]">Wayfarer</span>
          </div>

          <div className="relative max-w-md">
            <h2 className="text-4xl font-bold leading-tight tracking-tight text-[#0F172A]">
              {t("auth.tagline")}
            </h2>
            <p className="mt-4 text-base text-[#64748B]">{t("auth.taglineSub")}</p>
          </div>

          <div className="relative text-xs text-[#64748B]">
            © {new Date().getFullYear()} Wayfarer
          </div>
        </aside>

        {/* Right form */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:col-span-3 lg:px-12">
          <div className="w-full max-w-[440px]">
            {/* Mobile brand */}
            <div className="mb-6 flex flex-col items-center text-center lg:hidden">
              <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/30">
                <Compass className="h-7 w-7" strokeWidth={2.25} />
              </div>
            </div>

            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.08)] sm:p-8">
              <div className="mb-6 text-center lg:text-left">
                <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] sm:text-[28px]">
                  {view === "forgot"
                    ? t("auth.forgotTitle")
                    : mode === "login"
                      ? t("auth.welcomeBack")
                      : t("auth.createAccount")}
                </h1>
                <p className="mt-1.5 text-sm text-[#64748B]">
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
                    className="block w-full text-center text-sm font-medium text-[#2563EB] hover:underline"
                  >
                    {t("auth.backToLogin")}
                  </button>
                </form>
              ) : (
                <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}>
                  <TabsList className="mb-6 grid w-full grid-cols-2 rounded-xl bg-[#F1F5F9] p-1 h-11">
                    <TabsTrigger
                      value="login"
                      className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-[#0F172A] data-[state=active]:shadow-sm"
                    >
                      {t("auth.login")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-[#0F172A] data-[state=active]:shadow-sm"
                    >
                      {t("auth.signup")}
                    </TabsTrigger>
                  </TabsList>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <TabsContent value="signup" className="m-0 space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-sm font-medium text-[#1E293B]">
                          {t("auth.displayName")}
                        </Label>
                        <Input
                          id="name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder={t("auth.travelerPlaceholder")}
                          autoComplete="name"
                          className="h-12 rounded-xl border-[#E2E8F0] bg-white text-base focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 focus-visible:border-[#2563EB]"
                        />
                      </div>
                    </TabsContent>

                    <FieldEmail value={email} onChange={setEmail} t={t} />

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-medium text-[#1E293B]">
                          {t("auth.password")}
                        </Label>
                        {mode === "login" && (
                          <button
                            type="button"
                            onClick={() => setView("forgot")}
                            className="text-sm font-medium text-[#2563EB] hover:underline"
                          >
                            {t("auth.forgotPassword")}
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                        <Input
                          id="password"
                          type={showPw ? "text" : "password"}
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t("auth.minChars")}
                          autoComplete={mode === "login" ? "current-password" : "new-password"}
                          className="h-12 rounded-xl border-[#E2E8F0] bg-white pl-10 pr-11 text-base focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 focus-visible:border-[#2563EB]"
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

                    {mode === "login" && (
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-[#64748B]">
                        <Checkbox
                          checked={remember}
                          onCheckedChange={(c) => setRemember(c === true)}
                          className="border-[#CBD5E1] data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB]"
                        />
                        {t("auth.rememberMe")}
                      </label>
                    )}

                    <PrimaryButton loading={loading}>
                      {mode === "login" ? t("auth.login") : t("auth.createAccount")}
                    </PrimaryButton>
                  </form>

                  <div className="my-5 flex items-center gap-3 text-xs text-[#94A3B8]">
                    <div className="h-px flex-1 bg-[#E2E8F0]" />
                    {t("auth.orContinueWith")}
                    <div className="h-px flex-1 bg-[#E2E8F0]" />
                  </div>

                  <div className="space-y-3">
                    <SocialButton
                      onClick={() => handleOAuth("google")}
                      loading={oauthLoading === "google"}
                      disabled={oauthLoading !== null}
                      label={t("auth.continueWithGoogle")}
                      icon={<GoogleIcon />}
                    />
                    <SocialButton
                      onClick={() => handleOAuth("apple")}
                      loading={oauthLoading === "apple"}
                      disabled={oauthLoading !== null}
                      label={t("auth.continueWithApple")}
                      icon={<AppleIcon />}
                    />
                  </div>
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

function SocialButton({
  onClick,
  loading,
  disabled,
  label,
  icon,
}: {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm font-medium text-[#1E293B] transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.3C29.3 35.1 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.6l6.3 5.3C41.4 35.3 44 30 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.46 2.23-1.21 3.02-.8.84-2.1 1.5-3.15 1.42-.13-1.12.42-2.29 1.15-3.04.82-.85 2.22-1.49 3.21-1.4zM20.5 17.13c-.55 1.27-.81 1.84-1.52 2.96-.99 1.56-2.39 3.5-4.12 3.52-1.54.02-1.94-1-4.03-.99-2.1.01-2.53 1.01-4.08.99-1.73-.02-3.06-1.77-4.05-3.33-2.78-4.37-3.07-9.5-1.36-12.23.96-1.56 2.48-2.47 3.91-2.47 1.46 0 2.37.8 3.58.8 1.17 0 1.88-.8 3.57-.8 1.27 0 2.62.69 3.59 1.88-3.15 1.72-2.64 6.22.51 7.67z" />
    </svg>
  );
}
