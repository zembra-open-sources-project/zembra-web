import { create } from "zustand";
import { taxonomyClient } from "../../api/client";
import type { FieldDto } from "../../api/types";

interface NotesState {
  /** Fields available for note organization. */
  fields: FieldDto[];
  /** Search keyword entered by the user. */
  keyword: string;
  /** Tag selected by the user. */
  selectedTag?: string;
  /** Field selected by the user. */
  selectedField?: string;
  /** Replaces the active search keyword. */
  setKeyword: (keyword: string) => void;
  /** Replaces the selected tag filter. */
  setSelectedTag: (tag?: string) => void;
  /** Replaces the selected field filter. */
  setSelectedField: (field?: string) => void;
  /** Loads fields from the active taxonomy client. */
  loadFields: () => Promise<void>;
}

/** Stores note list state for the card note interface. */
export const useNotesStore = create<NotesState>((set, get) => ({
  fields: [],
  keyword: "",
  selectedTag: undefined,
  selectedField: undefined,
  setKeyword: (keyword) => set({ keyword }),
  setSelectedTag: (selectedTag) => set({ selectedTag }),
  setSelectedField: (selectedField) => set({ selectedField }),
  loadFields: async () => {
    const existingFields = get().fields;

    if (existingFields.length > 0) {
      return;
    }

    const fields = await taxonomyClient.listFields();
    set({ fields });
  },
}));
