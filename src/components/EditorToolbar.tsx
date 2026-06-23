import { Sparkles, Upload, Download } from "lucide-react";
import { useT } from "@/lib/i18n/context";

interface Props {
  mode: "replace" | "append";
  onModeChange: (mode: "replace" | "append") => void;
  onImport: (words: string[]) => void;
  onExport: () => void;
  onAiGenerate: () => void;
}

export function EditorToolbar({ mode, onModeChange, onImport, onExport, onAiGenerate }: Props) {
  const { t } = useT();

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const words = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      onImport(words);
    };
    input.click();
  };

  return (
    <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-2">
      <div className="flex items-center gap-1 rounded bg-[var(--color-surface-hover)] p-0.5">
        <button
          className={`rounded px-2.5 py-1 text-xs transition-colors ${
            mode === "replace"
              ? "bg-[var(--color-surface-active)] text-zinc-950"
              : "text-[var(--color-text-muted)] hover:text-zinc-800"
          }`}
          onClick={() => onModeChange("replace")}
        >
          {t("toolbar.replace")}
        </button>
        <button
          className={`rounded px-2.5 py-1 text-xs transition-colors ${
            mode === "append"
              ? "bg-[var(--color-surface-active)] text-zinc-950"
              : "text-[var(--color-text-muted)] hover:text-zinc-800"
          }`}
          onClick={() => onModeChange("append")}
        >
          {t("toolbar.append")}
        </button>
      </div>
      <div className="h-4 w-px bg-[var(--color-surface-hover)]" />
      <button
        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
        onClick={handleImport}
      >
        <Upload size={14} />
        {t("toolbar.import")}
      </button>
      <button
        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
        onClick={onExport}
      >
        <Download size={14} />
        {t("toolbar.export")}
      </button>
      <button
        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
        onClick={onAiGenerate}
      >
        <Sparkles size={14} />
        {t("toolbar.aiGen")}
      </button>
    </div>
  );
}
