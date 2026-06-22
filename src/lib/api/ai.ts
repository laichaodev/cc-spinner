import { invoke } from "@tauri-apps/api/core";
import type { SpinnerEntry } from "./profiles";

export const aiApi = {
  generate: (words: string[]) =>
    invoke<SpinnerEntry[]>("ai_generate", { words }),
  abort: () => invoke<void>("abort_generate"),
};
