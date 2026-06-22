import { useState, useRef, useEffect, useCallback } from "react";
import type { SpinnerEntry } from "@/lib/api/profiles";
import { Trash2 } from "lucide-react";

interface Props {
  index: number;
  entry: SpinnerEntry;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onToggleSelect: () => void;
  onUpdate: (entry: SpinnerEntry) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function EntryRow({
  entry,
  isSelected,
  isFirst,
  isLast,
  onToggleSelect,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: Props) {
  const [verb, setVerb] = useState(entry.verb);
  const [gloss, setGloss] = useState(entry.gloss);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when entry prop changes from outside
  useEffect(() => {
    setVerb(entry.verb);
    setGloss(entry.gloss);
  }, [entry.verb, entry.gloss]);

  const debouncedUpdate = useCallback(
    (updated: SpinnerEntry) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onUpdate(updated);
      }, 300);
    },
    [onUpdate]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      className={`group flex items-center gap-3 border-b border-zinc-800/50 px-4 py-1.5 transition-colors hover:bg-zinc-900 ${
        isSelected ? "bg-zinc-800/50" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        className="h-3 w-3 shrink-0 rounded border-zinc-600 bg-zinc-800 accent-emerald-500"
      />
      <input
        className="w-48 shrink-0 rounded bg-transparent px-1 py-0.5 text-sm text-zinc-200 outline-none focus:bg-zinc-800 focus:ring-1 focus:ring-emerald-500/50"
        value={verb}
        onChange={(e) => {
          setVerb(e.target.value);
          debouncedUpdate({ verb: e.target.value, gloss });
        }}
        placeholder="动词"
      />
      <input
        className="min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 text-sm text-zinc-400 outline-none focus:bg-zinc-800 focus:ring-1 focus:ring-emerald-500/50"
        value={gloss}
        onChange={(e) => {
          setGloss(e.target.value);
          debouncedUpdate({ verb, gloss: e.target.value });
        }}
        placeholder="注释（emoji + 场景描述）"
      />
      <span className="shrink-0 text-xs text-zinc-600">
        → {verb} {gloss || "(空)"}
      </span>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
        <button
          className="rounded p-0.5 text-zinc-600 hover:bg-zinc-700 hover:text-zinc-300 disabled:opacity-20"
          onClick={onMoveUp}
          disabled={isFirst}
          title="上移"
        >
          <svg width="10" height="10" viewBox="0 0 10 10"><path fill="currentColor" d="M5 2L2 6h6z"/></svg>
        </button>
        <button
          className="rounded p-0.5 text-zinc-600 hover:bg-zinc-700 hover:text-zinc-300 disabled:opacity-20"
          onClick={onMoveDown}
          disabled={isLast}
          title="下移"
        >
          <svg width="10" height="10" viewBox="0 0 10 10"><path fill="currentColor" d="M5 8L2 4h6z"/></svg>
        </button>
      </div>
      <button
        className="rounded p-1 text-zinc-600 opacity-0 hover:bg-red-900/30 hover:text-red-400 group-hover:opacity-100"
        onClick={onDelete}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
