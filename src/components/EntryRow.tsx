import { useState, useRef, useEffect, useCallback } from "react";
import type { SpinnerEntry } from "@/lib/api/profiles";
import { Trash2, GripVertical } from "lucide-react";

function formatTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface Props {
  index: number;
  entry: SpinnerEntry;
  isSelected: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onToggleSelect: () => void;
  onUpdate: (entry: SpinnerEntry) => void;
  onDelete: () => void;
  onDragStart: (e: React.MouseEvent) => void;
}

export function EntryRow({
  index,
  entry,
  isSelected,
  isDragging,
  isDragOver,
  onToggleSelect,
  onUpdate,
  onDelete,
  onDragStart,
}: Props) {
  const [verb, setVerb] = useState(entry.verb);
  const [gloss, setGloss] = useState(entry.gloss);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      data-row-index={index}
      className={`group flex items-center gap-3 border-b border-[var(--color-border-light)] px-4 py-1.5 transition-colors hover:bg-[var(--color-surface)] ${
        isSelected ? "bg-zinc-100 dark:bg-zinc-800/50" : ""
      } ${isDragging ? "opacity-40" : ""} ${
        isDragOver ? "border-t-2 border-t-emerald-400" : ""
      }`}
    >
      <div
        className="shrink-0 cursor-grab text-[var(--color-text-subtle)] opacity-0 group-hover:opacity-100 active:cursor-grabbing"
        onMouseDown={onDragStart}
      >
        <GripVertical size={14} />
      </div>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        className="h-3 w-3 shrink-0 rounded border-zinc-400 dark:border-zinc-600 bg-[var(--color-surface-hover)] accent-emerald-500"
      />
      <input
        className="w-36 shrink-0 rounded bg-transparent px-1 py-0.5 text-sm text-[var(--color-text)] outline-none focus:bg-[var(--color-surface-hover)] focus:ring-1 focus:ring-emerald-500/50"
        value={verb}
        onChange={(e) => {
          setVerb(e.target.value);
          debouncedUpdate({ verb: e.target.value, gloss });
        }}
        placeholder="动词"
      />
      <input
        className="min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 text-sm text-[var(--color-text-secondary)] outline-none focus:bg-[var(--color-surface-hover)] focus:ring-1 focus:ring-emerald-500/50"
        value={gloss}
        onChange={(e) => {
          setGloss(e.target.value);
          debouncedUpdate({ verb, gloss: e.target.value });
        }}
        placeholder="注释（emoji + 场景描述）"
      />
      <span className="w-14 shrink-0 text-right text-[10px] text-[var(--color-text-subtle)]">
        {entry.updated_at ? formatTime(entry.updated_at) : "—"}
      </span>
      <button
        className="rounded p-1 text-[var(--color-text-subtle)] opacity-0 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 group-hover:opacity-100"
        onClick={onDelete}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
