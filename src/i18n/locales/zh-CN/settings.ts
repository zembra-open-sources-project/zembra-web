export const settings = {
  actions: {
    runSync: "同步",
    saveAndEnable: "保存并启用同步",
    save: "保存",
    testConnection: "测试",
  },
  description: "配置由后端管理的 Supabase 同步，避免暴露已存储的 service role 密钥。",
  form: {
    intervalSeconds: {
      errorPositiveInteger: "同步间隔必须为 0 或正整数",
      label: "同步间隔秒数",
    },
    serviceRoleKey: {
      label: "新的 service role key",
      placeholder: "留空则保留现有密钥",
    },
    settings: {
      description: "配置值会保存到后端同步服务。",
      title: "设置",
    },
    supabaseUrl: {
      label: "Supabase URL",
    },
  },
  errors: {
    enableBeforeRun: "请先启用同步并保存设置，再运行同步。",
  },
  home: "首页",
  results: {
    manualSync: "手动同步",
    manualSyncSummary: "已推送 {{pushed}} 条，已拉取 {{pulled}} 条",
    noSyncRun: "尚未运行同步",
    noTestRun: "尚未测试连接",
    testConnection: "测试连接",
    title: "结果",
  },
  secret: {
    configured: "已配置",
    label: "Service role key",
    notConfigured: "未配置",
  },
  status: {
    disabled: "同步已关闭",
    enabled: "同步已开启",
    loading: "正在加载状态",
    never: "从未",
    noCursors: "暂无同步游标",
    title: "状态",
  },
  success: {
    manualSyncFinished: "手动同步完成",
    settingsSaved: "设置已保存",
  },
  title: "Supabase 同步",
};
