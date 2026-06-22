import { useState, useCallback } from "react";
import type { Profile, SpinnerEntry } from "@/lib/api/profiles";
import { profilesApi } from "@/lib/api/profiles";
import { EditorToolbar } from "./EditorToolbar";
import { EntryTable } from "./EntryTable";
import { AIGenerateDialog } from "./AIGenerateDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
  profile: Profile | null;
  onProfileUpdated: () => void;
}

export function MainContent({ profile, onProfileUpdated }: Props) {
  const queryClient = useQueryClient();
  const [showAiDialog, setShowAiDialog] = useState(false);

  const addEntriesMutation = useMutation({
    mutationFn: ({ id, entries }: { id: string; entries: SpinnerEntry[] }) =>
      profilesApi.update(id, { entries: [...(profile?.entries ?? []), ...entries] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      onProfileUpdated();
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: ({
      id,
      index,
      entry,
    }: {
      id: string;
      index: number;
      entry: SpinnerEntry;
    }) => {
      const entries = [...(profile?.entries ?? [])];
      entries[index] = entry;
      return profilesApi.update(id, { entries });
    },
    onSuccess: onProfileUpdated,
  });

  const deleteEntriesMutation = useMutation({
    mutationFn: ({ id, indices }: { id: string; indices: number[] }) => {
      const entries = profile?.entries.filter(
        (_, i) => !indices.includes(i)
      ) ?? [];
      return profilesApi.update(id, { entries });
    },
    onSuccess: onProfileUpdated,
  });

  const reorderMutation = useMutation({
    mutationFn: ({
      id,
      from,
      to,
    }: {
      id: string;
      from: number;
      to: number;
    }) => {
      const entries = [...(profile?.entries ?? [])];
      const [entry] = entries.splice(from, 1);
      entries.splice(to, 0, entry);
      return profilesApi.update(id, { entries });
    },
    onSuccess: onProfileUpdated,
  });

  const handleModeChange = useCallback(
    (mode: "replace" | "append") => {
      if (profile) {
        profilesApi.update(profile.id, { mode }).then(onProfileUpdated);
      }
    },
    [profile, onProfileUpdated]
  );

  if (!profile) {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-500">
        选择或创建一个 Profile
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <EditorToolbar
        mode={profile.mode}
        onModeChange={handleModeChange}
        onImport={(words) =>
          addEntriesMutation.mutate({
            id: profile.id,
            entries: words.map((w) => ({ verb: w, gloss: "" })),
          })
        }
        onAiGenerate={() => setShowAiDialog(true)}
      />
      <EntryTable
        entries={profile.entries}
        onUpdate={(index, entry) =>
          updateEntryMutation.mutate({ id: profile.id, index, entry })
        }
        onDelete={(indices) =>
          deleteEntriesMutation.mutate({ id: profile.id, indices })
        }
        onReorder={(from, to) =>
          reorderMutation.mutate({ id: profile.id, from, to })
        }
      />
      {showAiDialog && (
        <AIGenerateDialog
          onClose={() => setShowAiDialog(false)}
          onAdd={(entries) => {
            addEntriesMutation.mutate({ id: profile.id, entries });
            setShowAiDialog(false);
          }}
        />
      )}
    </div>
  );
}
