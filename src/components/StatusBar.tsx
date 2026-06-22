import type { Profile } from "@/lib/api/profiles";

interface Props {
  activeProfile: Profile | null;
}

export function StatusBar({ activeProfile }: Props) {
  return (
    <div className="flex h-7 items-center justify-between border-t border-zinc-800 bg-zinc-900 px-4 select-none">
      <div className="flex items-center gap-2 text-[11px] text-zinc-600">
        {activeProfile ? (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-zinc-400">{activeProfile.name}</span>
            <span>·</span>
            <span>{activeProfile.entries.length} 词条</span>
            <span>·</span>
            <span>{activeProfile.mode === "replace" ? "替换模式" : "追加模式"}</span>
          </>
        ) : (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
            <span>未激活</span>
          </>
        )}
      </div>
      <span className="text-[11px] text-zinc-700">~/.claude/settings.json</span>
    </div>
  );
}
