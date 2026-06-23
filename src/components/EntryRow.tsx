import { useState, useRef, useEffect, useCallback } from "react";
import type { SpinnerEntry } from "@/lib/api/profiles";
import { Trash2, GripVertical } from "lucide-react";

interface Props {
  index: number;
  entry: SpinnerEntry;
  isSelected: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onToggleSelect: () => void;
  onUpdate: (entry: SpinnerEntry) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

export function EntryRow({
  entry,
  isSelected,
  isDragging,
  isDragOver,
  onToggleSelect,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
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
      className={`group flex items-center gap-3 border-b border-zinc-800/50 px-4 py-1.5 transition-colors hover:bg-zinc-900 ${
        isSelected ? "bg-zinc-800/50" : ""
      } ${isDragging ? "opacity-40" : ""} ${isDragOver ? "border-t-2 border-t-emerald-400" : ""}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      onDragEnd={onDragEnd}
    >
      <div className="shrink-0 cursor-grab text-zinc-600 opacity-0 group-hover:opacity-100 active:cursor-grabbing">
        <GripVertical size={14} />
      </div>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        className="h-3 w-3 shrink-0 rounded border-zinc-600 bg-zinc-800 accent-emerald-500"
      />
      <input
        className="w-36 shrink-0 rounded bg-transparent px-1 py-0.5 text-sm text-zinc-200 outline-none focus:bg-zinc-800 focus:ring-1 focus:ring-emerald-500/50"
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
      <button
        className="rounded p-1 text-zinc-600 opacity-0 hover:bg-red-900/30 hover:text-red-400 group-hover:opacity-100"
        onClick={onDelete}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
