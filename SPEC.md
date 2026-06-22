# CC Spinner 技术规格

> 版本: 0.1.0 | 状态: MVP

---

## 1. 核心概念

Claude Code 原生 spinner 配置是 `~/.claude/settings.json` 中的简单字符串数组：

```jsonc
// ~/.claude/settings.json
// CC Spinner 写入时拼接两个字段：verb + gloss
{
  "spinnerVerbs": {
    "mode": "append",
    "verbs": [
      "Pondering 🤔 — 正在思考方案的利弊...",
      "Refactoring 🔧 — 代码正在重构中，请稍候..."
    ]
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `mode` | `"replace"` / `"append"` | `replace` 只用自己的词；`append` 追加到内置 185 个默认词之后 |
| `verbs` | `string[]` | CC Spinner 写入的字符串为 `"verb gloss"` 拼接格式 |

**CC Spinner 的增强**：在原生 `string[]` 之上，为每个词附加注释元数据，使得：

- **编辑时**：用户看到 `{verb, gloss}` 两个字段
- **写入时**：将 `{verb, gloss}` 拼接为单个字符串，组成 `string[]` 写入 `~/.claude/settings.json`
- **读取时**：解析 `string[]`，匹配本地 Profile 库还原完整结构

---

## 2. 数据模型

### 2.1 Profile 文件（内部存储）

路径：`~/.cc-spinner/profiles/<profile-name>.json`

```typescript
interface Profile {
  id: string;                  // 唯一标识，由文件名派生
  name: string;                // 显示名称
  mode: "replace" | "append";  // spinner 模式
  entries: SpinnerEntry[];     // 词条列表
  createdAt: string;           // ISO8601
  updatedAt: string;           // ISO8601
}

interface SpinnerEntry {
  verb: string;  // 动词短语，如 "Pondering"
  gloss: string; // 注释，拼接后组成 spinner 文本，如 "🤔 — 正在思考解决方案..."
}
```

示例：

```json
{
  "id": "gre-week3",
  "name": "GRE Week 3",
  "mode": "replace",
  "entries": [
    { "verb": "Pondering", "gloss": "🤔 — 正在思考方案的利弊..." },
    { "verb": "Refactoring", "gloss": "🔧 — 代码正在重构中，请稍候..." }
  ],
  "createdAt": "2026-06-22T10:00:00.000Z",
  "updatedAt": "2026-06-22T12:30:00.000Z"
}
```

### 2.2 settings.json 读写映射

**写入（Profile → settings.json）**：

```typescript
function formatSpinnerText(entry: SpinnerEntry): string {
  return `${entry.verb} ${entry.gloss}`;
}

function profileToSpinnerConfig(profile: Profile): SpinnerVerbsValue {
  return {
    mode: profile.mode,
    verbs: profile.entries.map(formatSpinnerText)
  };
}

function writeConfig(value: SpinnerVerbsValue): void {
  const settings = readJson("~/.claude/settings.json");
  settings.spinnerVerbs = value;
  atomicWrite("~/.claude/settings.json", settings);
}
```

**读取（settings.json → Profile）**：

```typescript
function readActiveSpinnerVerbs(): SpinnerVerbsValue | null {
  return readJson("~/.claude/settings.json")?.spinnerVerbs ?? null;
}

function extractVerb(spinnerText: string): string {
  return spinnerText.split(' ')[0];
}

