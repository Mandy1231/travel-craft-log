import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Compass, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password · Wayfarer" },
      { name: "description", content: "Set a new password for your Wayfarer account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase JS auto-processes the recovery token in the URL hash and emits
    // a PASSWORD_RECOVERY event. We just need to wait for a session to exist.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success(t("auth.passwordUpdated"));
      await supabase.auth.signOut();
      navigate({ to: "/login", replace: true });
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
        <div className="rounded-[2rem] border border-white/60 bg-white/95 p-8 backdrop-blur-xl sm:p-10">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-5 grid place-items-center">
              <Compass className="h-16 w-16 text-slate-950" />
            </div>
            <h1 className="font-display font-bold tracking-tight text-foreground text-2xl">
              {t("auth.resetPasswordTitle")}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-xs font-semibold text-muted-foreground">
                {t("auth.newPassword")}
              </Label>
              <Input
                id="new-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.minChars")}
                autoComplete="new-password"
                className="h-12 rounded-xl border-border bg-muted/30"
              />
            </div>
            <Button
              type="submit"
              className="h-10 w-full rounded-xl border-0 bg-slate-900 font-semibold text-white shadow-sm hover:bg-slate-800 text-sm"
              disabled={loading || !ready}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("auth.updatePassword")}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
