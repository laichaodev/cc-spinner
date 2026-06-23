import { useState, useRef, useEffect } from "react";
import type { Profile } from "@/lib/api/profiles";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profilesApi } from "@/lib/api/profiles";
import { useT } from "@/lib/i18n/context";
import { Trash2, Copy, GripVertical } from "lucide-react";

interface Props {
  profile: Profile;
  isActive: boolean;
  isSelected: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onSelect: () => void;
  onSwitch: () => void;
  onRename: (newName: string) => void;
  onDragStart: (e: React.MouseEvent) => void;
  onError?: (msg: string) => void;
}

export function ProfileItem({
  profile,
  isActive,
  isSelected,
  isDragging,
  isDragOver,
  onSelect,
  onSwitch,
  onRename,
  onDragStart,
  onError,
}: Props) {
  const { t, lang } = useT();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const deleteMutation = useMutation({
    mutationFn: () => profilesApi.delete(profile.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profiles"] }),
    onError: (e: any) => onError?.(String(e)),
  });

  const dupMutation = useMutation({
    mutationFn: () => profilesApi.duplicate(profile.id, t("profile.duplicate", { name: profile.name })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profiles"] }),
    onError: (e: any) => onError?.(String(e)),
  });

  const handleFinishEdit = () => {
    setEditing(false);
    if (editName.trim() && editName.trim() !== profile.name) {
      onRename(editName.trim());
    } else {
      setEditName(profile.name);
    }
  };

  return (
    <div
      className={`group flex cursor-pointer items-center gap-1 rounded px-2 py-1.5 text-sm transition-colors ${
        isSelected
          ? "bg-[var(--color-surface-active)] text-zinc-950"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
      } ${isDragging ? "opacity-40" : ""} ${
        isDragOver ? "border-t-2 border-t-emerald-400" : ""
      }`}
      onClick={onSelect}
      onDoubleClick={() => { setEditing(true); setEditName(profile.name); }}
    >
      <div
        className="shrink-0 cursor-grab text-[var(--color-text-subtle)] opacity-0 group-hover:opacity-50"
        onMouseDown={onDragStart}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={12} />
      </div>
      {editing ? (
        <input
          ref={inputRef}
          className="flex-1 w-0 rounded bg-[var(--color-surface)] px-1 py-0 text-sm outline-none ring-1 ring-emerald-500"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleFinishEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleFinishEdit();
            if (e.key === "Escape") { setEditing(false); setEditName(profile.name); }
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="truncate flex-1">{profile.name}</span>
      )}
      {isActive && (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
      )}
      <span className="text-[10px] text-[var(--color-text-subtle)]">
        {profile.mode === "replace" ? t("profile.mode.replace") : t("profile.mode.append")}
      </span>
      <span className="text-[10px] text-[var(--color-text-subtle)]">{profile.entries.length}{lang === "zh" ? "词" : ""}</span>
      <div className="hidden gap-1 group-hover:flex">
        {!isActive && (
          <button
            className="rounded px-1 text-[10px] text-emerald-500 hover:bg-[var(--color-surface-active)]"
            onClick={(e) => {
              e.stopPropagation();
              onSwitch();
            }}
          >
            {t("profile.activate")}
          </button>
        )}
        <button
          className="rounded p-0.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-active)] hover:text-zinc-800"
          onClick={(e) => {
            e.stopPropagation();
            dupMutation.mutate();
          }}
        >
          <Copy size={12} />
        </button>
        <button
          className="rounded p-0.5 text-[var(--color-text-muted)] hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
          onClick={(e) => {
            e.stopPropagation();
            deleteMutation.mutate();
          }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
