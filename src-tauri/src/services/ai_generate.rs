use crate::models::SpinnerEntry;
use serde::Deserialize;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

#[derive(Debug, Deserialize)]
struct AiResponseEntry {
    verb: String,
    gloss: String,
}

#[derive(Clone)]
pub struct AiGenerateService {
    pub(crate) cancelled: Arc<AtomicBool>,
}

impl AiGenerateService {
    pub fn new() -> Self {
        Self {
            cancelled: Arc::new(AtomicBool::new(false)),
        }
    }

    pub fn cancel(&self) {
        self.cancelled.store(true, Ordering::SeqCst);
    }

    pub fn cancelled(&self) -> bool {
        self.cancelled.load(Ordering::SeqCst)
    }

    /// Generate SpinnerEntry list from words, using local claude CLI with progress callback
    pub async fn generate(
        &self,
        words: Vec<String>,
        progress_callback: impl Fn(usize, usize),
    ) -> Result<Vec<SpinnerEntry>, String> {
        let total = words.len();
        let batch_size = 20;
        let mut results = Vec::new();
        let mut processed = 0;

        for chunk in words.chunks(batch_size) {
            if self.cancelled() {
                return Err("Cancelled".to_string());
            }

            let batch_words: Vec<&str> = chunk.iter().map(|s| s.as_str()).collect();
            match self.generate_batch(&batch_words).await {
                Ok(entries) => results.extend(entries),
                Err(e) => {
                    for word in &batch_words {
                        results.push(SpinnerEntry {
                            verb: word.to_string(),
                            gloss: format!("[生成失败] {e}"),
                        });
                    }
                }
            }

            processed += chunk.len();
            progress_callback(processed, total);
        }

        Ok(results)
    }

    async fn generate_batch(&self, words: &[&str]) -> Result<Vec<SpinnerEntry>, String> {
        let system_prompt = self.system_prompt();

        let word_list: String = words
            .iter()
            .map(|w| format!("- {w}"))
            .collect::<Vec<_>>()
            .join("\n");
        let user_message = format!("输入动词列表：\n{word_list}");

        let output = tokio::process::Command::new("claude")
            .arg("-p")
            .arg("--system-prompt")
            .arg(system_prompt)
            .arg(&user_message)
            .output()
            .await
            .map_err(|e| format!("无法运行 claude CLI: {e}"))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("claude CLI 错误: {}", stderr));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        self.parse_response(&stdout)
    }

    fn system_prompt(&self) -> &'static str {
        r#"你是一个词汇学习助手。用户会提供英语动词列表，请为每个动词生成展示注释（gloss），格式为 "emoji — 场景描述"，帮助记忆该词：

1. emoji：最能表达该动词含义的 Emoji（1-2 个字符）
2. 一句简短的中文场景描述（10-20 字）

以 JSON 数组格式返回，只返回 JSON，不要其他文字：
[{"verb": "Pondering", "gloss": "🤔 — 正在思考方案利弊"}]"#
    }

    fn parse_response(&self, text: &str) -> Result<Vec<SpinnerEntry>, String> {
        let text = text.trim();
        let start = text.find('[');
        let end = text.rfind(']');
        let json_str = match (start, end) {
            (Some(s), Some(e)) => &text[s..=e],
            _ => text,
        };

        let entries: Vec<AiResponseEntry> =
            serde_json::from_str(json_str).map_err(|e| format!("JSON parse error: {e}"))?;

        Ok(entries
            .into_iter()
            .map(|e| SpinnerEntry {
                verb: e.verb,
                gloss: e.gloss,
            })
            .collect())
    }
}
