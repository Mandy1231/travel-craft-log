import { useTranslation } from "react-i18next";
import { LANGS, persistLanguage } from "@/i18n";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage ?? i18n.language;

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-card/80 px-1 py-0.5 text-[11px] font-medium shadow-soft backdrop-blur">
      <Globe className="ml-1 h-3 w-3 text-muted-foreground" />
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => persistLanguage(l.code)}
          className={`rounded-full px-2 py-0.5 transition-all ${
            current === l.code
              ? "bg-gradient-hero text-white shadow-soft"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
