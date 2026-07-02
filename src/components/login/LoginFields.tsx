import { Loader2, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function FieldEmail({
  value,
  onChange,
  t,
}: {
  value: string;
  onChange: (v: string) => void;
  t: (k: string) => string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="email" className="text-sm font-medium text-foreground">
        {t("auth.email")}
      </Label>
      <div className="relative">
        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="email"
          type="email"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="h-12 rounded-xl border-border bg-white pl-10 text-base focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
        />
      </div>
    </div>
  );
}

export function PrimaryButton({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="submit"
      className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-white shadow-md hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
      disabled={loading}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
