use crate::models::{Profile, SpinnerEntry};
use std::fs;
use std::path::PathBuf;

pub struct ProfileService {
    profiles_dir: PathBuf,
}

impl ProfileService {
    pub fn new(profiles_dir: PathBuf) -> Self {
        Self { profiles_dir }
    }

    pub fn list(&self) -> Result<Vec<Profile>, String> {
        let mut profiles = Vec::new();
        if !self.profiles_dir.exists() {
            return Ok(profiles);
        }
        for entry in fs::read_dir(&self.profiles_dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            if path.extension().map_or(false, |ext| ext == "json") {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Ok(profile) = serde_json::from_str::<Profile>(&content) {
                        profiles.push(profile);
                    }
                }
            }
        }
        profiles.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        Ok(profiles)
    }

    pub fn get(&self, id: &str) -> Result<Profile, String> {
        let path = self.profile_path(id);
        let content = fs::read_to_string(&path).map_err(|e| format!("Profile not found: {e}"))?;
        serde_json::from_str(&content).map_err(|e| format!("Invalid profile: {e}"))
    }

    pub fn save(&self, profile: &Profile) -> Result<(), String> {
        let path = self.profile_path(&profile.id);
        let content = serde_json::to_string_pretty(profile).map_err(|e| e.to_string())?;
        // Write to temp file then rename (atomic)
        let tmp = path.with_extension("tmp");
        fs::write(&tmp, content).map_err(|e| e.to_string())?;
        fs::rename(&tmp, &path).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete(&self, id: &str) -> Result<(), String> {
        let path = self.profile_path(id);
        fs::remove_file(&path).map_err(|e| format!("Failed to delete: {e}"))
    }

    pub fn create(&self, name: &str, mode: &str) -> Result<Profile, String> {
        let id = slugify(name);
        let now = chrono::Utc::now().to_rfc3339();
        let profile = Profile {
            id,
            name: name.to_string(),
            mode: mode.to_string(),
            entries: vec![],
            created_at: now.clone(),
            updated_at: now,
        };
        self.save(&profile)?;
        Ok(profile)
    }

    fn profile_path(&self, id: &str) -> PathBuf {
        self.profiles_dir.join(format!("{id}.json"))
    }
}

pub fn slugify(name: &str) -> String {
    name.to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '-' })
        .collect::<String>()
}

pub fn format_spinner_text(entry: &SpinnerEntry) -> String {
    format!("{} {}", entry.verb, entry.gloss)
}

pub fn extract_verb(spinner_text: &str) -> &str {
    spinner_text.split(' ').next().unwrap_or(spinner_text)
}

/// Jaccard similarity between two string slices
pub fn jaccard_similarity(a: &[String], b: &[&str]) -> f64 {
    use std::collections::HashSet;
    let set_a: HashSet<&str> = a.iter().map(|s| s.as_str()).collect();
    let set_b: HashSet<&str> = b.iter().copied().collect();
    let intersection = set_a.intersection(&set_b).count();
    let union = set_a.union(&set_b).count();
    if union == 0 { 1.0 } else { intersection as f64 / union as f64 }
}
