import { Sparkles, Upload } from "lucide-react";

interface Props {
  mode: "replace" | "append";
  onModeChange: (mode: "replace" | "append") => void;
  onImport: (words: string[]) => void;
  onAiGenerate: () => void;
}

export function EditorToolbar({ mode, onModeChange, onImport, onAiGenerate }: Props) {
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
    <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-2">
      <div className="flex items-center gap-1 rounded bg-zinc-800 p-0.5">
        <button
          className={`rounded px-2.5 py-1 text-xs transition-colors ${
            mode === "replace"
              ? "bg-zinc-700 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
          onClick={() => onModeChange("replace")}
        >
          替换
        </button>
        <button
          className={`rounded px-2.5 py-1 text-xs transition-colors ${
            mode === "append"
              ? "bg-zinc-700 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
          onClick={() => onModeChange("append")}
        >
          追加
        </button>
      </div>
      <div className="h-4 w-px bg-zinc-800" />
      <button
        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        onClick={handleImport}
      >
        <Upload size={14} />
        导入 .txt
      </button>
      <button
        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        onClick={onAiGenerate}
      >
        <Sparkles size={14} />
        AI 生成
      </button>
    </div>
  );
}
