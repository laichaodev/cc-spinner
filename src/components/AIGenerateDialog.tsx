import { useState, useCallback } from "react";
import type { SpinnerEntry } from "@/lib/api/profiles";
import { aiApi } from "@/lib/api/ai";
import { Sparkles, X, AlertCircle } from "lucide-react";

interface Props {
  onClose: () => void;
  onAdd: (entries: SpinnerEntry[]) => void;
}

export function AIGenerateDialog({ onClose, onAdd }: Props) {
  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<SpinnerEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const words = input
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const handleGenerate = useCallback(async () => {
    if (words.length === 0) return;
    setGenerating(true);
    setError(null);
    setResults([]);

    try {
      const entries = await aiApi.generate(words);
      setResults(entries);
    } catch (e: any) {
      if (String(e) === "Cancelled") {
        setError("已取消");
      } else {
        setError(String(e));
      }
    } finally {
      setGenerating(false);
    }
  }, [words]);

  const handleAddAll = () => {
    onAdd(results.filter((r) => !r.gloss.startsWith("[生成失败]")));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-[600px] max-h-[80vh] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-400" />
            <span className="text-sm font-medium">AI 生成 Gloss</span>
          </div>
          <button
            className="rounded p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-zinc-800"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {results.length === 0 && !generating && (
            <>
              <textarea
                className="w-full h-32 rounded bg-[var(--color-surface-hover)] px-3 py-2 text-sm text-[var(--color-text)] placeholder-zinc-500 outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                placeholder="粘贴单词列表，每行一个&#10;例如：&#10;Pondering&#10;Refactoring&#10;Debugging"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                className="flex w-full items-center justify-center gap-2 rounded bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                onClick={handleGenerate}
                disabled={words.length === 0 || generating}
              >
                <Sparkles size={14} />
                生成 ({words.length} 词)
              </button>
            </>
          )}

          {generating && (
            <div className="flex items-center justify-center gap-3 py-8">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
              <span className="text-sm text-[var(--color-text-secondary)]">生成中...</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {results.length > 0 && (
            <>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${
                      r.gloss.startsWith("[生成失败]")
                        ? "text-red-600"
                        : "text-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    <span className="w-28 shrink-0 font-medium">{r.verb}</span>
                    <span className="text-[var(--color-text-muted)]">{r.gloss}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                  onClick={handleAddAll}
                >
                  添加到词组
                </button>
                <button
                  className="rounded bg-[var(--color-surface-hover)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-active)]"
                  onClick={() => {
                    setResults([]);
                    setInput("");
                  }}
                >
                  重新生成
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
