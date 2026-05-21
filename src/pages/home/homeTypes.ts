import type { ReactNode } from "react";

export interface ComposerTool {
  /** Stable tool identifier. */
  id: string;
  /** Accessible label for the tool button. */
  label: string;
  /** Icon or text rendered inside the tool button. */
  icon: ReactNode;
  /** Text inserted before the current selection. */
  before: string;
  /** Text inserted after the current selection. */
  after?: string;
  /** Cursor offset from insertion start when no text is selected. */
  cursorOffset?: number;
}
