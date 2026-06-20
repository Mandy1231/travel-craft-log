import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, User, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        toast.error(t("auth.operationFailed"));
        setLoading(false);
        return;
      }
      setEmail(data.user.email ?? "");
      setDisplayName(data.user.user_metadata?.display_name ?? "");
      setCreatedAt(data.user.created_at ? new Date(data.user.created_at).toLocaleDateString() : "");
      setLoading(false);
    });
  }, [t]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      });
      if (error) throw error;
      toast.success(t("common.saved"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("auth.operationFailed");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const initial = email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="min-h-[calc(100dvh-65px)] bg-gradient-to-b from-white via-slate-50/50 to-slate-100/80">
      <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-12">
        {/* Back */}
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("common.profile")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("profile.manageInfo")}
          </p>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Avatar card */}
            <Card className="overflow-hidden rounded-2xl border border-border/60 bg-white/80 shadow-soft backdrop-blur">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-5">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {displayName || email}
                    </p>
                    <p className="text-sm text-muted-foreground">{email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info & Edit */}
            <Card className="overflow-hidden rounded-2xl border border-border/60 bg-white/80 shadow-soft backdrop-blur">
              <CardHeader className="px-6 pt-6 sm:px-8">
                <CardTitle className="text-base font-semibold">
                  {t("profile.accountInfo")}
                </CardTitle>
                <CardDescription>{t("profile.accountDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 sm:px-8">
                <form onSubmit={handleSave} className="space-y-5">
                  {/* Email (read-only) */}
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("auth.email")}
                    </Label>
                    <div className="relative">
                      <Input
                        value={email}
                        disabled
                        className="h-11 rounded-xl border-border bg-muted/50 pl-3 text-sm text-muted-foreground"
                      />
                    </div>
                  </div>

                  {/* Display name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="displayName" className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("auth.displayName")}
                    </Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={t("auth.travelerPlaceholder")}
                      className="h-11 rounded-xl border-border bg-white pl-3 text-sm focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                    />
                  </div>

                  {/* Created at */}
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("profile.joined")}
                    </Label>
                    <div className="flex h-11 items-center rounded-xl border border-border bg-muted/50 px-3 text-sm text-muted-foreground">
                      {createdAt}
                    </div>
                  </div>

                  <Separator className="my-2" />

                  <Button
                    type="submit"
                    disabled={saving}
                    className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white shadow-md hover:bg-primary/90 sm:w-auto sm:px-8"
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("common.save")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
