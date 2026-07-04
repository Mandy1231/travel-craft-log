import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, User, Calendar, Loader2, MapPin, FileText } from "lucide-react";
import { toast } from "sonner";
import { messageFromError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useTranslation();
  const [userId, setUserId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        toast.error(t("profile.loadFailed"));
        if (!cancelled) setLoading(false);
        return;
      }
      const u = data.user;
      if (cancelled) return;
      setUserId(u.id);
      setEmail(u.email ?? "");
      setCreatedAt(u.created_at ? new Date(u.created_at).toLocaleDateString() : "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, bio, location")
        .eq("id", u.id)
        .maybeSingle();
      if (cancelled) return;
      setDisplayName(profile?.display_name ?? u.user_metadata?.display_name ?? "");
      setBio(profile?.bio ?? "");
      setLocation(profile?.location ?? "");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    try {
      const trimmedName = displayName.trim();
      const trimmedBio = bio.trim();
      const trimmedLoc = location.trim();

      const { error: profileErr } = await supabase
        .from("profiles")
        .update({
          display_name: trimmedName || null,
          bio: trimmedBio || null,
          location: trimmedLoc || null,
        })
        .eq("id", userId);
      if (profileErr) throw profileErr;

      const { error: authErr } = await supabase.auth.updateUser({
        data: { display_name: trimmedName },
      });
      if (authErr) throw authErr;

      toast.success(t("common.saved"));
    } catch (err) {
      toast.error(messageFromError(err, t("auth.operationFailed")));
    } finally {
      setSaving(false);
    }
  };

  const initial = (displayName || email)?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="min-h-[calc(100dvh-65px)] bg-gradient-to-b from-white via-slate-50/50 to-slate-100/80">
      <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("common.profile")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("profile.manageInfo")}</p>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="overflow-hidden rounded-2xl border border-border/60 bg-white/80 shadow-soft backdrop-blur">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-5">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-foreground">
                      {displayName || email}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{email}</p>
                    {location && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {location}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border border-border/60 bg-white/80 shadow-soft backdrop-blur">
              <CardHeader className="px-6 pt-6 sm:px-8">
                <CardTitle className="text-base font-semibold">
                  {t("profile.accountInfo")}
                </CardTitle>
                <CardDescription>{t("profile.accountDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 sm:px-8">
                <form onSubmit={handleSave} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("auth.email")}
                    </Label>
                    <Input
                      value={email}
                      disabled
                      className="h-11 rounded-xl border-border bg-muted/50 pl-3 text-sm text-muted-foreground"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="displayName" className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("auth.displayName")}
                    </Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      maxLength={50}
                      placeholder={t("auth.travelerPlaceholder")}
                      className="h-11 rounded-xl border-border bg-white pl-3 text-sm focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bio" className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("profile.bio")}
                    </Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={280}
                      rows={4}
                      placeholder={t("profile.bioPlaceholder")}
                      className="resize-none rounded-xl border-border bg-white p-3 text-sm focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                    />
                    <p className="text-right text-xs text-muted-foreground">{bio.length}/280</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="location" className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("profile.location")}
                    </Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      maxLength={80}
                      placeholder={t("profile.locationPlaceholder")}
                      className="h-11 rounded-xl border-border bg-white pl-3 text-sm focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                    />
                  </div>

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