function spinnerConfigToProfile(
  config: SpinnerVerbsValue,
  profileLibrary: Profile[]
): Profile | null {
  const verbs = config.verbs.map(extractVerb);
  return profileLibrary.find(p =>
    p.mode === config.mode &&
    jaccardSimilarity(p.entries.map(e => e.verb), verbs) >= 0.9
  ) ?? null;
}
```

> 使用 Jaccard 相似度（阈值 0.9）匹配，允许用户增删少量词条后仍能还原原 Profile。

### 2.3 应用设置

路径：`~/.cc-spinner/settings.json`

```typescript
interface AppSettings {
  activeProfileId: string | null;
  theme: "light" | "dark" | "system";
  windowBounds: { x: number; y: number; width: number; height: number };
}
```

### 2.4 备份

每次写入 `~/.claude/settings.json` 前自动备份到 `~/.cc-spinner/backups/`，保留最近 10 份。命名格式：`settings-YYYYMMDD-HHmmss.bak.json`。

---

## 3. Tauri Commands

Command 层只做参数解析和错误转换，业务逻辑在 Service 层。

### 3.1 Profile 管理

| Command | 入参 | 出参 | 说明 |
|---------|------|------|------|
| `list_profiles` | — | `Profile[]` | 列出所有 Profile |
| `create_profile` | `name: string, mode: string` | `Profile` | 创建空 Profile |
| `delete_profile` | `id: string` | `void` | 删除 Profile |
| `update_profile` | `id: string, profile: Partial<Profile>` | `Profile` | 更新 Profile 元数据 |
| `duplicate_profile` | `id: string, newName: string` | `Profile` | 复制 Profile |
| `import_profile` | `filePath: string` | `Profile` | 从 .json 文件导入 |
| `export_profile` | `id: string, filePath: string` | `void` | 导出为 .json 文件 |

### 3.2 词条编辑

| Command | 入参 | 出参 | 说明 |
|---------|------|------|------|
| `add_entries` | `profileId: string, entries: SpinnerEntry[]` | `Profile` | 批量添加词条 |
| `update_entry` | `profileId: string, index: number, entry: SpinnerEntry` | `Profile` | 更新单条词条 |
| `delete_entries` | `profileId: string, indices: number[]` | `Profile` | 批量删除词条 |
| `reorder_entries` | `profileId: string, fromIndex: number, toIndex: number` | `Profile` | 拖拽排序 |
| `import_words` | `profileId: string, filePath: string` | `Profile` | 从 .txt 导入纯单词列表（每行一个词） |

### 3.3 Profile 切换

| Command | 入参 | 出参 | 说明 |
|---------|------|------|------|
| `switch_profile` | `id: string` | `void` | 激活 Profile，写入 ~/.claude/settings.json |
| `get_active_profile` | — | `Profile \| null` | 获取当前激活的 Profile |

### 3.4 AI 生成

| Command | 入参 | 出参 | 说明 |
|---------|------|------|------|
| `ai_generate` | `words: string[]` | `SpinnerEntry[]` | 单词列表 → 带中文 gloss 的完整词条 |
| `abort_generate` | — | `void` | 取消正在进行的 AI 生成 |

### 3.5 应用设置

| Command | 入参 | 出参 | 说明 |
|---------|------|------|------|
| `get_app_settings` | — | `AppSettings` | 获取应用设置 |
| `update_app_settings` | `settings: Partial<AppSettings>` | `AppSettings` | 更新应用设置 |

### 3.6 事件（后端 → 前端推送）

| 事件名 | 数据 | 触发时机 |
|--------|------|----------|
| `profile-switched` | `{ id: string, name: string }` | Profile 切换成功 |
| `settings-external-change` | `void` | 外部程序修改了 settings.json |
| `ai-generate-progress` | `{ current: number, total: number }` | AI 批量生成进度 |

---

## 4. Rust Service 层

```
src-tauri/src/
├── main.rs               # 入口，注册 Commands
├── lib.rs                # AppState 定义
├── commands/
│   ├── profile.rs        # Profile CRUD Commands
│   ├── entries.rs        # 词条编辑 Commands
│   ├── switch.rs         # 切换 Commands
│   ├── ai.rs             # AI 生成 Commands
│   └── settings.rs       # 应用设置 Commands
├── services/
│   ├── profile.rs        # ProfileService — Profile 文件读写
│   ├── spinner_config.rs # SpinnerConfigService — settings.json 读写
│   └── ai_generate.rs    # AIGenerateService — 调用 Claude API
└── models/
    ├── profile.rs        # Profile / SpinnerEntry
    ├── settings.rs       # AppSettings
    └── spinner.rs        # SpinnerVerbsConfig（原生格式）
```

### AppState

```rust
pub struct AppState {
    pub profiles_dir: PathBuf,     // ~/.cc-spinner/profiles/
    pub settings_path: PathBuf,    // ~/.claude/settings.json
    pub app_settings_path: PathBuf,// ~/.cc-spinner/settings.json
    pub backup_dir: PathBuf,       // ~/.cc-spinner/backups/
}
```

---

## 5. 前端架构

### 5.1 技术栈

| 层 | 选型 |
|----|------|
| 框架 | React 18 + TypeScript |
| 构建 | Vite |
| 样式 | TailwindCSS + shadcn/ui |
| 状态管理 | TanStack Query v5（服务端状态）+ React Context（UI 状态） |
| 表单 | react-hook-form + zod |
| 桌面桥 | @tauri-apps/api |

### 5.2 组件树

```
App
├── TitleBar              # 顶部导航栏
├── Layout
│   ├── Sidebar           # 左侧：Profile 列表 + 底部 "+" 按钮
│   │   ├── ProfileList   # Profile 列表
│   │   └── ProfileItem   # 单个 Profile（点击切换，高亮当前）
│   └── MainContent       # 右侧主编辑区
│       ├── EditorToolbar # 工具栏：模式切换、导入/导出、AI 生成
│       ├── EntryTable    # 表格编辑器
│       │   └── EntryRow  # 单行：verb | gloss
│       └── AIGenerateDialog  # AI 生成弹窗
└── StatusBar             # 底部状态栏：当前激活 Profile + 词条数
```

### 5.3 前端 API 封装

```typescript
// src/lib/api/profiles.ts
export const profilesApi = {
  list:      ()          => invoke<Profile[]>("list_profiles"),
  create:    (name: string, mode: string) => invoke<Profile>("create_profile", { name, mode }),
  delete:    (id: string) => invoke<void>("delete_profile", { id }),
  update:    (id: string, profile: Partial<Profile>) => invoke<Profile>("update_profile", { id, profile }),
  switch:    (id: string) => invoke<void>("switch_profile", { id }),
  getActive: ()          => invoke<Profile | null>("get_active_profile"),
};
```

---

## 6. AI Generate 流程

```
用户操作
  1. 在弹窗中粘贴单词列表（每行一个）
  2. 点击「生成」
  3. 可随时点击「取消」中止
        │ invoke("ai_generate", { words })
        ▼
