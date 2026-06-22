import type { SpinnerEntry } from "@/lib/api/profiles";
import { Trash2 } from "lucide-react";

interface Props {
  index: number;
  entry: SpinnerEntry;
  isSelected: boolean;
  onToggleSelect: () => void;
  onUpdate: (entry: SpinnerEntry) => void;
  onDelete: () => void;
}

export function EntryRow({
  entry,
  isSelected,
  onToggleSelect,
  onUpdate,
  onDelete,
}: Props) {
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
        value={entry.verb}
        onChange={(e) => onUpdate({ ...entry, verb: e.target.value })}
        placeholder="动词"
      />
      <input
        className="min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 text-sm text-zinc-400 outline-none focus:bg-zinc-800 focus:ring-1 focus:ring-emerald-500/50"
        value={entry.gloss}
        onChange={(e) => onUpdate({ ...entry, gloss: e.target.value })}
        placeholder="注释（emoji + 场景描述）"
      />
      <span className="shrink-0 text-xs text-zinc-600">
        → {entry.verb} {entry.gloss || "(空)"}
      </span>
      <button
        className="rounded p-1 text-zinc-600 opacity-0 hover:bg-red-900/30 hover:text-red-400 group-hover:opacity-100"
        onClick={onDelete}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
