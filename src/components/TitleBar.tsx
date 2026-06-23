import { useT } from "@/lib/i18n/context";

export function TitleBar() {
  const { t } = useT();

  return (
    <div className="flex h-10 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 select-none">
      <div className="flex items-center gap-2">
        <span className="text-lg">🎯</span>
        <span className="text-sm font-semibold text-[var(--color-text)]">{t("app.title")}</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-xs text-[var(--color-text-muted)]">{t("app.cli")}</span>
      </div>
    </div>
  );
}
