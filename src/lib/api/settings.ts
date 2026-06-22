import { invoke } from "@tauri-apps/api/core";

export interface AppSettings {
  active_profile_id: string | null;
  theme: "light" | "dark" | "system";
  window_bounds: { x: number; y: number; width: number; height: number };
}

export const settingsApi = {
  get: () => invoke<AppSettings>("get_app_settings"),
  update: (settings: Partial<AppSettings>) =>
    invoke<AppSettings>("update_app_settings", { settings }),
};
