import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, AlertCircle, X } from "lucide-react";
import type { Profile } from "@/lib/api/profiles";
import { ProfileItem } from "./ProfileItem";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profilesApi } from "@/lib/api/profiles";
import { useT } from "@/lib/i18n/context";

interface Props {
  profiles: Profile[];
  activeProfileId: string | null;
  selectedProfileId: string | null;
  onSelect: (id: string) => void;
  onSwitch: (id: string) => void;
}

export function Sidebar({
  profiles,
  activeProfileId,
  selectedProfileId,
  onSelect,
  onSwitch,
}: Props) {
  const { t } = useT();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!error) return;
    const tmr = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(tmr);
  }, [error]);

  const createMutation = useMutation({
    mutationFn: () => profilesApi.create(newName, "append"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setNewName("");
    },
    onError: (e: any) => setError(String(e)),
  });

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => profilesApi.reorder(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profiles"] }),
  });

  const handleDragStart = useCallback((index: number, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();

    const container = containerRef.current;
    if (!container) return;

    const rows = container.querySelectorAll('[data-profile-index]');
    let lastClientY = e.clientY;

    setDragIndex(index);

    const onMouseMove = (ev: MouseEvent) => {
      lastClientY = ev.clientY;
      ev.preventDefault();

      let target = index;
      let minDist = Infinity;
      rows.forEach((row) => {
        const rect = row.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const dist = Math.abs(ev.clientY - midY);
        if (dist < minDist) {
          minDist = dist;
          const idx = parseInt(row.getAttribute('data-profile-index')!, 10);
          if (!isNaN(idx)) target = idx;
        }
      });
      setDragOverIndex(target !== index ? target : null);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      let target = index;
      let minDist = Infinity;
      rows.forEach((row) => {
        const rect = row.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const dist = Math.abs(lastClientY - midY);
        if (dist < minDist) {
          minDist = dist;
          const idx = parseInt(row.getAttribute('data-profile-index')!, 10);
          if (!isNaN(idx)) target = idx;
        }
      });

      if (target !== index) {
        const newProfiles = [...profiles];
        const [item] = newProfiles.splice(index, 1);
        newProfiles.splice(target, 0, item);
        reorderMutation.mutate(newProfiles.map((p) => p.id));
      }

      setDragIndex(null);
      setDragOverIndex(null);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [profiles, reorderMutation]);

  const handleRename = useCallback((id: string, newName: string) => {
    if (!newName.trim()) return;
    profilesApi.rename(id, newName.trim()).then(() => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["activeProfile"] });
    }).catch((e) => setError(String(e)));
  }, []);

  return (
    <div className="flex w-56 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      {error && (
        <div className="flex items-center gap-1.5 border-b border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/30 px-2 py-1.5">
          <AlertCircle size={12} className="text-red-600 dark:text-red-400 shrink-0" />
          <span className="flex-1 text-[10px] text-red-700 dark:text-red-300 truncate">{error}</span>
          <button className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300" onClick={() => setError(null)}>
            <X size={12} />
          </button>
        </div>
      )}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-2">
        {profiles.map((p, i) => (
          <div key={p.id} data-profile-index={i}>
            <ProfileItem
              profile={p}
              isActive={p.id === activeProfileId}
              isSelected={p.id === selectedProfileId}
              isDragging={dragIndex === i}
              isDragOver={dragOverIndex === i}
              onSelect={() => onSelect(p.id)}
              onSwitch={() => onSwitch(p.id)}
              onRename={(newName) => handleRename(p.id, newName)}
              onDragStart={(e) => handleDragStart(i, e)}
              onError={(msg) => setError(msg)}
            />
          </div>
        ))}
        {profiles.length === 0 && (
          <p className="px-3 py-4 text-xs text-[var(--color-text-muted)]">{t("sidebar.empty")}</p>
        )}
      </div>
      <div className="border-t border-[var(--color-border)] p-2">
        <input
          className="w-full rounded bg-[var(--color-surface-hover)] px-2 py-1.5 text-xs text-[var(--color-text)] placeholder-zinc-500 outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder={t("sidebar.placeholder")}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newName.trim()) {
              createMutation.mutate();
            }
          }}
        />
        <button
          className="mt-1 flex w-full items-center justify-center gap-1 rounded bg-[var(--color-surface-hover)] py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-active)] hover:text-[var(--color-text)]"
          onClick={() => newName.trim() && createMutation.mutate()}
          disabled={createMutation.isPending}
        >
          <Plus size={14} />
          {t("sidebar.create")}
        </button>
      </div>
    </div>
  );
}
