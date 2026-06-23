import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profilesApi } from "@/lib/api/profiles";
import { TitleBar } from "@/components/TitleBar";
import { Sidebar } from "@/components/Sidebar";
import { MainContent } from "@/components/MainContent";
import { StatusBar } from "@/components/StatusBar";

export default function App() {
  const queryClient = useQueryClient();
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: profilesApi.list,
  });

  const { data: activeProfile } = useQuery({
    queryKey: ["activeProfile"],
    queryFn: profilesApi.getActive,
  });

  const switchMutation = useMutation({
    mutationFn: profilesApi.switch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeProfile"] });
    },
  });

  const handleSelectProfile = useCallback(
    (id: string) => {
      setActiveProfileId(id);
    },
    []
  );

  const handleSwitchProfile = useCallback(
    (id: string) => {
      switchMutation.mutate(id);
    },
    [switchMutation]
  );

  const selectedProfile = profiles.find((p) => p.id === activeProfileId);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-bg)] text-[var(--color-text-secondary)]">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          profiles={profiles}
          activeProfileId={activeProfile?.id ?? null}
          selectedProfileId={activeProfileId}
          onSelect={handleSelectProfile}
          onSwitch={handleSwitchProfile}
        />
        <MainContent
          profile={selectedProfile ?? null}
          onProfileUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ["profiles"] });
            queryClient.invalidateQueries({ queryKey: ["activeProfile"] });
          }}
        />
      </div>
      <StatusBar activeProfile={activeProfile ?? null} />
    </div>
  );
}
