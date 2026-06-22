use crate::models::SpinnerVerbsConfig;
use std::fs;
use std::path::PathBuf;

pub struct SpinnerConfigService {
    settings_path: PathBuf,
    backup_dir: PathBuf,
}

impl SpinnerConfigService {
    pub fn new(settings_path: PathBuf, backup_dir: PathBuf) -> Self {
        Self { settings_path, backup_dir }
    }

    /// Read spinnerVerbs from ~/.claude/settings.json
    pub fn read(&self) -> Result<Option<SpinnerVerbsConfig>, String> {
        if !self.settings_path.exists() {
            return Ok(None);
        }
        let content = fs::read_to_string(&self.settings_path).map_err(|e| e.to_string())?;
        let settings: serde_json::Value =
            serde_json::from_str(&content).map_err(|e| format!("Invalid JSON: {e}"))?;
        if let Some(sv) = settings.get("spinnerVerbs") {
            let config: SpinnerVerbsConfig =
                serde_json::from_value(sv.clone()).map_err(|e| format!("Invalid spinnerVerbs: {e}"))?;
            Ok(Some(config))
        } else {
            Ok(None)
        }
    }

    /// Write spinnerVerbs to ~/.claude/settings.json (atomic)
    pub fn write(&self, config: &SpinnerVerbsConfig) -> Result<(), String> {
        // Backup current file if it exists
        if self.settings_path.exists() {
            self.backup()?;
        }

        // Read existing settings or create empty
        let mut settings: serde_json::Value = if self.settings_path.exists() {
            let content = fs::read_to_string(&self.settings_path).map_err(|e| e.to_string())?;
            serde_json::from_str(&content).unwrap_or(serde_json::json!({}))
        } else {
            serde_json::json!({})
        };

        // Update spinnerVerbs
        settings["spinnerVerbs"] = serde_json::to_value(config).map_err(|e| e.to_string())?;

        // Atomic write
        let content = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
        let tmp = self.settings_path.with_extension("tmp");
        fs::write(&tmp, content).map_err(|e| e.to_string())?;
        fs::rename(&tmp, &self.settings_path).map_err(|e| e.to_string())?;

        Ok(())
    }

    fn backup(&self) -> Result<(), String> {
        let ts = chrono::Local::now().format("%Y%m%d-%H%M%S");
        let backup_path = self.backup_dir.join(format!("settings-{ts}.bak.json"));
        fs::copy(&self.settings_path, &backup_path).map_err(|e| e.to_string())?;

        // Rotate: keep only last 10
        let mut backups: Vec<_> = fs::read_dir(&self.backup_dir)
            .map_err(|e| e.to_string())?
            .filter_map(|e| e.ok())
            .filter(|e| e.path().extension().map_or(false, |ext| ext == "json"))
            .collect();
        backups.sort_by_key(|e| e.metadata().and_then(|m| m.modified()).unwrap_or(std::time::UNIX_EPOCH));
        if backups.len() > 10 {
            for entry in backups.iter().take(backups.len() - 10) {
                let _ = fs::remove_file(entry.path());
            }
        }
        Ok(())
    }
}
