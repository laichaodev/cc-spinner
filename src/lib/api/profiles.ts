import { invoke } from "@tauri-apps/api/core";

export interface Profile {
  id: string;
  name: string;
  mode: "replace" | "append";
  entries: SpinnerEntry[];
  created_at: string;
  updated_at: string;
}

export interface SpinnerEntry {
  verb: string;
  gloss: string;
}

export const profilesApi = {
  list: () => invoke<Profile[]>("list_profiles"),
  create: (name: string, mode: string) =>
    invoke<Profile>("create_profile", { name, mode }),
  delete: (id: string) => invoke<void>("delete_profile", { id }),
  update: (id: string, profile: Partial<Profile>) =>
    invoke<Profile>("update_profile", { id, profile }),
  duplicate: (id: string, newName: string) =>
    invoke<Profile>("duplicate_profile", { id, newName }),
  import: (filePath: string) =>
    invoke<Profile>("import_profile", { filePath }),
  export: (id: string, filePath: string) =>
    invoke<void>("export_profile", { id, filePath }),
  switch: (id: string) => invoke<void>("switch_profile", { id }),
  getActive: () => invoke<Profile | null>("get_active_profile"),
};
