use crate::models::AppSettings;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn get_app_settings(state: State<AppState>) -> Result<AppSettings, String> {
    state.read_app_settings()
}

#[tauri::command]
pub fn update_app_settings(
    state: State<AppState>,
    settings: AppSettings,
) -> Result<AppSettings, String> {
    state.write_app_settings(&settings)?;
    Ok(settings)
}
