import { useState, useEffect, useCallback } from "react";
import type { Profile } from "@/lib/api/profiles";
import { settingsApi } from "@/lib/api/settings";
import { Sun, Moon } from "lucide-react";

interface Props {
  activeProfile: Profile | null;
}

export function StatusBar({ activeProfile }: Props) {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark") ? "dark" : "light";
    }
    return "dark";
  });

  useEffect(() => {
    // Load theme from settings on mount
    settingsApi.get().then((s) => {
      const t = s.theme === "system" ? "dark" : s.theme;
      setTheme(t === "dark" ? "dark" : "light");
      if (t === "dark") {
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
            <span>{activeProfile.entries.length} 词条</span>
            <span>·</span>
            <span>{activeProfile.mode === "replace" ? "替换模式" : "追加模式"}</span>
          </>
        ) : (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
            <span>未激活</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          className="rounded p-0.5 text-[var(--color-text-subtle)] hover:text-[var(--color-text)] transition-colors"
          onClick={toggleTheme}
          title={theme === "dark" ? "切换浅色模式" : "切换深色模式"}
        >
          {theme === "dark" ? <Sun size={12} /> : <Moon size={12} />}
        </button>
        <span className="text-[11px] text-[var(--color-text-subtle)]">~/.claude/settings.json</span>
      </div>
    </div>
  );
}
