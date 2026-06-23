use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Profile {
    pub id: String,
    pub name: String,
    pub mode: String,
    pub entries: Vec<SpinnerEntry>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default)]
    pub sort_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpinnerEntry {
    pub verb: String,
    pub gloss: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpinnerVerbsConfig {
    pub mode: String,
    pub verbs: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub active_profile_id: Option<String>,
    pub theme: String,
    pub window_bounds: WindowBounds,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowBounds {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            active_profile_id: None,
            theme: "light".to_string(),
            window_bounds: WindowBounds {
                x: 100,
                y: 100,
                width: 900,
                height: 640,
            },
        }
    }
}
