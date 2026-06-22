use crate::models::Profile;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn list_profiles(state: State<AppState>) -> Result<Vec<Profile>, String> {
    state.profile_service.list()
}

#[tauri::command]
pub fn create_profile(state: State<AppState>, name: String, mode: String) -> Result<Profile, String> {
    state.profile_service.create(&name, &mode)
}

#[tauri::command]
pub fn delete_profile(state: State<AppState>, id: String) -> Result<(), String> {
    state.profile_service.delete(&id)
}

#[tauri::command]
pub fn update_profile(state: State<AppState>, id: String, profile: Profile) -> Result<Profile, String> {
    let existing = state.profile_service.get(&id)?;
    let updated = Profile {
        id: existing.id,
        created_at: existing.created_at,
        updated_at: chrono::Utc::now().to_rfc3339(),
        ..profile
    };
    state.profile_service.save(&updated)?;
    Ok(updated)
}

#[tauri::command]
pub fn duplicate_profile(state: State<AppState>, id: String, new_name: String) -> Result<Profile, String> {
    let existing = state.profile_service.get(&id)?;
    let slug = crate::services::profile::slugify(&new_name);
    state.profile_service.create(&new_name, &existing.mode)?;
    let new = state.profile_service.get(&slug)?;
    let updated = Profile {
        entries: existing.entries,
        ..new
    };
    state.profile_service.save(&updated)?;
    Ok(updated)
}

#[tauri::command]
pub fn import_profile(state: State<AppState>, file_path: String) -> Result<Profile, String> {
    let content = std::fs::read_to_string(&file_path).map_err(|e| format!("Cannot read file: {e}"))?;
    let profile: Profile = serde_json::from_str(&content).map_err(|e| format!("Invalid profile JSON: {e}"))?;
    state.profile_service.save(&profile)?;
    Ok(profile)
}

#[tauri::command]
pub fn export_profile(state: State<AppState>, id: String, file_path: String) -> Result<(), String> {
    let profile = state.profile_service.get(&id)?;
    let content = serde_json::to_string_pretty(&profile).map_err(|e| e.to_string())?;
    std::fs::write(&file_path, content).map_err(|e| format!("Cannot write: {e}"))
}
