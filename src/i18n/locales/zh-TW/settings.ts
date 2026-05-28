export const settings = {
  actions: {
    runSync: "執行同步",
    saveAndEnable: "儲存並啟用同步",
    save: "儲存設定",
    testConnection: "測試連線",
  },
  description: "設定由後端管理的 Supabase 同步，避免暴露已儲存的 service role 密鑰。",
  form: {
    intervalSeconds: {
      errorPositiveInteger: "同步間隔必須為 0 或正整數",
      label: "同步間隔秒數",
    },
    serviceRoleKey: {
      label: "新的 service role key",
      placeholder: "留空則保留現有密鑰",
    },
    settings: {
      description: "設定值會儲存到後端同步服務。",
      title: "設定",
    },
    supabaseUrl: {
      label: "Supabase URL",
    },
  },
  errors: {
    enableBeforeRun: "請先啟用同步並儲存設定，再執行同步。",
  },
  home: "首頁",
  results: {
    manualSync: "手動同步",
    manualSyncSummary: "已推送 {{pushed}} 筆，已拉取 {{pulled}} 筆",
    noSyncRun: "尚未執行同步",
    noTestRun: "尚未測試連線",
    testConnection: "測試連線",
    title: "結果",
  },
  secret: {
    configured: "已設定",
    label: "Service role key",
    notConfigured: "未設定",
  },
  status: {
    disabled: "同步已關閉",
    enabled: "同步已開啟",
    loading: "正在載入狀態",
    never: "從未",
    noCursors: "暫無同步游標",
    title: "狀態",
  },
  success: {
    manualSyncFinished: "手動同步完成",
    settingsSaved: "設定已儲存",
  },
  title: "Supabase 同步",
};