Rust 后端 (AIGenerateService)
  1. 验证 API Key（~/.cc-spinner/.env）
  2. 构建 System Prompt（中文输出）
  3. 分批（每批 20 个词）调用 Claude API
  4. 解析 JSON 响应 → Vec<SpinnerEntry>
  5. 通过 Tauri Event 推送进度
  6. 返回合并结果
        │
        ▼
前端
  1. 填入 EntryTable（失败词条标记红色）
  2. 用户逐条审核、修改
  3. 失败词条可单独重试
  4. 点击「保存」→ add_entries → 写入 Profile
```

### 错误处理

| 场景 | 处理方式 |
|------|----------|
| API Key 未配置 | 前端弹窗引导输入，写入 `~/.cc-spinner/.env` |
| 网络错误 / 超时 | 该批词条返回空，前端标记"生成失败"，支持重试 |
| API 返回非 JSON | 尝试截取 JSON 片段修复，仍失败则退回该批 |
| 用户取消 | 发送 `abort_generate`，保留已完成批次结果 |
| 速率限制 (429) | 指数退避重试最多 3 次，间隔 2s / 4s / 8s |

### System Prompt

```
你是一个词汇学习助手。用户会提供英语动词列表，请为每个动词生成
展示注释（gloss），格式为 "emoji — 场景描述"，帮助记忆该词：

1. emoji：最能表达该动词含义的 Emoji（1-2 个字符）
2. 一句简短的中文场景描述（10-20 字）

以 JSON 数组格式返回：
[{"verb": "Pondering", "gloss": "🤔 — 正在思考方案利弊"}]
```

---

## 7. 关键交互流程

### 7.1 切换 Profile

```
用户点击 Sidebar 中的 Profile
  → 前端: profilesApi.switch(id)
    → Rust: switch_profile command
      → ProfileService: 读取 Profile 文件
      → SpinnerConfigService: 写入 ~/.claude/settings.json
        → 临时文件 + rename（原子写入）
      → 发送 "profile-switched" 事件
  → 前端: 更新激活状态高亮，StatusBar 文字变更
  → Claude Code: 下次 spinner tick 自动读取新配置（无需重启）
```

### 7.2 启动恢复

```
应用启动
  → AppState 初始化，创建必要目录（profiles/, backups/）
  → 读取 ~/.claude/settings.json 中的 spinnerVerbs
  → 用 Jaccard 相似度匹配本地 Profile 库
  → 如无匹配（相似度 < 0.9），提示用户：
      - 关联到已有 Profile
      - 从当前配置创建新 Profile
      - 忽略
  → 前端收到 ready 事件，渲染界面
```

### 7.3 监听外部变更

```
文件监听器 (Rust: notify crate)
  → 检测到 ~/.claude/settings.json 被外部修改
  → 跳过应用自身触发的写入事件（自写保护标记）
  → 重新读取 spinner 配置
  → 对比当前激活 Profile，如不一致则更新 UI
  → 前端: 提示用户 "配置文件被外部修改，是否同步？"
```

---

## 8. 安全与健壮性

- **原子写入**：先写 `.tmp` 文件，成功后再 `rename`，防止崩溃损坏配置
- **备份**：每次写入前自动备份到 `backups/`，保留最近 10 份
- **校验**：Profile 文件读取后 JSON Schema 校验，写入前后各一次
- **文件锁**：写入 Profile 时使用 flock，防止并发冲突
- **自写保护**：写入前设置标记，file watcher 跳过自触发事件

---

## 9. MVP 范围

| 模块 | 说明 |
|------|------|
| Profile CRUD | 创建、删除、更新、复制、导入/导出 |
| 表格编辑词条 | verb + gloss 双栏编辑，拖拽排序 |
| 模式切换 | replace / append |
| settings.json 原子写入 | 拼接 verb+gloss 写入，自动备份 |
| AI 生成 | 单批 20 词，中文 gloss，支持取消和重试 |
| 导入 .txt | 纯单词列表（每行一个），导入后 gloss 为空 |

---

## 10. 开发环境

```bash
# 要求
Node.js 18+
pnpm 8+
Rust 1.85+
Tauri CLI 2.8+

# 起步
pnpm install
pnpm dev

# 质量检查
pnpm typecheck
pnpm format
pnpm test:unit
```
