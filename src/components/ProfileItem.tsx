import type { Profile } from "@/lib/api/profiles";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profilesApi } from "@/lib/api/profiles";
import { Trash2, Copy } from "lucide-react";

interface Props {
  profile: Profile;
  isActive: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onSwitch: () => void;
  onError?: (msg: string) => void;
}

export function ProfileItem({
  profile,
  isActive,
  isSelected,
  onSelect,
  onSwitch,
  onError,
}: Props) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => profilesApi.delete(profile.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profiles"] }),
    onError: (e: any) => onError?.(String(e)),
  });

  const dupMutation = useMutation({
    mutationFn: () => profilesApi.duplicate(profile.id, `${profile.name} (副本)`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profiles"] }),
    onError: (e: any) => onError?.(String(e)),
  });

  return (
    <div
      className={`group flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
        isSelected
          ? "bg-zinc-700 text-zinc-100"
          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
      }`}
      onClick={onSelect}
    >
      <span className="truncate flex-1">{profile.name}</span>
      {isActive && (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
      )}
      <span className="text-[10px] text-zinc-600">
        {profile.mode === "replace" ? "替换" : "追加"}
      </span>
      <span className="text-[10px] text-zinc-600">{profile.entries.length}词</span>
      <div className="hidden gap-1 group-hover:flex">
        {!isActive && (
          <button
            className="rounded px-1 text-[10px] text-emerald-500 hover:bg-zinc-600"
            onClick={(e) => {
              e.stopPropagation();
              onSwitch();
            }}
          >
            激活
          </button>
        )}
        <button
          className="rounded p-0.5 text-zinc-500 hover:bg-zinc-600 hover:text-zinc-300"
          onClick={(e) => {
            e.stopPropagation();
            dupMutation.mutate();
          }}
        >
          <Copy size={12} />
        </button>
        <button
          className="rounded p-0.5 text-zinc-500 hover:bg-red-900 hover:text-red-400"
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
