export type Lang = "zh" | "en";

export const strings: Record<Lang, Record<string, string>> = {
  zh: {
    // App
    "app.loading": "加载中…",

    // Sidebar
    "sidebar.empty": "暂无词组，点击下方按钮创建",
    "sidebar.placeholder": "词组名称",
    "sidebar.create": "新建",

    // ProfileItem
    "profile.activate": "激活",
    "profile.duplicate": "{name} (副本)",
    "profile.mode.replace": "替换",
    "profile.mode.append": "追加",
    "profile.entriesCount": "{count} 词条",

    // EditorToolbar
    "toolbar.replace": "替换",
    "toolbar.append": "追加",
    "toolbar.import": "导入 .txt",
    "toolbar.aiGen": "AI 生成",

    // EntryTable
    "entry.verb": "词条",
    "entry.gloss": "注释",
    "entry.time": "时间",
    "entry.deleteSelected": "删除选中",
    "entry.empty": "暂无词条，使用「AI 生成」或「导入 .txt」添加",
    "entry.newVerb": "新动词",
    "entry.newGloss": "注释",
    "entry.verbPlaceholder": "动词",
    "entry.glossPlaceholder": "注释（emoji + 场景描述）",

    // MainContent
    "main.empty": "选择或创建一个词组",

    // AI Dialog
    "ai.title": "AI 生成 Gloss",
    "ai.placeholder": "粘贴单词列表，每行一个\n例如：\nPondering\nRefactoring\nDebugging",
    "ai.generate": "生成",
    "ai.generating": "生成中…",
    "ai.addToGroup": "添加到词组",
    "ai.regenerate": "重新生成",
    "ai.cancelled": "已取消",
    "ai.failed": "[生成失败]",

    // StatusBar
    "status.inactive": "未激活",
    "status.replaceMode": "替换模式",
    "status.appendMode": "追加模式",
    "status.switchLight": "切换浅色模式",
    "status.switchDark": "切换深色模式",
    "status.switchZh": "Switch to English",
    "status.switchEn": "切换中文",

    // Misc
    "misc.empty": "(空)",
    "misc.none": "—",
  },

  en: {
    "app.loading": "Loading…",

    "sidebar.empty": "No word groups. Create one below.",
    "sidebar.placeholder": "Group name",
    "sidebar.create": "Create",

    "profile.activate": "Activate",
    "profile.duplicate": "{name} (copy)",
    "profile.mode.replace": "Replace",
    "profile.mode.append": "Append",
    "profile.entriesCount": "{count} entries",

    "toolbar.replace": "Replace",
    "toolbar.append": "Append",
    "toolbar.import": "Import .txt",
    "toolbar.aiGen": "AI Gen",

    "entry.verb": "VERB",
    "entry.gloss": "GLOSS",
    "entry.time": "Time",
    "entry.deleteSelected": "Delete ({n})",
    "entry.empty": "No entries. Use AI Gen or import .txt to add.",
    "entry.newVerb": "New verb",
    "entry.newGloss": "Gloss",
    "entry.verbPlaceholder": "Verb",
    "entry.glossPlaceholder": "Gloss (emoji + context)",

    "main.empty": "Select or create a word group",

    "ai.title": "AI Generate Gloss",
    "ai.placeholder": "Paste word list, one per line\ne.g.:\nPondering\nRefactoring\nDebugging",
    "ai.generate": "Generate",
    "ai.generating": "Generating…",
    "ai.addToGroup": "Add to group",
    "ai.regenerate": "Regenerate",
    "ai.cancelled": "Cancelled",
    "ai.failed": "[Failed]",

    "status.inactive": "Inactive",
    "status.replaceMode": "Replace mode",
    "status.appendMode": "Append mode",
    "status.switchLight": "Switch to light",
    "status.switchDark": "Switch to dark",
    "status.switchZh": "Switch to English",
    "status.switchEn": "中文",

    "misc.empty": "(empty)",
    "misc.none": "—",
  },
};

/** Simple translation function with placeholder replacement */
export function t(
  lang: Lang,
  key: string,
  params?: Record<string, string | number>
): string {
  let text = strings[lang][key] ?? strings["zh"][key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}
