use crate::models::{Profile, SpinnerEntry};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn add_entries(
    state: State<AppState>,
    profile_id: String,
    entries: Vec<SpinnerEntry>,
) -> Result<Profile, String> {
    let now = chrono::Utc::now().to_rfc3339();
    let mut profile = state.profile_service.get(&profile_id)?;
    let stamped: Vec<SpinnerEntry> = entries
        .into_iter()
        .map(|mut e| {
            e.updated_at = Some(now.clone());
            e
        })
        .collect();
    profile.entries.extend(stamped);
    profile.updated_at = now;
    state.profile_service.save(&profile)?;
    state.sync_active_profile(&profile_id)?;
    Ok(profile)
}

#[tauri::command]
pub fn update_entry(
    state: State<AppState>,
    profile_id: String,
    index: usize,
    entry: SpinnerEntry,
) -> Result<Profile, String> {
    let mut profile = state.profile_service.get(&profile_id)?;
    if index >= profile.entries.len() {
        return Err("Index out of bounds".to_string());
    }
    let mut entry = entry;
    entry.updated_at = Some(chrono::Utc::now().to_rfc3339());
    profile.entries[index] = entry;
    profile.updated_at = chrono::Utc::now().to_rfc3339();
    state.profile_service.save(&profile)?;
    state.sync_active_profile(&profile_id)?;
    Ok(profile)
}

#[tauri::command]
pub fn delete_entries(
    state: State<AppState>,
    profile_id: String,
    indices: Vec<usize>,
) -> Result<Profile, String> {
    let mut profile = state.profile_service.get(&profile_id)?;
    // Remove in reverse order to maintain indices
    let mut sorted: Vec<usize> = indices.clone();
    sorted.sort();
    sorted.reverse();
    for i in sorted {
        if i < profile.entries.len() {
            profile.entries.remove(i);
        }
    }
    profile.updated_at = chrono::Utc::now().to_rfc3339();
    state.profile_service.save(&profile)?;
    state.sync_active_profile(&profile_id)?;
    Ok(profile)
}

#[tauri::command]
pub fn reorder_entries(
    state: State<AppState>,
    profile_id: String,
    from_index: usize,
    to_index: usize,
) -> Result<Profile, String> {
    let mut profile = state.profile_service.get(&profile_id)?;
    if from_index >= profile.entries.len() || to_index >= profile.entries.len() {
        return Err("Index out of bounds".to_string());
    }
    let entry = profile.entries.remove(from_index);
    profile.entries.insert(to_index, entry);
    profile.updated_at = chrono::Utc::now().to_rfc3339();
    state.profile_service.save(&profile)?;
    state.sync_active_profile(&profile_id)?;
    Ok(profile)
}

#[tauri::command]
pub fn import_words(
    state: State<AppState>,
    profile_id: String,
    file_path: String,
) -> Result<Profile, String> {
    let content = std::fs::read_to_string(&file_path).map_err(|e| format!("Cannot read file: {e}"))?;
    let words: Vec<String> = content
        .lines()
        .map(|l| l.trim().to_string())
        .filter(|l| !l.is_empty())
        .collect();
    let now = chrono::Utc::now().to_rfc3339();
    let entries: Vec<SpinnerEntry> = words
        .into_iter()
        .map(|verb| SpinnerEntry {
            verb,
            gloss: String::new(),
            updated_at: Some(now.clone()),
        })
        .collect();
    let mut profile = state.profile_service.get(&profile_id)?;
    profile.entries.extend(entries);
    profile.updated_at = chrono::Utc::now().to_rfc3339();
    state.profile_service.save(&profile)?;
    state.sync_active_profile(&profile_id)?;
    Ok(profile)
}
