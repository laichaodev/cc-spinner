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
    let service = AiGenerateService::new();

    // Store for cancellation
    {
        let mut guard = state.ai_service.lock().map_err(|e| e.to_string())?;
        *guard = Some(service.clone());
    }

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
