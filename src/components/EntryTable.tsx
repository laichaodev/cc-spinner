import { useState, useRef, useCallback, useEffect } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleSelect = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const allSelected = entries.length > 0 && selected.size === entries.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(entries.map((_, i) => i)));
    }
  };

  const handleDeleteSelected = () => {
    if (selected.size === 0) return;
    onDelete(Array.from(selected));
    setSelected(new Set());
  };

  const handleMouseDown = useCallback((index: number, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();

    const container = containerRef.current;
    if (!container) return;

    const rows = container.querySelectorAll('[data-row-index]');
    let lastClientY = e.clientY;

    setDragIndex(index);

    const onMouseMove = (ev: MouseEvent) => {
      lastClientY = ev.clientY;
      ev.preventDefault();

      let targetIndex = index;
      let minDist = Infinity;

      rows.forEach((row) => {
        const rect = row.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const dist = Math.abs(ev.clientY - midY);
        if (dist < minDist) {
          minDist = dist;
          const idx = parseInt(row.getAttribute('data-row-index')!, 10);
          if (!isNaN(idx)) targetIndex = idx;
        }
      });

      setDragOverIndex(targetIndex !== index ? targetIndex : null);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      let targetIndex = index;
      let minDist = Infinity;
      rows.forEach((row) => {
        const rect = row.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const dist = Math.abs(lastClientY - midY);
        if (dist < minDist) {
          minDist = dist;
          const idx = parseInt(row.getAttribute('data-row-index')!, 10);
          if (!isNaN(idx)) targetIndex = idx;
        }
      });

      if (targetIndex !== index) {
        onReorder(index, targetIndex);
      }

      setDragIndex(null);
      setDragOverIndex(null);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [onReorder]);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      setDragIndex(null);
      setDragOverIndex(null);
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-1.5">
        {/* Grip handle spacer */}
        <div className="w-[14px] shrink-0" />
        {/* Select all checkbox */}
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleSelectAll}
          className="h-3 w-3 shrink-0 rounded border-zinc-400 dark:border-zinc-600 bg-[var(--color-surface-hover)] accent-emerald-500"
        />
        <span className="w-36 text-[11px] font-medium text-[var(--color-text-muted)]">VERB</span>
        <span className="flex-1 text-[11px] font-medium text-[var(--color-text-muted)]">GLOSS</span>
        {selected.size > 0 && (
          <button
            className="flex shrink-0 items-center gap-1 rounded px-2 py-0.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
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
      >
        {entries.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-[var(--color-text-subtle)]">
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
              onDragStart={(e) => handleMouseDown(i, e)}
            />
          ))
        )}
      </div>
    </div>
  );
}
