import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { messageFromError } from "@/lib/errors";
import { authService } from "@/services/auth";

export type LoginMode = "login" | "signup";
export type LoginView = "auth" | "forgot";

export function useLogin(redirect: string) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [mode, setMode] = useState<LoginMode>("login");
  const [view, setView] = useState<LoginView>("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authService.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirect, replace: true });
    });
  }, [navigate, redirect]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await authService.signIn(email, password);
        if (error) throw error;
        toast.success(t("auth.welcomeBack"));
      } else {
        const { error } = await authService.signUp(email, password, displayName);
        if (error) throw error;
        toast.success(t("auth.accountCreated"));
      }
      navigate({ to: redirect, replace: true });
    } catch (err) {
      toast.error(messageFromError(err, t("auth.operationFailed")));
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await authService.sendPasswordReset(email);
      if (error) throw error;
      toast.success(t("auth.resetEmailSent"));
      setView("auth");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.operationFailed"));
    } finally {
      setLoading(false);
    }
  };

  return {
    mode, setMode,
    view, setView,
    email, setEmail,
    password, setPassword,
    displayName, setDisplayName,
    showPw, setShowPw,
    loading,
    handleSubmit,
    handleForgot,
  };
}
