use crate::models::SpinnerEntry;
use serde::Deserialize;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

#[derive(Debug, Deserialize)]
struct AiResponseEntry {
    verb: String,
    gloss: String,
}

pub struct AiGenerateService {
    api_key: String,
    cancelled: Arc<AtomicBool>,
}

impl AiGenerateService {
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            cancelled: Arc::new(AtomicBool::new(false)),
        }
    }

    pub fn cancel(&self) {
        self.cancelled.store(true, Ordering::SeqCst);
    }

    pub fn cancelled(&self) -> bool {
        self.cancelled.load(Ordering::SeqCst)
    }

    /// Generate SpinnerEntry list from words, with progress callback
    pub async fn generate(
        &self,
        words: Vec<String>,
        progress_callback: impl Fn(usize, usize),
    ) -> Result<Vec<SpinnerEntry>, String> {
        let total = words.len();
        let batch_size = 20;
        let mut results = Vec::new();

        for (batch_idx, chunk) in words.chunks(batch_size).enumerate() {
            if self.cancelled() {
                return Err("Cancelled".to_string());
            }

            let batch_words: Vec<&str> = chunk.iter().map(|s| s.as_str()).collect();
            match self.generate_batch(&batch_words).await {
                Ok(entries) => results.extend(entries),
                Err(e) => {
                    // Mark failed words with empty gloss
                    for word in &batch_words {
                        results.push(SpinnerEntry {
                            verb: word.to_string(),
                            gloss: format!("[生成失败] {e}"),
                        });
                    }
                }
            }

            progress_callback(
                (batch_idx + 1) * batch_size.min(chunk.len()),
                total,
            );
        }

        Ok(results)
    }

    async fn generate_batch(&self, words: &[&str]) -> Result<Vec<SpinnerEntry>, String> {
        let system_prompt = r#"你是一个词汇学习助手。用户会提供英语动词列表，请为每个动词生成展示注释（gloss），格式为 "emoji — 场景描述"，帮助记忆该词：

1. emoji：最能表达该动词含义的 Emoji（1-2 个字符）
2. 一句简短的中文场景描述（10-20 字）

以 JSON 数组格式返回，只返回 JSON，不要其他文字：
[{"verb": "Pondering", "gloss": "🤔 — 正在思考方案利弊"}]"#;

        let word_list: String = words.iter().map(|w| format!("- {w}")).collect::<Vec<_>>().join("\n");
        let user_message = format!("输入动词列表：\n{word_list}");

        let client = reqwest::Client::new();
        let mut retries = 0;
        loop {
            let resp = client
                .post("https://api.anthropic.com/v1/messages")
                .header("x-api-key", &self.api_key)
                .header("anthropic-version", "2023-06-01")
                .header("content-type", "application/json")
                .json(&serde_json::json!({
                    "model": "claude-sonnet-4-6",
                    "max_tokens": 4096,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": user_message}]
                }))
                .send()
                .await;

            match resp {
                Ok(r) if r.status().is_success() => {
                    let body: serde_json::Value = r.json().await.map_err(|e| e.to_string())?;
                    let text = body["content"][0]["text"]
                        .as_str()
                        .ok_or("Unexpected response format")?;
                    return self.parse_response(text);
                }
                Ok(r) if r.status().as_u16() == 429 => {
                    retries += 1;
                    if retries > 3 {
                        return Err("Rate limited after 3 retries".to_string());
                    }
                    let delay = 2u64.pow(retries);
                    tokio::time::sleep(std::time::Duration::from_secs(delay)).await;
                }
                Ok(r) => return Err(format!("API error: {}", r.status())),
                Err(e) => return Err(format!("Network error: {e}")),
            }
        }
    }

    fn parse_response(&self, text: &str) -> Result<Vec<SpinnerEntry>, String> {
        // Try to extract JSON array from text
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
