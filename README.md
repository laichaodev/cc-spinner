# CC Spinner

Claude Code Spinner 可视化管理器 — 为 spinner 词条附加注释，在 CLI 等待时零成本背单词。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-orange.svg)](https://tauri.app/)

## 是什么

Claude Code 的 spinner 在等待时轮播动词短语。CC Spinner 在原生 `string[]` 之上为每个词附加注释（gloss），写入 `~/.claude/settings.json` 时拼接为 `"Pondering 🤔 — 正在思考方案的利弊..."`，让 spinner 变成词汇曝光工具。

```
直接编辑 JSON       →  记不住哪个词对应什么
CC Spinner 可视化    →  两列表格：verb | gloss，语义一目了然
```

## 当前功能 (v0.1 MVP)

- **Profile 管理** — 创建/删除/复制/导入/导出，多套词库随意切换
- **表格编辑** — verb + gloss 双栏编辑，所见即所得
- **一键切换** — 点击侧边栏 Profile，立刻写入 `~/.claude/settings.json`，无需重启
- **模式切换** — replace / append 一键切换
- **AI 生成** — 粘贴单词列表，调用 Claude API 批量生成中文注释
- **导入 .txt** — 纯单词列表（每行一个），导入后手动填写 gloss

## 数据结构

```jsonc
// Profile 内部（~/.cc-spinner/profiles/*.json）
{ "verb": "Pondering", "gloss": "🤔 — 正在思考方案的利弊..." }

// 写入 settings.json 时拼接
"Pondering 🤔 — 正在思考方案的利弊..."
```

## 存储位置

| 数据 | 路径 |
|------|------|
| 生效配置 | `~/.claude/settings.json` |
| Profile 库 | `~/.cc-spinner/profiles/` |
| 应用设置 | `~/.cc-spinner/settings.json` |
| 自动备份 | `~/.cc-spinner/backups/` |

## 快速上手

```bash
# 1. 安装依赖
pnpm install

# 2. 启动开发模式
pnpm tauri dev

# 3. 配置 AI 生成（可选）
echo "your-anthropic-api-key" > ~/.cc-spinner/.env
```

日常使用：
1. 创建 Profile → 2. 导入单词或 AI 生成注释 → 3. 点击「激活」→ 4. 正常使用 Claude Code

## 技术栈

| 层 | 选型 |
|----|------|
| 框架 | React 18 + TypeScript |
| 样式 | TailwindCSS |
| 状态 | TanStack Query v5 |
| 桌面 | Tauri 2 + Rust |

## 开发

```bash
# 环境要求
Node.js 18+, pnpm 8+, Rust 1.85+

# 常用命令
pnpm dev            # 仅前端
pnpm tauri dev      # 前端 + 后端
pnpm typecheck      # TypeScript 检查
cargo check         # Rust 检查（在 src-tauri/ 下）
```

## License

MIT
