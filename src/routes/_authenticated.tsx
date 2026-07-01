import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { getAuthSession, getAuthSessionSync } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { LogOut, User, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  // Supabase persists the session in localStorage, which the server cannot
  // read. Skip SSR for the protected subtree so the gate only runs on the
  // client where the session is actually available — otherwise hard refreshes
  // bounce between /login and the protected page.
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Read from the in-memory auth store instead of calling
    // supabase.auth.getSession() on every navigation. The store is hydrated
    // once at app start and kept fresh via onAuthStateChange, so this is
    // synchronous after the first load — no periodic flicker on nav.
    const session = getAuthSessionSync() ?? (await getAuthSession());
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  // Only show a loading fallback if the auth check actually stalls; otherwise
  // fast navigations would flash a spinner on every page change.
  pendingMs: 300,
  pendingMinMs: 0,
  pendingComponent: () => (
    <div className="grid min-h-[60vh] place-items-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary/70" />
    </div>
  ),
  component: AuthedLayout,
});

function AuthedLayout() {
  const { t } = useTranslation();
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (cancelled || !user) return;
      setEmail(user.email ?? null);

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setDisplayName(profile?.display_name ?? user.user_metadata?.display_name ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success(t("auth.signedOut"));
  };

  const label = displayName || email;
  const initial = (displayName || email)?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
          <Link to="/" class
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 px-2 sm:px-3">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {initial}
                  </div>
                  <span className="min-w-0 max-w-[120px] truncate text-sm sm:max-w-[160px]">
                    {label ?? "..."}
                  </span>
                </Button>
              </DropdownMenuTrigger>


              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                  {email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    {t("common.profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("common.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
