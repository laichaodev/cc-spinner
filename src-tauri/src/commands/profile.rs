use crate::models::{Profile, SpinnerEntry};
use crate::AppState;
use serde::Deserialize;
use tauri::State;

#[derive(Debug, Deserialize)]
pub struct UpdateProfilePayload {
    name: Option<String>,
    mode: Option<String>,
    entries: Option<Vec<SpinnerEntry>>,
    sort_order: Option<i32>,
}

#[tauri::command]
pub fn list_profiles(state: State<AppState>) -> Result<Vec<Profile>, String> {
    state.profile_service.list()
}

#[tauri::command]
pub fn create_profile(state: State<AppState>, name: String, mode: String) -> Result<Profile, String> {
    // New profiles go to the end (highest sort_order + 1)
    let max_order = state.profile_service.list()?.iter().map(|p| p.sort_order).max().unwrap_or(0);
    state.profile_service.create_with_order(&name, &mode, max_order + 1)
}

#[tauri::command]
pub fn delete_profile(state: State<AppState>, id: String) -> Result<(), String> {
    state.profile_service.delete(&id)
}

#[tauri::command]
pub fn update_profile(state: State<AppState>, id: String, profile: UpdateProfilePayload) -> Result<Profile, String> {
    let existing = state.profile_service.get(&id)?;
    let updated = Profile {
        id: existing.id,
        name: profile.name.unwrap_or(existing.name),
        mode: profile.mode.unwrap_or(existing.mode),
        entries: profile.entries.unwrap_or(existing.entries),
        sort_order: profile.sort_order.unwrap_or(existing.sort_order),
        created_at: existing.created_at,
        updated_at: chrono::Utc::now().to_rfc3339(),
    };
    state.profile_service.save(&updated)?;
    state.sync_active_profile(&id)?;
    Ok(updated)
}

#[tauri::command]
pub fn rename_profile(state: State<AppState>, id: String, new_name: String) -> Result<Profile, String> {
    let existing = state.profile_service.get(&id)?;
    let updated = Profile {
        name: new_name,
        updated_at: chrono::Utc::now().to_rfc3339(),
        ..existing
    };
    state.profile_service.save(&updated)?;
    state.sync_active_profile(&id)?;
    Ok(updated)
}

#[tauri::command]
pub fn reorder_profiles(state: State<AppState>, ids: Vec<String>) -> Result<(), String> {
    for (i, id) in ids.iter().enumerate() {
        let mut profile = state.profile_service.get(id)?;
        profile.sort_order = i as i32;
        profile.updated_at = chrono::Utc::now().to_rfc3339();
        state.profile_service.save(&profile)?;
    }
    Ok(())
}

#[tauri::command]
pub fn duplicate_profile(state: State<AppState>, id: String, new_name: String) -> Result<Profile, String> {
    let existing = state.profile_service.get(&id)?;
    let base_slug = crate::services::profile::slugify(&new_name);

    // Avoid collision: append -2, -3, ... if slug already exists
    let mut slug = base_slug.clone();
    if state.profile_service.exists(&slug) {
        let mut n = 2;
        loop {
            let candidate = format!("{}-{}", base_slug, n);
            if !state.profile_service.exists(&candidate) {
                slug = candidate;
                break;
            }
            n += 1;
        }
    }

    let now = chrono::Utc::now().to_rfc3339();
    let max_order = state.profile_service.list()?.iter().map(|p| p.sort_order).max().unwrap_or(0);
    let new_profile = Profile {
        id: slug,
        name: new_name,
        mode: existing.mode.clone(),
        entries: existing.entries,
        sort_order: max_order + 1,
        created_at: now.clone(),
        updated_at: now,
    };
    state.profile_service.save(&new_profile)?;
    Ok(new_profile)
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
