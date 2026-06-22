import { useState } from "react";
import { Plus } from "lucide-react";
import type { Profile } from "@/lib/api/profiles";
import { ProfileItem } from "./ProfileItem";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profilesApi } from "@/lib/api/profiles";

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
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");

  const createMutation = useMutation({
    mutationFn: () => profilesApi.create(newName, "append"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setNewName("");
    },
  });

  return (
    <div className="flex w-56 flex-col border-r border-zinc-800 bg-zinc-900">
      <div className="flex-1 overflow-y-auto p-2">
        {profiles.map((p) => (
          <ProfileItem
            key={p.id}
            profile={p}
            isActive={p.id === activeProfileId}
            isSelected={p.id === selectedProfileId}
            onSelect={() => onSelect(p.id)}
            onSwitch={() => onSwitch(p.id)}
          />
        ))}
        {profiles.length === 0 && (
          <p className="px-3 py-4 text-xs text-zinc-500">暂无 Profile，点击下方按钮创建</p>
        )}
      </div>
      <div className="border-t border-zinc-800 p-2">
        <input
          className="w-full rounded bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="Profile 名称"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newName.trim()) {
              createMutation.mutate();
            }
          }}
        />
        <button
          className="mt-1 flex w-full items-center justify-center gap-1 rounded bg-zinc-800 py-1.5 text-xs text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
          onClick={() => newName.trim() && createMutation.mutate()}
          disabled={createMutation.isPending}
        >
          <Plus size={14} />
          新建
        </button>
      </div>
    </div>
  );
}
