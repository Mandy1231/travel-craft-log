import type { FormEvent } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FieldEmail, PrimaryButton } from "./LoginFields";
import type { LoginMode } from "@/hooks/useLogin";

interface LoginFormProps {
  mode: LoginMode;
  setMode: (m: LoginMode) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  displayName: string;
  setDisplayName: (v: string) => void;
  showPw: boolean;
  setShowPw: (fn: (v: boolean) => boolean) => void;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
  onForgotClick: () => void;
  t: (k: string) => string;
}

export function LoginForm({
  mode, setMode,
  email, setEmail,
  password, setPassword,
  displayName, setDisplayName,
  showPw, setShowPw,
  loading, onSubmit, onForgotClick, t,
}: LoginFormProps) {
  return (
    <Tabs value={mode} onValueChange={(v) => setMode(v as LoginMode)}>
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

      <form onSubmit={onSubmit} className="space-y-4">
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
                onClick={onForgotClick}
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
  );
}
