import { useState, useCallback, useEffect } from "react";
import type { Profile, SpinnerEntry } from "@/lib/api/profiles";
import { profilesApi } from "@/lib/api/profiles";
import { EditorToolbar } from "./EditorToolbar";
import { EntryTable } from "./EntryTable";
import { AIGenerateDialog } from "./AIGenerateDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, X } from "lucide-react";

interface Props {
  profile: Profile | null;
  onProfileUpdated: () => void;
}

export function MainContent({ profile, onProfileUpdated }: Props) {
  const queryClient = useQueryClient();
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-clear error after 5s
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  const addEntriesMutation = useMutation({
    mutationFn: ({ id, entries }: { id: string; entries: SpinnerEntry[] }) =>
      profilesApi.addEntries(id, entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      onProfileUpdated();
    },
    onError: (e: any) => setError(String(e)),
  });

  const handleAddEntry = useCallback(
    (entry: SpinnerEntry) => {
      if (!profile) return;
      addEntriesMutation.mutate({ id: profile.id, entries: [entry] });
    },
    [profile, addEntriesMutation]
  );

  const updateEntryMutation = useMutation({
    mutationFn: ({
      id,
      index,
      entry,
    }: {
      id: string;
      index: number;
      entry: SpinnerEntry;
    }) => profilesApi.updateEntry(id, index, entry),
    onSuccess: onProfileUpdated,
    onError: (e: any) => setError(String(e)),
  });

  const deleteEntriesMutation = useMutation({
    mutationFn: ({ id, indices }: { id: string; indices: number[] }) =>
      profilesApi.deleteEntries(id, indices),
    onSuccess: onProfileUpdated,
    onError: (e: any) => setError(String(e)),
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
    }) => profilesApi.reorderEntries(id, from, to),
    onSuccess: onProfileUpdated,
    onError: (e: any) => setError(String(e)),
  });

  const handleModeChange = useCallback(
    (mode: "replace" | "append") => {
      if (profile) {
        profilesApi
          .update(profile.id, { mode })
          .then(onProfileUpdated)
          .catch((e) => setError(String(e)));
      }
    },
    [profile, onProfileUpdated]
  );

  if (!profile) {
    return (
      <div className="flex flex-1 items-center justify-center text-[var(--color-text-muted)]">
        选择或创建一个词组
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {error && (
        <div className="flex items-center gap-2 border-b border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/30 px-4 py-2">
          <AlertCircle size={14} className="text-red-600 dark:text-red-400 shrink-0" />
          <span className="flex-1 text-xs text-red-700 dark:text-red-300">{error}</span>
          <button
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            onClick={() => setError(null)}
          >
            <X size={14} />
          </button>
        </div>
      )}
      <EditorToolbar
        mode={profile.mode}
        onModeChange={handleModeChange}
        onImport={(words) =>
          addEntriesMutation.mutate({
            id: profile.id,
            entries: words.map((w) => {
              const match = w.match(/^(.+?)[：:](.+)$/);
              if (match) {
                return { verb: match[1].trim(), gloss: match[2].trim() };
              }
              return { verb: w, gloss: "" };
            }),
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
        onSetEntries={(entries) =>
          profilesApi.update(profile.id, { entries }).then(onProfileUpdated).catch((e) => setError(String(e)))
        }
        onAddEntry={handleAddEntry}
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
