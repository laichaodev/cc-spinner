import { useState, useRef, useCallback } from "react";
import type { SpinnerEntry } from "@/lib/api/profiles";
import { EntryRow } from "./EntryRow";
import { Trash2 } from "lucide-react";

interface Props {
  entries: SpinnerEntry[];
  onUpdate: (index: number, entry: SpinnerEntry) => void;
  onDelete: (indices: number[]) => void;
  onReorder: (from: number, to: number) => void;
}

export function EntryTable({ entries, onUpdate, onDelete, onReorder }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const dragOverRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleSelect = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selected.size === 0) return;
    onDelete(Array.from(selected));
    setSelected(new Set());
  };

  const handleDragStart = useCallback((index: number) => {
    dragIndexRef.current = index;
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    // Find which row is under the cursor via DOM
    const target = (e.target as HTMLElement).closest('[data-row-index]');
    if (!target) return;

    const index = parseInt(target.getAttribute('data-row-index')!, 10);
    if (isNaN(index)) return;

    if (dragOverRef.current !== index) {
      dragOverRef.current = index;
      setDragOverIndex(index);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    const from = dragIndexRef.current;
    // Find drop target from DOM
    const target = (e.target as HTMLElement).closest('[data-row-index]');
    const to = target ? parseInt(target.getAttribute('data-row-index')!, 10) : null;

    if (from !== null && to !== null && from !== to) {
      onReorder(from, to);
    }

    dragIndexRef.current = null;
    dragOverRef.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
  }, [onReorder]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-1.5">
        <span className="w-36 text-[11px] font-medium text-zinc-500">VERB</span>
        <span className="flex-1 text-[11px] font-medium text-zinc-500">GLOSS</span>
        {selected.size > 0 && (
          <button
            className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-red-400 hover:bg-red-900/30"
            onClick={handleDeleteSelected}
          >
            <Trash2 size={12} />
            删除选中 ({selected.size})
          </button>
        )}
      </div>
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {entries.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-zinc-600">
            暂无词条，使用「AI 生成」或「导入 .txt」添加
          </div>
        ) : (
          entries.map((entry, i) => (
            <EntryRow
              key={i}
              index={i}
              entry={entry}
              isSelected={selected.has(i)}
              isDragging={dragIndex === i}
              isDragOver={dragOverIndex === i}
              onToggleSelect={() => toggleSelect(i)}
              onUpdate={(e) => onUpdate(i, e)}
              onDelete={() => onDelete([i])}
              onDragStart={() => handleDragStart(i)}
            />
          ))
        )}
      </div>
    </div>
  );
}
