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
  /** Translation key for the content title shown in the settings header. */
  titleKey: string;
  /** Optional translation key for the settings header description. */
  descriptionKey?: string;
  /** Icon shown in the settings category navigation item. */
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Renders the real settings content for this category. */
  renderContent: (props: SettingsCategoryRenderProps) => ReactNode;
}

/** Static registry for real settings categories available in this module. */
export const settingsCategories: SettingsCategory[] = [
  {
    icon: RefreshCw,
    descriptionKey: "supabase.description",
    id: "sync",
    labelKey: "categories.sync",
    titleKey: "supabase.title",
    renderContent: ({ client }) => <SupabaseSettingsSection client={client} />,
  },
];
