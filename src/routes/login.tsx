import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Compass, Loader2 } from "lucide-react";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Use getSession (local, no network) to avoid a race with the post-sign-in
    // navigation. getUser() is a network call and on mobile it sometimes
    // resolved AFTER navigate(), bouncing the user back to /login.
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

  return (
    <main className="relative grid min-h-screen place-items-center px-5 py-12">


      <div className="w-full max-w-md">
        <div className="rounded-[2rem] border border-white/60 bg-white/95 p-8 shadow-lift backdrop-blur-xl sm:p-10 shadow-none">
          {/* Brand */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-5 grid place-items-center">
              <Compass className="h-16 w-16 text-slate-950" />
            </div>
            <h1 className="font-display font-bold tracking-tight text-foreground sm:text-2xl text-2xl">
              {mode === "login" ? "Welcome to Wayfarer" : t("auth.createAccount")}
            </h1>
          </div>


          <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}>
            <TabsList className="mb-6 grid w-full grid-cols-2 rounded-full bg-muted/70 p-1">
              <TabsTrigger value="login" className="rounded-full">{t("auth.login")}</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-full">{t("auth.signup")}</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              <TabsContent value="signup" className="m-0 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground">
                    {t("auth.displayName")}
                  </Label>
                  <Input
                    id="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t("auth.travelerPlaceholder")}
                    autoComplete="name"
                    className="h-12 rounded-xl border-border bg-muted/30"
                  />
                </div>
              </TabsContent>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">
                  {t("auth.email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-12 rounded-xl border-border bg-muted/30"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground">
                  {t("auth.password")}
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.minChars")}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="h-12 rounded-xl border-border bg-muted/30"
                />
              </div>

              <Button
                type="submit"
                className="h-10 w-full rounded-xl border-0 bg-slate-900 font-semibold text-white shadow-sm hover:bg-slate-800 text-sm"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "login" ? t("auth.login") : t("auth.createAccount")}
              </Button>
            </form>
          </Tabs>

          <p className="mt-6 text-center text-xs text-muted-foreground">{t("auth.terms")}</p>
        </div>
      </div>

    </main>
  );
}
