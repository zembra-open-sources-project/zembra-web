export const settings = {
  actions: {
    runSync: "Run Sync",
    save: "Save Settings",
    testConnection: "Test Connection",
  },
  description:
    "Configure backend-managed Supabase synchronization without exposing stored service role secrets.",
  form: {
    enable: {
      description: "Backend controls the actual sync interval.",
      label: "Enable synchronization",
    },
    intervalSeconds: {
      errorPositiveInteger: "Interval seconds must be 0 or a positive integer",
      label: "Interval seconds",
    },
    serviceRoleKey: {
      label: "New service role key",
      placeholder: "Leave blank to keep the existing key",
    },
    settings: {
      description: "Values are saved by the backend sync service.",
      title: "Settings",
    },
    supabaseUrl: {
      label: "Supabase URL",
    },
  },
  errors: {
    enableBeforeRun: "Enable synchronization and save settings before running sync.",
  },
  home: "Home",
  results: {
    manualSync: "Manual Sync",
    manualSyncSummary: "Pushed {{pushed}}, pulled {{pulled}}",
    noSyncRun: "No sync run yet",
    noTestRun: "No test run yet",
    testConnection: "Test Connection",
    title: "Results",
  },
  secret: {
    configured: "Configured",
    label: "Service role key",
    notConfigured: "Not configured",
  },
  status: {
    disabled: "Sync disabled",
    enabled: "Sync enabled",
    loading: "Loading status",
    never: "Never",
    noCursors: "No sync cursors yet",
    title: "Status",
  },
  success: {
    manualSyncFinished: "Manual sync finished",
    settingsSaved: "Settings saved",
  },
  title: "Supabase Sync",
};
