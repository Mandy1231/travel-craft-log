import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Compass, LogOut, User } from "lucide-react";
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
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { t } = useTranslation();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // Read once on mount. Sign-out is already handled by the root listener
    // (which invalidates the router and re-runs this beforeLoad → redirects
    // to /login). Adding a second listener here caused a redirect loop on
    // mobile after sign-in because TOKEN_REFRESHED / INITIAL_SESSION events
    // raced with navigation.
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success(t("auth.signedOut"));
  };


  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-primary/10 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <Compass className="h-4 w-4" />
            Wayfarer
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-hero text-xs font-semibold text-white">
                    {email?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <span className="hidden text-sm sm:inline">{email ?? "..."}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                  {email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <User className="mr-2 h-4 w-4" />
                  {t("common.profile")}
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
