import type { FormEvent } from "react";
import { FieldEmail, PrimaryButton } from "./LoginFields";

interface Props {
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
  onBack: () => void;
  t: (k: string) => string;
}

export function ForgotPasswordForm({ email, setEmail, loading, onSubmit, onBack, t }: Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FieldEmail value={email} onChange={setEmail} t={t} />
      <PrimaryButton loading={loading}>{t("auth.sendResetLink")}</PrimaryButton>
      <button
        type="button"
        onClick={onBack}
        className="block w-full text-center text-sm font-medium text-primary hover:underline"
      >
        {t("auth.backToLogin")}
      </button>
    </form>
  );
}
