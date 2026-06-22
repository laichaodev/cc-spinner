export function TitleBar() {
  return (
    <div className="flex h-10 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 select-none">
      <div className="flex items-center gap-2">
        <span className="text-lg">🎯</span>
        <span className="text-sm font-semibold text-zinc-200">CC Spinner</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-xs text-zinc-500">CLI</span>
      </div>
    </div>
  );
}
