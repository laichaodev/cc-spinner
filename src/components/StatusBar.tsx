import { useState, useEffect, useCallback } from "react";
import type { Profile } from "@/lib/api/profiles";
import { settingsApi } from "@/lib/api/settings";
import { useT } from "@/lib/i18n/context";
import { Sun, Moon, Globe } from "lucide-react";

interface Props {
  activeProfile: Profile | null;
}

export function StatusBar({ activeProfile }: Props) {
  const { t, lang, toggleLang } = useT();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark") ? "dark" : "light";
    }
    return "light";
  });

  useEffect(() => {
    settingsApi.get().then((s) => {
      const th = s.theme === "dark" ? "dark" : "light";
      setTheme(th);
      if (th === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    settingsApi.update({ theme: next }).catch(() => {});
  }, [theme]);

  return (
    <div className="flex h-7 items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 select-none">
      <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-subtle)]">
        {activeProfile ? (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[var(--color-text-secondary)]">{activeProfile.name}</span>
            <span>·</span>
            <span>{t("profile.entriesCount", { count: activeProfile.entries.length })}</span>
            <span>·</span>
            <span>{activeProfile.mode === "replace" ? t("status.replaceMode") : t("status.appendMode")}</span>
          </>
        ) : (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
            <span>{t("status.inactive")}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          className="rounded p-0.5 text-[10px] text-[var(--color-text-subtle)] hover:text-[var(--color-text)] transition-colors"
          onClick={toggleLang}
          title={lang === "zh" ? t("status.switchZh") : t("status.switchEn")}
        >
          <Globe size={12} />
          <span className="ml-0.5 text-[10px]">{lang === "zh" ? "EN" : "中"}</span>
        </button>
        <button
          className="rounded p-0.5 text-[var(--color-text-subtle)] hover:text-[var(--color-text)] transition-colors"
          onClick={toggleTheme}
          title={theme === "dark" ? t("status.switchLight") : t("status.switchDark")}
        >
          {theme === "dark" ? <Sun size={12} /> : <Moon size={12} />}
        </button>
      </div>
    </div>
  );
}
