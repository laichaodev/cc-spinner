use crate::models::SpinnerEntry;
use crate::services::ai_generate::AiGenerateService;
use crate::AppState;
use tauri::{Emitter, State};

#[tauri::command]
pub async fn ai_generate(
    state: State<'_, AppState>,
    app_handle: tauri::AppHandle,
    words: Vec<String>,
) -> Result<Vec<SpinnerEntry>, String> {
    let env_path = state
        .paths
        .profiles_dir
        .parent()
        .unwrap()
        .join(".env");

    let api_key = if env_path.exists() {
        std::fs::read_to_string(&env_path)
            .unwrap_or_default()
            .trim()
            .to_string()
    } else {
        return Err("API_KEY_NOT_SET".to_string());
    };

    if api_key.is_empty() {
        return Err("API_KEY_NOT_SET".to_string());
    }

    let service = AiGenerateService::new(api_key);

    // Store for cancellation
    {
        let mut guard = state.ai_service.lock().map_err(|e| e.to_string())?;
        *guard = Some(AiGenerateService::new(
            std::fs::read_to_string(&env_path)
                .unwrap_or_default()
                .trim()
                .to_string(),
        ));
    }

    let _total = words.len();
    let result = service
        .generate(words, |current, total| {
            let _ = app_handle.emit(
                "ai-generate-progress",
                serde_json::json!({ "current": current, "total": total }),
            );
        })
        .await;

    // Clear
    {
        let mut guard = state.ai_service.lock().map_err(|e| e.to_string())?;
        *guard = None;
    }

    result
}

#[tauri::command]
pub fn abort_generate(state: State<AppState>) -> Result<(), String> {
    let guard = state.ai_service.lock().map_err(|e| e.to_string())?;
    if let Some(ref service) = *guard {
        service.cancel();
    }
    Ok(())
}
