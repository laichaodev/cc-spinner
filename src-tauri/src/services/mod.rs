pub mod ai_generate;
pub mod profile;
pub mod spinner_config;

use std::path::PathBuf;

pub struct AppPaths {
    pub profiles_dir: PathBuf,
    pub settings_path: PathBuf,
    pub app_settings_path: PathBuf,
    pub backup_dir: PathBuf,
}

impl AppPaths {
    pub fn new() -> Self {
        let home = dirs_fallback();
        let cc_spinner = home.join(".cc-spinner");
        Self {
            profiles_dir: cc_spinner.join("profiles"),
            settings_path: home.join(".claude").join("settings.json"),
            app_settings_path: cc_spinner.join("settings.json"),
            backup_dir: cc_spinner.join("backups"),
        }
    }

    pub fn ensure_dirs(&self) -> std::io::Result<()> {
        std::fs::create_dir_all(&self.profiles_dir)?;
        std::fs::create_dir_all(&self.backup_dir)?;
        if let Some(parent) = self.settings_path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        Ok(())
    }
}

fn dirs_fallback() -> PathBuf {
    std::env::var("HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("."))
}
