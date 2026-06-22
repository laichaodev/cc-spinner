use crate::models::{Profile, SpinnerVerbsConfig};
use crate::services::profile::format_spinner_text;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn switch_profile(state: State<AppState>, id: String) -> Result<(), String> {
    let profile = state.profile_service.get(&id)?;

    let config = SpinnerVerbsConfig {
        mode: profile.mode.clone(),
        verbs: profile.entries.iter().map(format_spinner_text).collect(),
    };

    state.spinner_config_service.write(&config)?;

    let mut app_settings = state.read_app_settings()?;
    app_settings.active_profile_id = Some(id);
    state.write_app_settings(&app_settings)?;

    Ok(())
}

#[tauri::command]
pub fn get_active_profile(state: State<AppState>) -> Result<Option<Profile>, String> {
    let app_settings = state.read_app_settings()?;
    match app_settings.active_profile_id {
        Some(id) => state.profile_service.get(&id).map(Some),
        None => Ok(None),
    }
}
