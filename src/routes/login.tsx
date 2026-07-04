import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useLogin } from "@/hooks/useLogin";
import { LoginLayout } from "@/components/login/LoginLayout";
import { LoginForm } from "@/components/login/LoginForm";
import { ForgotPasswordForm } from "@/components/login/ForgotPasswordForm";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || "/",
  }),
  head: () => ({
    meta: [
      { title: "Wayfarer · Sign in" },
      { name: "description", content: "Sign in to Wayfarer to manage your trips." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const { redirect } = Route.useSearch();
  const login = useLogin(redirect);

  const heading =
    login.view === "forgot"
      ? t("auth.forgotTitle")
      : login.mode === "login"
        ? t("auth.welcomeBack")
        : t("auth.createAccount");
  const sub = login.view === "forgot" ? t("auth.forgotDesc") : t("auth.taglineSub");

  return (
    <LoginLayout>
      <div className="mb-6 text-center">
        <h1
          className="font-sans text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
          suppressHydrationWarning
        >
          {heading}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground" suppressHydrationWarning>
          {sub}
        </p>
      </div>

      {login.view === "forgot" ? (
        <ForgotPasswordForm
          email={login.email}
          setEmail={login.setEmail}
          loading={login.loading}
          onSubmit={login.handleForgot}
          onBack={() => login.setView("auth")}
          t={t}
        />
      ) : (
        <LoginForm
          mode={login.mode}
          setMode={login.setMode}
          email={login.email}
          setEmail={login.setEmail}
          password={login.password}
          setPassword={login.setPassword}
          displayName={login.displayName}
          setDisplayName={login.setDisplayName}
          showPw={login.showPw}
          setShowPw={login.setShowPw}
          loading={login.loading}
          onSubmit={login.handleSubmit}
          onForgotClick={() => login.setView("forgot")}
          t={t}
        />
      )}

      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        {t("auth.terms")}
      </p>
    </LoginLayout>
  );
}
