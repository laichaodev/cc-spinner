mod commands;
mod models;
mod services;

use models::AppSettings;
use services::ai_generate::AiGenerateService;
use services::profile::ProfileService;
use services::profile::format_spinner_text;
use services::spinner_config::SpinnerConfigService;
use services::AppPaths;
use crate::models::SpinnerVerbsConfig;
use std::sync::Mutex;
use tauri::Manager;

pub struct AppState {
    pub profile_service: ProfileService,
    pub spinner_config_service: SpinnerConfigService,
    pub ai_service: Mutex<Option<AiGenerateService>>,
    pub paths: AppPaths,
}

impl AppState {
    pub fn new() -> Self {
        let paths = AppPaths::new();
        paths.ensure_dirs().expect("Failed to create app directories");

        Self {
            profile_service: ProfileService::new(paths.profiles_dir.clone()),
            spinner_config_service: SpinnerConfigService::new(
                paths.settings_path.clone(),
                paths.backup_dir.clone(),
            ),
            ai_service: Mutex::new(None),
            paths,
        }
    }

    pub fn read_app_settings(&self) -> Result<AppSettings, String> {
        if self.paths.app_settings_path.exists() {
            let content = std::fs::read_to_string(&self.paths.app_settings_path)
                .map_err(|e| e.to_string())?;
            serde_json::from_str(&content).map_err(|e| format!("Invalid app settings: {e}"))
        } else {
            Ok(AppSettings::default())
        }
    }

    /// If profile_id matches the active profile, sync entries to ~/.claude/settings.json
    pub fn sync_active_profile(&self, profile_id: &str) -> Result<(), String> {
        let app_settings = self.read_app_settings()?;
        if let Some(ref active_id) = app_settings.active_profile_id {
            if active_id == profile_id {
                let profile = self.profile_service.get(profile_id)?;
                let config = SpinnerVerbsConfig {
                    mode: profile.mode.clone(),
                    verbs: profile.entries.iter().map(format_spinner_text).collect(),
                };
                self.spinner_config_service.write(&config)?;
            }
        }
        Ok(())
    }

    pub fn write_app_settings(&self, settings: &AppSettings) -> Result<(), String> {
        let content = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
        let tmp = self.paths.app_settings_path.with_extension("tmp");
        std::fs::write(&tmp, content).map_err(|e| e.to_string())?;
        std::fs::rename(&tmp, &self.paths.app_settings_path).map_err(|e| e.to_string())?;
        Ok(())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let state = AppState::new();

            // Try to restore active profile on startup
            if let Ok(app_settings) = state.read_app_settings() {
                if let Some(ref profile_id) = app_settings.active_profile_id {
                    let _ = state.profile_service.get(profile_id);
                    let _ = state.sync_active_profile(profile_id);
                }
            }

            app.manage(state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_profiles,
            commands::create_profile,
            commands::delete_profile,
            commands::update_profile,
            commands::duplicate_profile,
            commands::import_profile,
            commands::export_profile,
            commands::add_entries,
            commands::update_entry,
            commands::delete_entries,
            commands::reorder_entries,
            commands::import_words,
            commands::switch_profile,
            commands::get_active_profile,
            commands::ai_generate,
            commands::abort_generate,
            commands::get_app_settings,
            commands::update_app_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
