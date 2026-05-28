import { RefreshCw } from "lucide-react";
import type { ComponentType, ReactNode, SVGProps } from "react";
import type { SyncClient } from "../../api/sync.client";
import { SupabaseSettingsSection } from "./SupabaseSettingsSection";

export type SettingsCategoryId = "sync";

export interface SettingsCategoryRenderProps {
  /** Optional synchronization client override used by tests and previews. */
  client?: SyncClient;
}

export interface SettingsCategory {
  /** Stable category identifier used for active navigation state. */
  id: SettingsCategoryId;
  /** Translation key for the visible category label. */
  labelKey: string;
  /** Icon shown in the settings category navigation item. */
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Renders the real settings content for this category. */
  renderContent: (props: SettingsCategoryRenderProps) => ReactNode;
}

/** Static registry for real settings categories available in this module. */
export const settingsCategories: SettingsCategory[] = [
  {
    icon: RefreshCw,
    id: "sync",
    labelKey: "categories.sync",
    renderContent: ({ client }) => <SupabaseSettingsSection client={client} />,
  },
];
