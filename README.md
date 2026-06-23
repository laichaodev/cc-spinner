# CC Spinner

Claude Code Spinner 可视化管理器 —— 给 CC 的加载动画配上双语注释，等 AI 回复时顺手记单词。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-orange.svg)](https://tauri.app/)

## 是什么

Claude Code 等待时会显示一个动词短语（称为 spinner）。CC Spinner 提供了可视化界面来管理这些短语，为每个词条添加 emoji 注释，并一键写入 CC 配置。支持中英文界面、浅色/深色模式。

```
手动改 JSON → 改完就忘哪个词是什么意思
CC Spinner → 表格视图：词条 | 注释 | 时间，一目了然
```

## 功能

- **词组管理** — 创建/删除/复制/导入/导出，多套词库随意切换
- **表格编辑** — 词条 + 注释双栏编辑，300ms 防抖自动保存
- **一键切换** — 点击侧边栏激活，立刻写入 `~/.claude/settings.json`
- **替换 / 追加** — 覆盖默认词库或追加到末尾
- **AI 生成** — 粘贴单词列表，调用本地 `claude` CLI 批量生成注释
- **导入 / 导出** — .txt 导入（支持 `词条：注释` 格式），.json 导出备份
- **拖拽排序** — 词条列表和词组列表都支持鼠标拖拽排序
- **排序表头** — 点击词条/注释/时间表头切换升降序
- **浅色/深色模式** — 右下角一键切换
- **中英文切换** — 界面语言随时切换

## 存储位置

| 数据 | 路径 |
|------|------|
| 生效配置 | `~/.claude/settings.json` |
| 词组数据 | `~/.cc-spinner/profiles/` |
| 应用设置 | `~/.cc-spinner/settings.json` |
| 自动备份 | `~/.cc-spinner/backups/` |

## 数据结构

```jsonc
// 词组内部存储（~/.cc-spinner/profiles/*.json）
{ "verb": "Pondering", "gloss": "🤔 — 正在思考方案的利弊", "updated_at": "..." }

// 写入 CC 配置时拼接为纯文本
// → "Pondering 🤔 — 正在思考方案的利弊"
```

## 环境要求

- Node.js 18+
- pnpm 8+
- Rust 1.85+
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI（用于 AI 生成功能）

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 启动
pnpm tauri dev
```

日常用法：

1. 在左下角输入名称 → 创建词组
2. 点击工具栏「导入 .txt」或「AI 生成」添加词条
3. 在侧边栏点击「激活」
4. 正常使用 Claude Code，spinner 就会显示你的词库内容

## 导入文件格式

.txt 文件支持两种格式：

```
# 纯单词（gloss 为空）
Pondering
Refactoring
Debugging

# 词条：注释（自动拆分）
Pondering：🤔 — 正在思考方案的利弊
Refactoring：🔧 — 重构代码逻辑
Debugging：🐛 — 定位和修复问题
```

## 技术栈

| 层 | 选型 |
|----|------|
| 框架 | React 18 + TypeScript |
| 样式 | TailwindCSS |
| 状态 | TanStack Query v5 |
| 桌面 | Tauri 2 + Rust |

## 开发

```bash
pnpm dev            # 仅前端
pnpm tauri dev      # 前端 + 后端
pnpm typecheck      # TypeScript 检查
cargo check         # Rust 检查（在 src-tauri/ 下）
```

## License

MIT
